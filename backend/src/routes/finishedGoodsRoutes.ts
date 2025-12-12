import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 1. Create finished goods entry (post-production)
router.post("/", authenticateToken, requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]), async (req: Request, res: Response) => {
  try {
    const {
      batchId,
      productName,
      quantityProduced,
      availableQuantity,
      unit,
      unitPrice,
      hsnCode,
      qualityStatus,
    } = req.body;

    // Validate required fields
    if (!batchId || !productName || !quantityProduced || !availableQuantity || !unit || !unitPrice || !hsnCode) {
      return res.status(400).json({
        error: "Missing required fields: batchId, productName, quantityProduced, availableQuantity, unit, unitPrice, hsnCode",
      });
    }

    // Check if batch exists and is completed
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        formulationVersion: true,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    if (batch.status !== "Completed") {
      return res.status(400).json({ error: "Cannot create finished goods for incomplete batch" });
    }

    // Check if finished goods already exist for this batch
    const existingFinishedGood = await prisma.finishedGood.findUnique({
      where: { batchId },
    });

    if (existingFinishedGood) {
      return res.status(400).json({ error: "Finished goods already exist for this batch" });
    }

    // Validate quantity produced doesn't exceed batch size
    const parsedQuantityProduced = parseFloat(quantityProduced);
    if (parsedQuantityProduced > batch.batchSize) {
      return res.status(400).json({
        error: `Quantity produced (${parsedQuantityProduced}) cannot exceed batch size (${batch.batchSize})`,
      });
    }

    // Validate available quantity doesn't exceed quantity produced
    const parsedAvailableQuantity = parseFloat(availableQuantity);
    if (parsedAvailableQuantity > parsedQuantityProduced) {
      return res.status(400).json({
        error: `Available quantity (${parsedAvailableQuantity}) cannot exceed quantity produced (${parsedQuantityProduced})`,
      });
    }

    // Create finished goods entry
    const finishedGood = await prisma.finishedGood.create({
      data: {
        batchId,
        productName,
        formulationVersionId: batch.formulationVersionId, // Get from batch
        quantityProduced: parseFloat(quantityProduced),
        availableQuantity: parseFloat(availableQuantity),
        unit: unit || "pieces",
        unitPrice: parseFloat(unitPrice),
        hsnCode,
        qualityStatus: qualityStatus || "Approved",
      },
      include: {
        batch: {
          include: {
            formulationVersion: {
              include: { formulation: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: "Finished goods created successfully",
      finishedGood,
    });
  } catch (error) {
    console.error("Error creating finished goods:", error);
    res.status(500).json({ error: "Failed to create finished goods" });
  }
});

// 2. Get all finished goods with filtering
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      productName, 
      qualityStatus, 
      availableOnly, 
      page = 1, 
      limit = 10 
    } = req.query;

    const where: any = {};
    
    if (productName) where.productName = { contains: productName as string, mode: "insensitive" };
    if (qualityStatus) where.qualityStatus = qualityStatus;
    if (availableOnly === "true") where.availableQuantity = { gt: 0 };

    const skip = (Number(page) - 1) * Number(limit);

    const [finishedGoods, totalCount] = await Promise.all([
      prisma.finishedGood.findMany({
        where,
        include: {
          batch: {
            include: {
              formulationVersion: {
                include: { formulation: true },
              },
              supervisor: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.finishedGood.count({ where }),
    ]);

    res.json({
      finishedGoods,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching finished goods:", error);
    res.status(500).json({ error: "Failed to fetch finished goods" });
  }
});

// 3. Get finished goods by ID
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const finishedGood = await prisma.finishedGood.findUnique({
      where: { id },
      include: {
        batch: {
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
              select: { firstName: true, lastName: true, email: true },
            },
            materialsUsed: {
              include: { material: true },
            },
          },
        },
        invoiceItems: {
          include: { invoice: true },
        },
      },
    });

    if (!finishedGood) {
      return res.status(404).json({ error: "Finished goods not found" });
    }

    res.json({ finishedGood });
  } catch (error) {
    console.error("Error fetching finished goods:", error);
    res.status(500).json({ error: "Failed to fetch finished goods" });
  }
});

// 4. Update finished goods
router.patch("/:id", authenticateToken, requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      availableQuantity,
      unit,
      unitPrice,
      hsnCode,
      qualityStatus,
    } = req.body;

    const updateData: any = {};
    if (availableQuantity !== undefined) updateData.availableQuantity = parseFloat(availableQuantity);
    if (unit) updateData.unit = unit;
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice);
    if (hsnCode) updateData.hsnCode = hsnCode;
    if (qualityStatus) updateData.qualityStatus = qualityStatus;

    const finishedGood = await prisma.finishedGood.update({
      where: { id },
      data: updateData,
      include: {
        batch: {
          include: {
            formulationVersion: {
              include: { formulation: true },
            },
          },
        },
      },
    });

    res.json({
      message: "Finished goods updated successfully",
      finishedGood,
    });
  } catch (error) {
    console.error("Error updating finished goods:", error);
    res.status(500).json({ error: "Failed to update finished goods" });
  }
});

// 5. Get finished goods inventory summary
router.get("/inventory/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const [totalProducts, totalValue, lowStockItems, qualitySummary] = await Promise.all([
      prisma.finishedGood.count(),
      prisma.finishedGood.aggregate({
        _sum: {
          availableQuantity: true,
        },
      }),
      prisma.finishedGood.findMany({
        where: {
          availableQuantity: { lte: 10 },
        },
        select: {
          id: true,
          productName: true,
          availableQuantity: true,
          unitPrice: true,
        },
      }),
      prisma.finishedGood.groupBy({
        by: ["qualityStatus"],
        _count: { qualityStatus: true },
      }),
    ]);

    const summary = {
      totalProducts,
      totalAvailableQuantity: totalValue._sum.availableQuantity || 0,
      lowStockItems,
      qualitySummary,
    };

    res.json({ summary });
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    res.status(500).json({ error: "Failed to fetch inventory summary" });
  }
});

// 6. Get finished goods by batch
router.get("/batch/:batchId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const finishedGood = await prisma.finishedGood.findUnique({
      where: { batchId },
      include: {
        batch: {
          include: {
            formulationVersion: {
              include: { formulation: true },
            },
            supervisor: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!finishedGood) {
      return res.status(404).json({ error: "Finished goods not found for this batch" });
    }

    res.json({ finishedGood });
  } catch (error) {
    console.error("Error fetching finished goods by batch:", error);
    res.status(500).json({ error: "Failed to fetch finished goods" });
  }
});

// 7. Delete finished goods
router.delete("/:id", authenticateToken, requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if finished goods exists
    const finishedGood = await prisma.finishedGood.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
      },
    });

    if (!finishedGood) {
      return res.status(404).json({ error: "Finished goods not found" });
    }

    // Check if finished goods is used in invoices
    if (finishedGood.invoiceItems.length > 0) {
      return res.status(400).json({
        error: "Cannot delete finished goods that is used in invoices",
        details: `This finished good is referenced in ${finishedGood.invoiceItems.length} invoice(s)`
      });
    }

    // Delete the finished goods
    await prisma.finishedGood.delete({
      where: { id },
    });

    res.json({
      message: "Finished goods deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting finished goods:", error);
    res.status(500).json({ error: "Failed to delete finished goods" });
  }
});

export default router;
