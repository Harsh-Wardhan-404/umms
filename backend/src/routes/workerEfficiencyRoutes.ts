import express from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireSupervisor, requireManager } from "../middleware/auth";
import {
  calculateWorkerEfficiency,
  updateWorkerEfficiencyRecord,
} from "../services/efficiencyCalculator";
import {
  generateMonthlyPDF,
  generateMonthlyExcel,
  generateAllWorkersReport,
} from "../services/reportGenerator";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/worker-efficiency
 * List all workers with efficiency metrics (paginated)
 */
router.get("/", authenticateToken, requireSupervisor, async (req, res) => {
  try {
    const {
      page = "1",
      limit = "20",
      sortBy = "efficiencyRating",
      sortOrder = "desc",
      minRating,
      maxRating,
      role,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {
      workerEfficiency: {
        isNot: null,
      },
    };

    if (role) {
      whereClause.role = role;
    }

    // Get users with efficiency records
    let users = await prisma.user.findMany({
      where: whereClause,
      include: {
        workerEfficiency: true,
      },
      orderBy:
        sortBy === "name"
          ? { firstName: sortOrder as "asc" | "desc" }
          : sortBy === "efficiencyRating"
          ? { workerEfficiency: { efficiencyRating: sortOrder as "asc" | "desc" } }
          : sortBy === "punctualityScore"
          ? { workerEfficiency: { punctualityScore: sortOrder as "asc" | "desc" } }
          : { createdAt: "desc" },
      skip,
      take: limitNum,
    });

    // Filter by rating if specified
    if (minRating || maxRating) {
      users = users.filter((user) => {
        const rating = user.workerEfficiency?.efficiencyRating || 0;
        if (minRating && rating < parseFloat(minRating as string)) return false;
        if (maxRating && rating > parseFloat(maxRating as string)) return false;
        return true;
      });
    }

    // Count total
    const total = await prisma.user.count({
      where: whereClause,
    });

    // Calculate stats
    const allUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        workerEfficiency: true,
      },
    });

    const avgEfficiency =
      allUsers.reduce((sum, u) => sum + (u.workerEfficiency?.efficiencyRating || 0), 0) /
        allUsers.length || 0;

    const topPerformer = allUsers.sort(
      (a, b) =>
        (b.workerEfficiency?.efficiencyRating || 0) -
        (a.workerEfficiency?.efficiencyRating || 0)
    )[0];

    const needAttention = allUsers.filter(
      (u) => (u.workerEfficiency?.efficiencyRating || 0) < 3
    ).length;

    res.json({
      data: users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        username: u.username,
        email: u.email,
        role: u.role,
        efficiencyRating: u.workerEfficiency?.efficiencyRating || 0,
        punctualityScore: u.workerEfficiency?.punctualityScore || 0,
        totalBatchesCompleted: u.workerEfficiency?.totalBatchesCompleted || 0,
        onTimeBatches: u.workerEfficiency?.onTimeBatches || 0,
        lastCalculated: u.workerEfficiency?.lastCalculated || null,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        totalWorkers: allUsers.length,
        avgEfficiency: avgEfficiency.toFixed(2),
        topPerformer: topPerformer
          ? {
              id: topPerformer.id,
              name: `${topPerformer.firstName} ${topPerformer.lastName}`,
              rating: topPerformer.workerEfficiency?.efficiencyRating || 0,
            }
          : null,
        needAttention,
      },
    });
  } catch (error: any) {
    console.error("Error fetching worker efficiency list:", error);
    res.status(500).json({ error: "Failed to fetch worker efficiency data" });
  }
});

/**
 * GET /api/worker-efficiency/:userId
 * Get specific worker's efficiency details
 */
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is viewing their own data or is a supervisor/manager
    const requestingUser = (req as any).user;
    const isSelfView = requestingUser.userId === userId;
    const hasViewPermission = ["Admin", "ProductionManager", "Supervisor"].includes(
      requestingUser.role
    );

    if (!isSelfView && !hasViewPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerEfficiency: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Calculate fresh efficiency data
    const efficiencyData = await calculateWorkerEfficiency(userId);

    // Get recent feedbacks
    const recentFeedbacks = await prisma.workerFeedback.findMany({
      where: { workerId: userId },
      include: {
        supervisor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    res.json({
      worker: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      efficiency: efficiencyData,
      standardOutput: user.workerEfficiency?.standardOutputQtyPerShift || 0,
      recentFeedbacks: recentFeedbacks.map((f) => ({
        id: f.id,
        feedbackTag: f.feedbackTag,
        comments: f.comments,
        supervisor: `${f.supervisor.firstName} ${f.supervisor.lastName}`,
        createdAt: f.createdAt,
      })),
      lastCalculated: user.workerEfficiency?.lastCalculated || null,
    });
  } catch (error: any) {
    console.error("Error fetching worker efficiency details:", error);
    res.status(500).json({ error: "Failed to fetch worker efficiency details" });
  }
});

/**
 * POST /api/worker-efficiency/:userId/calculate
 * Manually trigger efficiency recalculation (Admin only)
 */
router.post(
  "/:userId/calculate",
  authenticateToken,
  requireManager,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "Worker not found" });
      }

      const efficiencyData = await calculateWorkerEfficiency(userId);
      await updateWorkerEfficiencyRecord(userId, efficiencyData);

      res.json({
        message: "Efficiency recalculated successfully",
        efficiency: efficiencyData,
      });
    } catch (error: any) {
      console.error("Error recalculating efficiency:", error);
      res.status(500).json({ error: "Failed to recalculate efficiency" });
    }
  }
);

/**
 * POST /api/worker-efficiency/:userId/set-standard-output
 * Set standard output for a worker (Manager/Supervisor only)
 */
router.post(
  "/:userId/set-standard-output",
  authenticateToken,
  requireSupervisor,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { standardOutputQtyPerShift } = req.body;

      if (!standardOutputQtyPerShift || standardOutputQtyPerShift <= 0) {
        return res.status(400).json({ error: "Valid standard output is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "Worker not found" });
      }

      // Upsert worker efficiency record with new standard output
      const workerEfficiency = await prisma.workerEfficiency.upsert({
        where: { userId },
        update: {
          standardOutputQtyPerShift: parseFloat(standardOutputQtyPerShift),
          updatedAt: new Date(),
        },
        create: {
          userId,
          standardOutputQtyPerShift: parseFloat(standardOutputQtyPerShift),
          punctualityScore: 0,
          efficiencyRating: 0,
          batchHistory: [],
          totalBatchesCompleted: 0,
          onTimeBatches: 0,
        },
      });

      res.json({
        message: "Standard output set successfully",
        workerEfficiency,
      });
    } catch (error: any) {
      console.error("Error setting standard output:", error);
      res.status(500).json({ error: "Failed to set standard output" });
    }
  }
);

/**
 * GET /api/worker-efficiency/:userId/batches
 * Get worker's batch history with performance
 */
router.get("/:userId/batches", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, status } = req.query;

    // Permission check
    const requestingUser = (req as any).user;
    const isSelfView = requestingUser.userId === userId;
    const hasViewPermission = ["Admin", "ProductionManager", "Supervisor"].includes(
      requestingUser.role
    );

    if (!isSelfView && !hasViewPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const whereClause: any = {
      workers: {
        has: userId,
      },
    };

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const batches = await prisma.batch.findMany({
      where: whereClause,
      include: {
        formulationVersion: {
          include: {
            formulation: true,
          },
        },
        supervisor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    // Get worker's standard output
    const workerEfficiency = await prisma.workerEfficiency.findUnique({
      where: { userId },
    });
    const standardOutput = workerEfficiency?.standardOutputQtyPerShift || 0;

    const batchesWithPerformance = batches.map((batch) => {
      const actualDuration = batch.endTime
        ? new Date(batch.endTime).getTime() - new Date(batch.startTime).getTime()
        : null;
      const durationHours = actualDuration ? actualDuration / (1000 * 60 * 60) : null;
      const isOnTime = durationHours ? durationHours <= 12 : null; // 12 hours max

      const efficiency = standardOutput > 0 ? (batch.batchSize / standardOutput) * 100 : 0;

      return {
        id: batch.id,
        batchCode: batch.batchCode,
        productName: batch.productName,
        batchSize: batch.batchSize,
        startTime: batch.startTime,
        endTime: batch.endTime,
        durationHours: durationHours ? durationHours.toFixed(2) : null,
        isOnTime,
        efficiency: efficiency.toFixed(1),
        status: batch.status,
        supervisor: `${batch.supervisor.firstName} ${batch.supervisor.lastName}`,
      };
    });

    res.json({
      batches: batchesWithPerformance,
      total: batches.length,
      standardOutput,
    });
  } catch (error: any) {
    console.error("Error fetching worker batches:", error);
    res.status(500).json({ error: "Failed to fetch worker batches" });
  }
});

/**
 * POST /api/worker-efficiency/:userId/feedback
 * Add supervisor feedback (Supervisor/Manager only)
 */
router.post(
  "/:userId/feedback",
  authenticateToken,
  requireSupervisor,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { batchId, feedbackTag, comments } = req.body;
      const supervisorId = (req as any).user.userId;

      // Validate feedback tag
      const validTags = ["Excellent", "Good", "Needs Improvement", "Late"];
      if (!validTags.includes(feedbackTag)) {
        return res.status(400).json({ error: "Invalid feedback tag" });
      }

      // Check if worker exists
      const worker = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      // Check if batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      // Check if worker was part of the batch
      if (!batch.workers.includes(userId)) {
        return res.status(400).json({ error: "Worker was not assigned to this batch" });
      }

      // Create feedback
      const feedback = await prisma.workerFeedback.create({
        data: {
          workerId: userId,
          batchId,
          supervisorId,
          feedbackTag,
          comments: comments || null,
        },
        include: {
          supervisor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Recalculate efficiency
      const efficiencyData = await calculateWorkerEfficiency(userId);
      await updateWorkerEfficiencyRecord(userId, efficiencyData);

      res.status(201).json({
        message: "Feedback added successfully",
        feedback: {
          id: feedback.id,
          feedbackTag: feedback.feedbackTag,
          comments: feedback.comments,
          supervisor: `${feedback.supervisor.firstName} ${feedback.supervisor.lastName}`,
          createdAt: feedback.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error adding feedback:", error);
      res.status(500).json({ error: "Failed to add feedback" });
    }
  }
);

/**
 * GET /api/worker-efficiency/:userId/feedback
 * Get worker's feedback history
 */
router.get("/:userId/feedback", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Permission check
    const requestingUser = (req as any).user;
    const isSelfView = requestingUser.userId === userId;
    const hasViewPermission = ["Admin", "ProductionManager", "Supervisor"].includes(
      requestingUser.role
    );

    if (!isSelfView && !hasViewPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const whereClause: any = {
      workerId: userId,
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const feedbacks = await prisma.workerFeedback.findMany({
      where: whereClause,
      include: {
        supervisor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Count by tag
    const tagCounts = {
      Excellent: 0,
      Good: 0,
      "Needs Improvement": 0,
      Late: 0,
    };

    feedbacks.forEach((f) => {
      if (tagCounts.hasOwnProperty(f.feedbackTag)) {
        tagCounts[f.feedbackTag as keyof typeof tagCounts]++;
      }
    });

    res.json({
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        batchId: f.batchId,
        feedbackTag: f.feedbackTag,
        comments: f.comments,
        supervisor: `${f.supervisor.firstName} ${f.supervisor.lastName}`,
        createdAt: f.createdAt,
      })),
      total: feedbacks.length,
      tagCounts,
    });
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

/**
 * GET /api/worker-efficiency/:userId/report
 * Generate monthly report data
 */
router.get("/:userId/report", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    // Permission check
    const requestingUser = (req as any).user;
    const isSelfView = requestingUser.userId === userId;
    const hasViewPermission = ["Admin", "ProductionManager", "Supervisor"].includes(
      requestingUser.role
    );

    if (!isSelfView && !hasViewPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const reportMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);

    const { getMonthlyReportData } = await import("../services/reportGenerator");
    const reportData = await getMonthlyReportData(userId, reportMonth);

    res.json(reportData);
  } catch (error: any) {
    console.error("Error generating report data:", error);
    res.status(500).json({ error: "Failed to generate report data" });
  }
});

/**
 * GET /api/worker-efficiency/:userId/report/pdf
 * Export PDF report
 */
router.get("/:userId/report/pdf", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    // Permission check
    const requestingUser = (req as any).user;
    const hasExportPermission = ["Admin", "ProductionManager"].includes(
      requestingUser.role
    );

    if (!hasExportPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const reportMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);

    const pdfBuffer = await generateMonthlyPDF(userId, reportMonth);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="worker-report-${userId}-${year}-${month}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Error generating PDF report:", error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
});

/**
 * GET /api/worker-efficiency/:userId/report/excel
 * Export Excel report
 */
router.get("/:userId/report/excel", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    // Permission check
    const requestingUser = (req as any).user;
    const hasExportPermission = ["Admin", "ProductionManager"].includes(
      requestingUser.role
    );

    if (!hasExportPermission) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const reportMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);

    const excelBuffer = await generateMonthlyExcel(userId, reportMonth);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="worker-report-${userId}-${year}-${month}.xlsx"`
    );
    res.send(excelBuffer);
  } catch (error: any) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

/**
 * GET /api/worker-efficiency/reports/monthly
 * Get all workers' monthly summary
 */
router.get("/reports/monthly", authenticateToken, requireManager, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const reportMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);

    const reports = await generateAllWorkersReport(reportMonth);

    res.json({
      month: reportMonth,
      reports: reports.map((r) => ({
        worker: r.worker,
        efficiency: r.efficiency,
        batchCount: r.batches.length,
        feedbackCount: r.feedbacks.length,
      })),
      total: reports.length,
    });
  } catch (error: any) {
    console.error("Error generating monthly summary:", error);
    res.status(500).json({ error: "Failed to generate monthly summary" });
  }
});

export default router;

