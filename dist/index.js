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
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./generated/prisma");
const stockRoutes_1 = __importDefault(require("./routes/stockRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const formulationRoutes_1 = __importDefault(require("./routes/formulationRoutes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new prisma_1.PrismaClient();
exports.prisma = prisma;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static file serving for uploaded bills
app.use("/uploads", express_1.default.static("uploads"));
// Routes
app.use("/api/stock", stockRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/formulations", formulationRoutes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "UMMS Backend is running" });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 UMMS Backend server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Stock API: http://localhost:${PORT}/api/stock`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`🧪 Formulation API: http://localhost:${PORT}/api/formulations`);
});
// Graceful shutdown
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("SIGTERM received, shutting down gracefully");
    yield prisma.$disconnect();
    process.exit(0);
}));
