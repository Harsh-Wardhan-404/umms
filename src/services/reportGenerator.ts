import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { PrismaClient } from "../generated/prisma";
import { calculateWorkerEfficiency, EfficiencyData } from "./efficiencyCalculator";

const prisma = new PrismaClient();

export interface ReportData {
  worker: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
  };
  month: Date;
  efficiency: EfficiencyData;
  batches: any[];
  feedbacks: any[];
  standardOutput: number;
}

/**
 * Get report data for a specific worker and month
 */
export async function getMonthlyReportData(
  workerId: string,
  month: Date
): Promise<ReportData> {
  // Get worker details
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  if (!worker) {
    throw new Error("Worker not found");
  }

  // Get month start and end dates
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  // Get batches for this worker in the month
  const batches = await prisma.batch.findMany({
    where: {
      workers: {
        has: workerId,
      },
      status: "Completed",
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
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
      startTime: "asc",
    },
  });

  // Get feedbacks for this worker in the month
  const feedbacks = await prisma.workerFeedback.findMany({
    where: {
      workerId: workerId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
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

  // Calculate efficiency (for the entire history)
  const efficiency = await calculateWorkerEfficiency(workerId);

  // Get standard output
  const workerEfficiency = await prisma.workerEfficiency.findUnique({
    where: { userId: workerId },
  });
  const standardOutput = workerEfficiency?.standardOutputQtyPerShift || 0;

  return {
    worker: {
      id: worker.id,
      name: `${worker.firstName} ${worker.lastName}`,
      username: worker.username,
      email: worker.email,
      role: worker.role,
    },
    month,
    efficiency,
    batches,
    feedbacks,
    standardOutput,
  };
}

/**
 * Generate PDF report for a worker's monthly performance
 */
export async function generateMonthlyPDF(
  workerId: string,
  month: Date
): Promise<Buffer> {
  const reportData = await getMonthlyReportData(workerId, month);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20).text("Worker Performance Report", { align: "center" });
      doc.moveDown();

      // Worker Info
      doc.fontSize(14).text(`Worker: ${reportData.worker.name}`, { continued: false });
      doc.fontSize(10).text(`Username: ${reportData.worker.username}`);
      doc.text(`Role: ${reportData.worker.role}`);
      doc.text(`Month: ${month.toLocaleString("default", { month: "long", year: "numeric" })}`);
      doc.moveDown();

      // Performance Summary
      doc.fontSize(14).text("Performance Summary", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);

      // Star rating display
      const stars = "★".repeat(Math.floor(reportData.efficiency.overallRating)) +
        "☆".repeat(5 - Math.floor(reportData.efficiency.overallRating));
      doc.font("Helvetica-Bold").text(`Overall Rating: ${stars} (${reportData.efficiency.overallRating}/5)`);
      doc.font("Helvetica");
      doc.moveDown(0.5);

      // Metrics
      doc.fontSize(10);
      doc.text(`Output Efficiency: ${reportData.efficiency.outputEfficiency.toFixed(1)}%`);
      doc.text(`Punctuality Score: ${reportData.efficiency.punctualityScore.toFixed(1)}%`);
      doc.text(`Feedback Score: ${reportData.efficiency.feedbackScore.toFixed(1)}%`);
      doc.text(`Total Batches Completed: ${reportData.efficiency.totalBatches}`);
      doc.text(`On-Time Batches: ${reportData.efficiency.onTimeBatches}/${reportData.efficiency.totalBatches}`);
      doc.text(`Standard Output per Shift: ${reportData.standardOutput} units`);
      doc.moveDown();

      // Feedback Summary
      doc.fontSize(14).text("Feedback Summary", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.fillColor("green").text(`✓ Positive Feedback: ${reportData.efficiency.positiveFeedbackCount}`, { continued: false });
      doc.fillColor("red").text(`✗ Negative Feedback: ${reportData.efficiency.negativeFeedbackCount}`);
      doc.fillColor("black");
      doc.moveDown();

      // Batch History Table
      if (reportData.batches.length > 0) {
        doc.fontSize(14).text("Batch History (This Month)", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(8);

        // Table header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 150;
        const col3 = 280;
        const col4 = 360;
        const col5 = 450;

        doc.text("Batch Code", col1, tableTop);
        doc.text("Product", col2, tableTop);
        doc.text("Batch Size", col3, tableTop);
        doc.text("Date", col4, tableTop);
        doc.text("Supervisor", col5, tableTop);

        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.3);

        // Table rows (limit to 20 for space)
        reportData.batches.slice(0, 20).forEach((batch) => {
          const rowY = doc.y;
          doc.text(batch.batchCode, col1, rowY, { width: 90 });
          doc.text(batch.productName, col2, rowY, { width: 110 });
          doc.text(batch.batchSize.toString(), col3, rowY, { width: 70 });
          doc.text(new Date(batch.startTime).toLocaleDateString(), col4, rowY, { width: 80 });
          doc.text(`${batch.supervisor.firstName} ${batch.supervisor.lastName}`, col5, rowY, { width: 90 });
          doc.moveDown(0.8);
        });

        if (reportData.batches.length > 20) {
          doc.text(`... and ${reportData.batches.length - 20} more batches`);
        }
      }

      doc.moveDown();

      // Feedback Timeline
      if (reportData.feedbacks.length > 0) {
        doc.addPage();
        doc.fontSize(14).text("Feedback Timeline", { underline: true });
        doc.moveDown(0.5);

        reportData.feedbacks.forEach((feedback) => {
          doc.fontSize(10);
          const tagColor = ["Excellent", "Good"].includes(feedback.feedbackTag) ? "green" : "red";
          doc.fillColor(tagColor).text(`${feedback.feedbackTag}`, { continued: true });
          doc.fillColor("black").text(` - ${new Date(feedback.createdAt).toLocaleDateString()}`);
          doc.fontSize(9).text(`By: ${feedback.supervisor.firstName} ${feedback.supervisor.lastName}`);
          if (feedback.comments) {
            doc.fontSize(9).text(`Comments: ${feedback.comments}`);
          }
          doc.moveDown(0.5);
        });
      }

      // Recommendations
      doc.addPage();
      doc.fontSize(14).text("Recommendations", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);

      if (reportData.efficiency.overallRating >= 4) {
        doc.text("• Excellent performance! Continue maintaining this standard.");
      } else if (reportData.efficiency.overallRating >= 3) {
        doc.text("• Good performance. Focus on consistency and time management.");
      } else {
        doc.text("• Performance needs improvement. Consider additional training or support.");
      }

      if (reportData.efficiency.punctualityScore < 70) {
        doc.text("• Work on punctuality and meeting deadlines.");
      }

      if (reportData.efficiency.outputEfficiency < 70) {
        doc.text("• Focus on improving output quantity to meet standards.");
      }

      if (reportData.efficiency.negativeFeedbackCount > reportData.efficiency.positiveFeedbackCount) {
        doc.text("• Address recurring issues highlighted in supervisor feedback.");
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Excel report for a worker's monthly performance
 */
export async function generateMonthlyExcel(
  workerId: string,
  month: Date
): Promise<Buffer> {
  const reportData = await getMonthlyReportData(workerId, month);

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 30 },
  ];

  summarySheet.addRows([
    { metric: "Worker Name", value: reportData.worker.name },
    { metric: "Username", value: reportData.worker.username },
    { metric: "Role", value: reportData.worker.role },
    { metric: "Month", value: month.toLocaleString("default", { month: "long", year: "numeric" }) },
    { metric: "", value: "" },
    { metric: "Overall Rating", value: `${reportData.efficiency.overallRating}/5` },
    { metric: "Output Efficiency", value: `${reportData.efficiency.outputEfficiency.toFixed(1)}%` },
    { metric: "Punctuality Score", value: `${reportData.efficiency.punctualityScore.toFixed(1)}%` },
    { metric: "Feedback Score", value: `${reportData.efficiency.feedbackScore.toFixed(1)}%` },
    { metric: "", value: "" },
    { metric: "Total Batches Completed", value: reportData.efficiency.totalBatches },
    { metric: "On-Time Batches", value: reportData.efficiency.onTimeBatches },
    { metric: "Positive Feedback Count", value: reportData.efficiency.positiveFeedbackCount },
    { metric: "Negative Feedback Count", value: reportData.efficiency.negativeFeedbackCount },
    { metric: "Standard Output per Shift", value: reportData.standardOutput },
  ]);

  // Style header row
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9EAD3" },
  };

  // Sheet 2: Batch Details
  const batchSheet = workbook.addWorksheet("Batch Details");
  batchSheet.columns = [
    { header: "Batch Code", key: "batchCode", width: 20 },
    { header: "Product Name", key: "productName", width: 25 },
    { header: "Batch Size", key: "batchSize", width: 15 },
    { header: "Start Time", key: "startTime", width: 20 },
    { header: "End Time", key: "endTime", width: 20 },
    { header: "Duration (hours)", key: "duration", width: 15 },
    { header: "Supervisor", key: "supervisor", width: 20 },
    { header: "Status", key: "status", width: 15 },
  ];

  reportData.batches.forEach((batch) => {
    const duration = batch.endTime
      ? ((new Date(batch.endTime).getTime() - new Date(batch.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2)
      : "N/A";

    batchSheet.addRow({
      batchCode: batch.batchCode,
      productName: batch.productName,
      batchSize: batch.batchSize,
      startTime: new Date(batch.startTime).toLocaleString(),
      endTime: batch.endTime ? new Date(batch.endTime).toLocaleString() : "N/A",
      duration: duration,
      supervisor: `${batch.supervisor.firstName} ${batch.supervisor.lastName}`,
      status: batch.status,
    });
  });

  // Style header
  batchSheet.getRow(1).font = { bold: true };
  batchSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9EAD3" },
  };

  // Sheet 3: Feedback
  const feedbackSheet = workbook.addWorksheet("Feedback");
  feedbackSheet.columns = [
    { header: "Date", key: "date", width: 20 },
    { header: "Tag", key: "tag", width: 20 },
    { header: "Supervisor", key: "supervisor", width: 20 },
    { header: "Comments", key: "comments", width: 40 },
  ];

  reportData.feedbacks.forEach((feedback) => {
    feedbackSheet.addRow({
      date: new Date(feedback.createdAt).toLocaleString(),
      tag: feedback.feedbackTag,
      supervisor: `${feedback.supervisor.firstName} ${feedback.supervisor.lastName}`,
      comments: feedback.comments || "N/A",
    });
  });

  // Style header
  feedbackSheet.getRow(1).font = { bold: true };
  feedbackSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9EAD3" },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate monthly summary for all workers
 */
export async function generateAllWorkersReport(month: Date): Promise<ReportData[]> {
  // Get all workers (Staff role and workers with efficiency records)
  const workers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "Staff" },
        { workerEfficiency: { isNot: null } },
      ],
    },
    select: {
      id: true,
    },
  });

  const reports: ReportData[] = [];

  for (const worker of workers) {
    try {
      const reportData = await getMonthlyReportData(worker.id, month);
      reports.push(reportData);
    } catch (error) {
      console.error(`Error generating report for worker ${worker.id}:`, error);
    }
  }

  return reports;
}

