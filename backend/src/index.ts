import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { PrismaClient } from "./generated/prisma";
import stockRoutes from "./routes/stockRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import formulationRoutes from "./routes/formulationRoutes";
import batchRoutes from "./routes/batchRoutes";
import finishedGoodsRoutes from "./routes/finishedGoodsRoutes";
import clientRoutes from "./routes/clientRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import dispatchRoutes from "./routes/dispatchRoutes";
import feedbackRoutes from "./routes/feedbackRoutes";
import workerEfficiencyRoutes from "./routes/workerEfficiencyRoutes";
import profitLossRoutes from "./routes/profitLossRoutes";
import companyRoutes from "./routes/companyRoutes";

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded bills
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/stock", stockRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/formulations", formulationRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/finished-goods", finishedGoodsRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dispatches", dispatchRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/worker-efficiency", workerEfficiencyRoutes);
app.use("/api/profit-loss", profitLossRoutes);
app.use("/api/company-profiles", companyRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "UMMS Backend is running" });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Serve static files from frontend build (production)
// Only serve frontend if dist folder exists
const frontendDistPath = path.join(__dirname, "../../frontend/dist");

if (fs.existsSync(frontendDistPath)) {
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(frontendDistPath));

  // Serve frontend for all non-API routes (SPA fallback for React Router)
  app.get("*", (req, res, next) => {
    // Don't serve frontend for API routes
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ error: "Route not found" });
    }
    // Serve index.html for all other routes (React Router handles client-side routing)
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  // If frontend dist doesn't exist, just return 404 for non-API routes
  app.use("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.status(404).json({ 
      error: "Route not found",
      message: "Frontend not built. Run 'npm run build' in the frontend directory."
    });
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 UMMS Backend server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Stock API: http://localhost:${PORT}/api/stock`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`🧪 Formulation API: http://localhost:${PORT}/api/formulations`);
  console.log(`🏭 Batch API: http://localhost:${PORT}/api/batches`);
  console.log(`📦 Finished Goods API: http://localhost:${PORT}/api/finished-goods`);
  console.log(`👥 Client API: http://localhost:${PORT}/api/clients`);
  console.log(`🧾 Invoice API: http://localhost:${PORT}/api/invoices`);
  console.log(`🚚 Dispatch API: http://localhost:${PORT}/api/dispatches`);
  console.log(`💬 Feedback API: http://localhost:${PORT}/api/feedback`);
  console.log(`⭐ Worker Efficiency API: http://localhost:${PORT}/api/worker-efficiency`);
  console.log(`💰 Profit & Loss API: http://localhost:${PORT}/api/profit-loss`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };