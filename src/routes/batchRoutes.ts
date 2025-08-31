import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/batches/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Generate unique batch code
function generateBatchCode(productName: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const productCode = productName.substring(0, 3).toUpperCase();
  return `${productCode}-${timestamp}-${random}`.toUpperCase();
}

// Calculate ingredient requirements based on batch size
async function calculateIngredientRequirements(
  formulationVersionId: string,
  batchSize: number
): Promise<Array<{ materialId: string; quantityRequired: number; unit: string }>> {
  const ingredients = await prisma.formulationIngredient.findMany({
    where: { formulationVersionId },
    include: { material: true },
  });

  return ingredients.map((ingredient) => ({
    materialId: ingredient.materialId,
    quantityRequired: (ingredient.percentageOrComposition / 100) * batchSize,
    unit: ingredient.unit,
  }));
}

// Check material availability
async function checkMaterialAvailability(
  requirements: Array<{ materialId: string; quantityRequired: number }>
): Promise<{ available: boolean; shortages: Array<{ materialId: string; required: number; available: number }> }> {
  const shortages: Array<{ materialId: string; required: number; available: number }> = [];

  for (const req of requirements) {
    const material = await prisma.stockManagement.findUnique({
      where: { id: req.materialId },
    });

    if (!material || material.currentStockQty < req.quantityRequired) {
      shortages.push({
        materialId: req.materialId,
        required: req.quantityRequired,
        available: material?.currentStockQty || 0,
      });
    }
  }

  return {
    available: shortages.length === 0,
    shortages,
  };
}

// Deduct materials from inventory
async function deductMaterials(
  requirements: Array<{ materialId: string; quantityRequired: number }>
): Promise<void> {
  for (const req of requirements) {
    await prisma.stockManagement.update({
      where: { id: req.materialId },
      data: {
        currentStockQty: {
          decrement: req.quantityRequired,
        },
      },
    });
  }
}

// Create new batch
router.post("/", authenticateToken, requireRole(["Admin", "Supervisor"]), async (req: Request, res: Response) => {
  try {
    const {
      productName,
      formulationVersionId,
      batchSize,
      workers,
      shift,
      startTime,
      productionNotes,
    } = req.body;

    // Validate required fields
    if (!productName || !formulationVersionId || !batchSize || !workers || !shift || !startTime) {
      return res.status(400).json({
        error: "Missing required fields: productName, formulationVersionId, batchSize, workers, shift, startTime",
      });
    }

    // Validate formulation version exists and is locked
    const formulationVersion = await prisma.formulationVersion.findUnique({
      where: { id: formulationVersionId },
      include: { formulation: true },
    });

    if (!formulationVersion) {
      return res.status(404).json({ error: "Formulation version not found" });
    }

    if (!formulationVersion.isLocked) {
      return res.status(400).json({ error: "Cannot create batch with unlocked formulation version" });
    }

    // Calculate ingredient requirements
    const requirements = await calculateIngredientRequirements(formulationVersionId, batchSize);

    // Check material availability
    const availability = await checkMaterialAvailability(requirements);
    if (!availability.available) {
      return res.status(400).json({
        error: "Insufficient materials for batch",
        shortages: availability.shortages,
      });
    }

    // Generate batch code
    const batchCode = generateBatchCode(productName);

    // Generate QR code data
    const qrCodeData = JSON.stringify({
      batchCode,
      productName,
      formulationVersion: formulationVersion.versionNumber,
      batchSize,
      startTime,
    });

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        batchCode,
        productName,
        formulationVersionId,
        batchSize,
        supervisorId: req.user!.userId,
        workers,
        shift,
        startTime: new Date(startTime),
        status: "Planned",
        qrCodeData,
        productionNotes,
        rawMaterialsUsed: requirements.map((req) => ({
          materialId: req.materialId,
          quantityRequired: req.quantityRequired,
          unit: req.unit,
        })),
        photos: [],
        qualityChecks: [],
      },
      include: {
        formulationVersion: true,
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Deduct materials from inventory
    await deductMaterials(requirements);

    // Create batch material records
    const batchMaterials = await Promise.all(
      requirements.map((req) =>
        prisma.batchMaterial.create({
          data: {
            batchId: batch.id,
            materialId: req.materialId,
            quantityUsed: req.quantityRequired,
          },
        })
      )
    );

    res.status(201).json({
      message: "Batch created successfully",
      batch: {
        ...batch,
        materialsUsed: batchMaterials,
      },
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({ error: "Failed to create batch" });
  }
});

// Get all batches with filtering
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, productName, supervisorId, startDate, endDate, page = 1, limit = 10 } = req.query;

    const where: any = {};
    
    if (status) where.status = status;
    if (productName) where.productName = { contains: productName as string, mode: "insensitive" };
    if (supervisorId) where.supervisorId = supervisorId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [batches, totalCount] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          formulationVersion: {
            include: { formulation: true },
          },
          supervisor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          materialsUsed: {
            include: { material: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.batch.count({ where }),
    ]);

    res.json({
      batches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Failed to fetch batches" });
  }
});

// Get batch by ID with complete details
router.get("/:batchId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        formulationVersion: {
          include: {
            formulation: true,
            ingredients: {
              include: { material: true },
            },
          },
        },
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        materialsUsed: {
          include: { material: true },
        },
        finishedGood: true,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({ batch });
  } catch (error) {
    console.error("Error fetching batch:", error);
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

// Get batch by QR code
router.get("/qr/:batchCode", async (req: Request, res: Response) => {
  try {
    const { batchCode } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { batchCode },
      include: {
        formulationVersion: {
          include: {
            formulation: true,
            ingredients: {
              include: { material: true },
            },
          },
        },
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        materialsUsed: {
          include: { material: true },
        },
        finishedGood: true,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({ batch });
  } catch (error) {
    console.error("Error fetching batch by QR:", error);
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

// Update batch status
router.patch("/:batchId/status", authenticateToken, requireRole(["Admin", "Supervisor"]), async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { status, endTime, productionNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updateData: any = { status };
    if (endTime) updateData.endTime = new Date(endTime);
    if (productionNotes) updateData.productionNotes = productionNotes;

    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        formulationVersion: true,
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json({
      message: "Batch status updated successfully",
      batch,
    });
  } catch (error) {
    console.error("Error updating batch status:", error);
    res.status(500).json({ error: "Failed to update batch status" });
  }
});

// Upload photos for batch
router.post("/:batchId/photos", authenticateToken, requireRole(["Admin", "Supervisor", "Worker"]), upload.array("photos", 10), async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { photoType, notes } = req.body; // photoType: "before", "after", "quality_check"

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No photos uploaded" });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const photos = (req.files as Express.Multer.File[]).map((file) => ({
      type: photoType || "general",
      url: `/uploads/batches/${file.filename}`,
      notes: notes || "",
      timestamp: new Date(),
      uploadedBy: req.user!.userId,
    }));

    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        photos: {
          push: photos,
        },
      },
    });

    res.json({
      message: "Photos uploaded successfully",
      photos,
      batch: updatedBatch,
    });
  } catch (error) {
    console.error("Error uploading photos:", error);
    res.status(500).json({ error: "Failed to upload photos" });
  }
});

// Add quality check record
router.post("/:batchId/quality-checks", authenticateToken, requireRole(["Admin", "Supervisor", "Worker"]), async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { checkType, result, notes, inspectorId } = req.body;

    if (!checkType || !result) {
      return res.status(400).json({ error: "Check type and result are required" });
    }

    const qualityCheck = {
      id: uuidv4(),
      checkType,
      result, // "pass", "fail", "conditional"
      notes: notes || "",
      inspectorId: inspectorId || req.user!.userId,
      timestamp: new Date(),
    };

    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        qualityChecks: {
          push: qualityCheck,
        },
      },
    });

    res.json({
      message: "Quality check added successfully",
      qualityCheck,
      batch,
    });
  } catch (error) {
    console.error("Error adding quality check:", error);
    res.status(500).json({ error: "Failed to add quality check" });
  }
});

// Generate batch production report
router.get("/:batchId/report", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        formulationVersion: {
          include: {
            formulation: true,
            ingredients: {
              include: { material: true },
            },
          },
        },
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        materialsUsed: {
          include: { material: true },
        },
        finishedGood: true,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Calculate production efficiency
    const startTime = new Date(batch.startTime);
    const endTime = batch.endTime ? new Date(batch.endTime) : new Date();
    const productionTime = endTime.getTime() - startTime.getTime();
    const productionHours = productionTime / (1000 * 60 * 60);

    // Calculate material costs
    let totalMaterialCost = 0;
    for (const material of batch.materialsUsed) {
      // Get latest purchase price for the material
      const stock = await prisma.stockManagement.findUnique({
        where: { id: material.materialId },
      });
      
      if (stock && stock.purchaseHistory.length > 0) {
        const latestPurchase = stock.purchaseHistory[stock.purchaseHistory.length - 1] as any;
        totalMaterialCost += (latestPurchase.costPerUnit || 0) * material.quantityUsed;
      }
    }

    const report = {
      batchInfo: {
        batchCode: batch.batchCode,
        productName: batch.productName,
        formulationVersion: batch.formulationVersion.versionNumber,
        batchSize: batch.batchSize,
        status: batch.status,
        startTime: batch.startTime,
        endTime: batch.endTime,
        productionTime: productionHours,
        supervisor: batch.supervisor,
        workers: batch.workers,
        shift: batch.shift,
      },
      materials: {
        used: batch.materialsUsed,
        totalCost: totalMaterialCost,
      },
      quality: {
        checks: batch.qualityChecks,
        passRate: batch.qualityChecks.filter((check: any) => check.result === "pass").length / batch.qualityChecks.length * 100,
      },
      photos: batch.photos,
      productionNotes: batch.productionNotes,
      finishedGoods: batch.finishedGood,
      efficiency: {
        productionHours,
        outputPerHour: batch.finishedGood?.quantityProduced ? batch.finishedGood.quantityProduced / productionHours : 0,
      },
    };

    res.json({ report });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Get batch statistics
router.get("/stats/overview", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const [
      totalBatches,
      completedBatches,
      inProgressBatches,
      totalProduction,
      averageBatchSize,
      statusDistribution,
    ] = await Promise.all([
      prisma.batch.count({ where }),
      prisma.batch.count({ where: { ...where, status: "Completed" } }),
      prisma.batch.count({ where: { ...where, status: "InProgress" } }),
      prisma.batch.aggregate({
        where: { ...where, status: "Completed" },
        _sum: { batchSize: true },
      }),
      prisma.batch.aggregate({
        where: { ...where, status: "Completed" },
        _avg: { batchSize: true },
      }),
      prisma.batch.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
    ]);

    const stats = {
      totalBatches,
      completedBatches,
      inProgressBatches,
      totalProduction: totalProduction._sum.batchSize || 0,
      averageBatchSize: averageBatchSize._avg.batchSize || 0,
      completionRate: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
      statusDistribution,
    };

    res.json({ stats });
  } catch (error) {
    console.error("Error fetching batch stats:", error);
    res.status(500).json({ error: "Failed to fetch batch statistics" });
  }
});

export default router;
