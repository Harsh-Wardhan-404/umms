"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("../generated/prisma");
const router = express_1.default.Router();
const prisma = new prisma_1.PrismaClient();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Allow PDF and image files
        if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only PDF and image files are allowed"));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
// 1. Add new raw materials with supplier details
router.post("/materials", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, type, unit, currentStockQty, minThresholdQty, supplierName, billNumber, quantity, purchaseDate, costPerUnit, } = req.body;
        // Validate required fields
        if (!name || !type || !unit || !currentStockQty || !minThresholdQty) {
            return res.status(400).json({
                error: "Missing required fields: name, type, unit, currentStockQty, minThresholdQty",
            });
        }
        // Check if material already exists
        const existingMaterial = yield prisma.stockManagement.findUnique({
            where: { name },
        });
        if (existingMaterial) {
            return res.status(400).json({
                error: "Material with this name already exists",
            });
        }
        // Create purchase history entry
        const purchaseRecord = {
            supplierName,
            billNumber,
            purchaseDate: new Date(purchaseDate),
            purchasedQty: parseFloat(quantity),
            costPerUnit: parseFloat(costPerUnit),
            scannedBillUrl: null, // Will be updated when bill is uploaded
        };
        // Create the material
        const material = yield prisma.stockManagement.create({
            data: {
                name,
                type,
                unit,
                currentStockQty: parseFloat(currentStockQty),
                minThresholdQty: parseFloat(minThresholdQty),
                purchaseHistory: [purchaseRecord],
            },
        });
        res.status(201).json({
            message: "Material added successfully",
            material,
        });
    }
    catch (error) {
        console.error("Error adding material:", error);
        res.status(500).json({
            error: "Failed to add material",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// 2. Upload scanned purchase bills
router.post("/materials/:materialId/upload-bill", upload.single("bill"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const material = yield prisma.stockManagement.findUnique({
            where: { id: materialId },
        });
        if (!material) {
            return res.status(404).json({
                error: "Material not found",
            });
        }
        // Update the purchase history with the bill URL
        const updatedPurchaseHistory = material.purchaseHistory.map((record) => {
            if (record.billNumber === billNumber) {
                return Object.assign(Object.assign({}, record), { scannedBillUrl: `/uploads/${req.file.filename}` });
            }
            return record;
        });
        // Update the material
        const updatedMaterial = yield prisma.stockManagement.update({
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
    }
    catch (error) {
        console.error("Error uploading bill:", error);
        res.status(500).json({
            error: "Failed to upload bill",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// 3. View current stock levels
router.get("/materials", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, lowStock } = req.query;
        let whereClause = {};
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
        const materials = yield prisma.stockManagement.findMany({
            where: whereClause,
            orderBy: { name: "asc" },
        });
        // Add low stock alerts
        const materialsWithAlerts = materials.map((material) => (Object.assign(Object.assign({}, material), { isLowStock: material.currentStockQty <= material.minThresholdQty, stockStatus: material.currentStockQty <= material.minThresholdQty ? "LOW_STOCK" : "OK" })));
        res.json({
            materials: materialsWithAlerts,
            totalCount: materialsWithAlerts.length,
            lowStockCount: materialsWithAlerts.filter((m) => m.isLowStock).length,
        });
    }
    catch (error) {
        console.error("Error fetching materials:", error);
        res.status(500).json({
            error: "Failed to fetch materials",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// 4. Get material by ID with full details
router.get("/materials/:materialId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { materialId } = req.params;
        const material = yield prisma.stockManagement.findUnique({
            where: { id: materialId },
        });
        if (!material) {
            return res.status(404).json({
                error: "Material not found",
            });
        }
        res.json({
            material: Object.assign(Object.assign({}, material), { isLowStock: material.currentStockQty <= material.minThresholdQty, stockStatus: material.currentStockQty <= material.minThresholdQty ? "LOW_STOCK" : "OK" }),
        });
    }
    catch (error) {
        console.error("Error fetching material:", error);
        res.status(500).json({
            error: "Failed to fetch material",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// 5. Update stock quantity
router.patch("/materials/:materialId/stock", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { materialId } = req.params;
        const { quantity, operation, notes } = req.body; // operation: 'add' or 'subtract'
        if (!quantity || !operation) {
            return res.status(400).json({
                error: "Quantity and operation are required",
            });
        }
        const material = yield prisma.stockManagement.findUnique({
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
        }
        else if (operation === "subtract") {
            newQuantity -= parseFloat(quantity);
            if (newQuantity < 0) {
                return res.status(400).json({
                    error: "Insufficient stock",
                });
            }
        }
        else {
            return res.status(400).json({
                error: "Invalid operation. Use 'add' or 'subtract'",
            });
        }
        const updatedMaterial = yield prisma.stockManagement.update({
            where: { id: materialId },
            data: {
                currentStockQty: newQuantity,
            },
        });
        res.json({
            message: "Stock updated successfully",
            material: Object.assign(Object.assign({}, updatedMaterial), { isLowStock: updatedMaterial.currentStockQty <= updatedMaterial.minThresholdQty, stockStatus: updatedMaterial.currentStockQty <= updatedMaterial.minThresholdQty ? "LOW_STOCK" : "OK" }),
        });
    }
    catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({
            error: "Failed to update stock",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// 6. Get stock types summary
router.get("/stock-types", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stockTypes = yield prisma.stockManagement.groupBy({
            by: ["type"],
            _count: {
                id: true,
            },
            _sum: {
                currentStockQty: true,
            },
        });
        const stockSummary = stockTypes.map((type) => ({
            type: type.type,
            count: type._count.id,
            totalQuantity: type._sum.currentStockQty || 0,
        }));
        res.json({
            stockTypes: stockSummary,
            totalMaterials: stockSummary.reduce((sum, type) => sum + type.count, 0),
        });
    }
    catch (error) {
        console.error("Error fetching stock types:", error);
        res.status(500).json({
            error: "Failed to fetch stock types",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// 7. Get low stock alerts
router.get("/alerts/low-stock", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lowStockMaterials = yield prisma.stockManagement.findMany({
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
        const alerts = lowStockMaterials.map((material) => ({
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
            criticalAlerts: alerts.filter((a) => a.urgency === "CRITICAL").length,
            warningAlerts: alerts.filter((a) => a.urgency === "WARNING").length,
        });
    }
    catch (error) {
        console.error("Error fetching low stock alerts:", error);
        res.status(500).json({
            error: "Failed to fetch low stock alerts",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
exports.default = router;
