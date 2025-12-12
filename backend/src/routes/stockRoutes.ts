import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF and image files
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// 1. Add new raw materials with supplier details
router.post("/materials", authenticateToken, requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]), async (req, res) => {
  try {
    // const {
    //   name,
    //   type,
    //   unit,
    //   currentStockQty,
    //   minThresholdQty,
    //   supplierName,
    //   billNumber,
    //   quantity,
    //   purchaseDate,
    //   costPerUnit,
    // } = req.body;

    const {
      name,
      type,
      unit,
      currentStockQty,
      minThresholdQty,
      purchaseHistory,
    } = req.body;

    // Validate required fields
    if (!name || !type || !unit || !currentStockQty || !minThresholdQty) {
      return res.status(400).json({
        error: "Missing required fields: name, type, unit, currentStockQty, minThresholdQty",
      });
    }

    // Check if material already exists
    const existingMaterial = await prisma.stockManagement.findUnique({
      where: { name },
    });

    if (existingMaterial) {
      return res.status(400).json({
        error: "Material with this name already exists",
      });
    }

    // Create purchase history entry
    let processedPurchaseHistory: any[] = [];
    if (purchaseHistory && Array.isArray(purchaseHistory) && purchaseHistory.length > 0) {
      processedPurchaseHistory = purchaseHistory.map((record: any) => ({
        supplierName: record.supplierName || null,
        billNumber: record.billNumber || null,
        purchaseDate: record.purchaseDate ? new Date(record.purchaseDate) : new Date(),
        purchasedQty: record.purchasedQty ? parseFloat(record.purchasedQty) : 0,
        costPerUnit: record.costPerUnit ? parseFloat(record.costPerUnit) : 0,
        scannedBillUrl: record.scannedBillUrl || null,
      }));
    }

    // Create the material
    const material = await prisma.stockManagement.create({
      data: {
        name,
        type,
        unit,
        currentStockQty: parseFloat(currentStockQty),
        minThresholdQty: parseFloat(minThresholdQty),
        purchaseHistory: processedPurchaseHistory,
      },
    });

    res.status(201).json({
      message: "Material added successfully",
      material,
    });
  } catch (error) {
    console.error("Error adding material:", error);
    res.status(500).json({
      error: "Failed to add material",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 2. Upload scanned purchase bills
router.post("/materials/:materialId/upload-bill", authenticateToken, requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]), upload.single("bill"), async (req, res) => {
  try {
    const { materialId } = req.params;
    const { billNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    if (!billNumber) {
      return res.status(400).json({
        error: "Bill number is required",
      });
    }

    // Get the material
    const material = await prisma.stockManagement.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return res.status(404).json({
        error: "Material not found",
      });
    }

    // Update the purchase history with the bill URL
    const updatedPurchaseHistory = material.purchaseHistory.map((record: any) => {
      if (record.billNumber === billNumber) {
        return {
          ...record,
          scannedBillUrl: `/uploads/${req.file!.filename}`,
        };
      }
      return record;
    });

    // Update the material
    const updatedMaterial = await prisma.stockManagement.update({
      where: { id: materialId },
      data: {
        purchaseHistory: updatedPurchaseHistory,
      },
    });

    res.json({
      message: "Bill uploaded successfully",
      billUrl: `/uploads/${req.file.filename}`,
      material: updatedMaterial,
    });
  } catch (error) {
    console.error("Error uploading bill:", error);
    res.status(500).json({
      error: "Failed to upload bill",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 3. View current stock levels
router.get("/materials", async (req, res) => {
  try {
    const { type, lowStock } = req.query;

    let whereClause: any = {};

    // Filter by stock type
    if (type) {
      whereClause.type = type;
    }

    // Filter for low stock items
    if (lowStock === "true") {
      whereClause.currentStockQty = {
        lte: prisma.stockManagement.fields.minThresholdQty,
      };
    }

    const materials = await prisma.stockManagement.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    // Add low stock alerts
    const materialsWithAlerts = materials.map((material: any) => ({
      ...material,
      isLowStock: material.currentStockQty <= material.minThresholdQty,
      stockStatus: material.currentStockQty <= material.minThresholdQty ? "LOW_STOCK" : "OK",
    }));

    res.json({
      materials: materialsWithAlerts,
      totalCount: materialsWithAlerts.length,
      lowStockCount: materialsWithAlerts.filter((m: any) => m.isLowStock).length,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({
      error: "Failed to fetch materials",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 4. Get material by ID with full details
router.get("/materials/:materialId", async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await prisma.stockManagement.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return res.status(404).json({
        error: "Material not found",
      });
    }

    res.json({
      material: {
        ...material,
        isLowStock: material.currentStockQty <= material.minThresholdQty,
        stockStatus: material.currentStockQty <= material.minThresholdQty ? "LOW_STOCK" : "OK",
      },
    });
  } catch (error) {
    console.error("Error fetching material:", error);
    res.status(500).json({
      error: "Failed to fetch material",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 5. Update stock quantity
router.patch("/materials/:materialId/stock", authenticateToken, requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]), async (req, res) => {
  try {
    const { materialId } = req.params;
    const { quantity, operation, notes } = req.body; // operation: 'add' or 'subtract'

    if (!quantity || !operation) {
      return res.status(400).json({
        error: "Quantity and operation are required",
      });
    }

    const material = await prisma.stockManagement.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return res.status(404).json({
        error: "Material not found",
      });
    }

    let newQuantity = material.currentStockQty;
    if (operation === "add") {
      newQuantity += parseFloat(quantity);
    } else if (operation === "subtract") {
      newQuantity -= parseFloat(quantity);
      if (newQuantity < 0) {
        return res.status(400).json({
          error: "Insufficient stock",
        });
      }
    } else {
      return res.status(400).json({
        error: "Invalid operation. Use 'add' or 'subtract'",
      });
    }

    const updatedMaterial = await prisma.stockManagement.update({
      where: { id: materialId },
      data: {
        currentStockQty: newQuantity,
      },
    });

    res.json({
      message: "Stock updated successfully",
      material: {
        ...updatedMaterial,
        isLowStock: updatedMaterial.currentStockQty <= updatedMaterial.minThresholdQty,
        stockStatus: updatedMaterial.currentStockQty <= updatedMaterial.minThresholdQty ? "LOW_STOCK" : "OK",
      },
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({
      error: "Failed to update stock",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 6. Get stock types summary
router.get("/stock-types", async (req, res) => {
  try {
    const stockTypes = await prisma.stockManagement.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
      _sum: {
        currentStockQty: true,
      },
    });

    const stockSummary = stockTypes.map((type: any) => ({
      type: type.type,
      count: type._count.id,
      totalQuantity: type._sum.currentStockQty || 0,
    }));

    res.json({
      stockTypes: stockSummary,
      totalMaterials: stockSummary.reduce((sum: number, type: any) => sum + type.count, 0),
    });
  } catch (error) {
    console.error("Error fetching stock types:", error);
    res.status(500).json({
      error: "Failed to fetch stock types",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 7. Get low stock alerts
router.get("/alerts/low-stock", async (req, res) => {
  try {
    const lowStockMaterials = await prisma.stockManagement.findMany({
      where: {
        currentStockQty: {
          lte: prisma.stockManagement.fields.minThresholdQty,
        },
      },
      orderBy: [
        { currentStockQty: "asc" },
        { name: "asc" },
      ],
    });

    const alerts = lowStockMaterials.map((material: any) => ({
      materialId: material.id,
      materialName: material.name,
      currentStock: material.currentStockQty,
      threshold: material.minThresholdQty,
      unit: material.unit,
      urgency: material.currentStockQty === 0 ? "CRITICAL" : "WARNING",
      message: material.currentStockQty === 0 
        ? `${material.name} is out of stock!`
        : `${material.name} is below minimum threshold (${material.currentStockQty} ${material.unit} < ${material.minThresholdQty} ${material.unit})`,
    }));

    res.json({
      alerts,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter((a: any) => a.urgency === "CRITICAL").length,
      warningAlerts: alerts.filter((a: any) => a.urgency === "WARNING").length,
    });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    res.status(500).json({
      error: "Failed to fetch low stock alerts",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 8. Delete material
router.delete("/materials/:materialId", authenticateToken, requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]), async (req, res) => {
  try {
    const { materialId } = req.params;

    // Check if material exists
    const material = await prisma.stockManagement.findUnique({
      where: { id: materialId },
      include: {
        ingredients: true,
        materialsUsed: true,
      },
    });

    if (!material) {
      return res.status(404).json({
        error: "Material not found",
      });
    }

    // Check if material is used in formulations
    if (material.ingredients.length > 0) {
      return res.status(400).json({
        error: "Cannot delete material that is used in formulations",
        details: `This material is used in ${material.ingredients.length} formulation(s)`,
      });
    }

    // Check if material is used in batches
    if (material.materialsUsed.length > 0) {
      return res.status(400).json({
        error: "Cannot delete material that has been used in batches",
        details: `This material has been used in ${material.materialsUsed.length} batch(es)`,
      });
    }

    // Delete the material
    await prisma.stockManagement.delete({
      where: { id: materialId },
    });

    res.json({
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting material:", error);
    res.status(500).json({
      error: "Failed to delete material",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
