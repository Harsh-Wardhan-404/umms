import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "./generated/prisma";
import stockRoutes from "./routes/stockRoutes";
import authRoutes from "./routes/authRoutes";
import formulationRoutes from "./routes/formulationRoutes";

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
app.use("/api/formulations", formulationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "UMMS Backend is running" });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };