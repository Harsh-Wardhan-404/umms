import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export interface EfficiencyData {
  outputEfficiency: number; // Actual vs Standard output (0-100)
  punctualityScore: number; // On-time batch completion % (0-100)
  feedbackScore: number; // Based on positive/negative tags (0-100)
  overallRating: number; // 1-5 star rating
  totalBatches: number;
  onTimeBatches: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
}

interface BatchWithDetails {
  id: string;
  batchCode: string;
  batchSize: number;
  startTime: Date;
  endTime: Date | null;
  status: string;
  productName: string;
}

interface FeedbackWithTag {
  id: string;
  feedbackTag: string;
  comments: string | null;
  createdAt: Date;
}

/**
 * Calculate worker's overall efficiency and rating
 */
export async function calculateWorkerEfficiency(
  workerId: string
): Promise<EfficiencyData> {
  // Get all batches where worker is involved
  const batches = await prisma.batch.findMany({
    where: {
      workers: {
        has: workerId,
      },
      status: "Completed",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get all feedbacks for worker
  const feedbacks = await prisma.workerFeedback.findMany({
    where: {
      workerId: workerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get worker efficiency record (for standard output)
  const workerEfficiency = await prisma.workerEfficiency.findUnique({
    where: {
      userId: workerId,
    },
  });

  const standardOutput = workerEfficiency?.standardOutputQtyPerShift || 0;

  // Calculate individual metrics
  const outputEfficiency = calculateOutputEfficiency(batches, standardOutput);
  const punctualityScore = calculatePunctualityScore(batches);
  const feedbackScore = calculateFeedbackScore(feedbacks);

  // Count feedback tags
  const positiveTags = ["Excellent", "Good"];
  const negativeTags = ["Needs Improvement", "Late"];
  const positiveFeedbackCount = feedbacks.filter((f) =>
    positiveTags.includes(f.feedbackTag)
  ).length;
  const negativeFeedbackCount = feedbacks.filter((f) =>
    negativeTags.includes(f.feedbackTag)
  ).length;

  // Count on-time batches
  const onTimeBatches = await countOnTimeBatches(batches);

  // Calculate overall score
  const overallScore =
    outputEfficiency * 0.4 + punctualityScore * 0.4 + feedbackScore * 0.2;

  // Convert to star rating
  const overallRating = convertToStarRating(overallScore);

  return {
    outputEfficiency,
    punctualityScore,
    feedbackScore,
    overallRating,
    totalBatches: batches.length,
    onTimeBatches,
    positiveFeedbackCount,
    negativeFeedbackCount,
  };
}

/**
 * Calculate output efficiency: (Actual Output / Standard Output) * 100
 */
export function calculateOutputEfficiency(
  batches: any[],
  standardOutput: number
): number {
  if (batches.length === 0 || standardOutput === 0) return 0;

  // Calculate average batch size produced
  const totalOutput = batches.reduce(
    (sum, batch) => sum + (batch.batchSize || 0),
    0
  );
  const avgOutput = totalOutput / batches.length;

  // Calculate efficiency
  const efficiency = (avgOutput / standardOutput) * 100;

  // Cap at 100%
  return Math.min(efficiency, 100);
}

/**
 * Calculate punctuality score: (On-time Batches / Total Batches) * 100
 */
export function calculatePunctualityScore(batches: any[]): number {
  if (batches.length === 0) return 0;

  let onTimeCount = 0;

  for (const batch of batches) {
    if (batch.startTime && batch.endTime) {
      const actualDuration =
        new Date(batch.endTime).getTime() -
        new Date(batch.startTime).getTime();

      // For now, consider a batch on-time if it's completed within 12 hours (typical shift + buffer)
      // In a real scenario, this would be compared to estimated duration from formulation
      const maxDuration = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

      if (actualDuration <= maxDuration) {
        onTimeCount++;
      }
    }
  }

  return (onTimeCount / batches.length) * 100;
}

/**
 * Count on-time batches
 */
async function countOnTimeBatches(batches: any[]): Promise<number> {
  let onTimeCount = 0;

  for (const batch of batches) {
    if (batch.startTime && batch.endTime) {
      const actualDuration =
        new Date(batch.endTime).getTime() -
        new Date(batch.startTime).getTime();
      const maxDuration = 12 * 60 * 60 * 1000; // 12 hours

      if (actualDuration <= maxDuration) {
        onTimeCount++;
      }
    }
  }

  return onTimeCount;
}

/**
 * Calculate feedback score: ((Positive - Negative) / Total) * 50 + 50
 * Range: 0-100 (50 = neutral)
 */
export function calculateFeedbackScore(feedbacks: any[]): number {
  if (feedbacks.length === 0) return 50; // Neutral score if no feedback

  const positiveTags = ["Excellent", "Good"];
  const negativeTags = ["Needs Improvement", "Late"];

  const positiveCount = feedbacks.filter((f) =>
    positiveTags.includes(f.feedbackTag)
  ).length;
  const negativeCount = feedbacks.filter((f) =>
    negativeTags.includes(f.feedbackTag)
  ).length;

  const totalFeedbacks = feedbacks.length;

  // Calculate score
  const score = ((positiveCount - negativeCount) / totalFeedbacks) * 50 + 50;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Convert 0-100 score to 1-5 star rating
 */
export function convertToStarRating(score: number): number {
  if (score <= 0) return 1;
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

/**
 * Update worker efficiency record in database
 */
export async function updateWorkerEfficiencyRecord(
  workerId: string,
  efficiencyData: EfficiencyData
): Promise<void> {
  // Get all batch IDs for worker
  const batches = await prisma.batch.findMany({
    where: {
      workers: {
        has: workerId,
      },
      status: "Completed",
    },
    select: {
      id: true,
    },
  });

  const batchHistory = batches.map((b) => b.id);

  // Get feedbacks
  const feedbacks = await prisma.workerFeedback.findMany({
    where: {
      workerId: workerId,
    },
  });

  const positiveTags = ["Excellent", "Good"];
  const negativeTags = ["Needs Improvement", "Late"];

  const feedbackTags = {
    positive: feedbacks.filter((f) => positiveTags.includes(f.feedbackTag))
      .length,
    negative: feedbacks.filter((f) => negativeTags.includes(f.feedbackTag))
      .length,
    excellent: feedbacks.filter((f) => f.feedbackTag === "Excellent").length,
    good: feedbacks.filter((f) => f.feedbackTag === "Good").length,
    needsImprovement: feedbacks.filter(
      (f) => f.feedbackTag === "Needs Improvement"
    ).length,
    late: feedbacks.filter((f) => f.feedbackTag === "Late").length,
  };

  // Upsert efficiency record
  await prisma.workerEfficiency.upsert({
    where: {
      userId: workerId,
    },
    update: {
      punctualityScore: efficiencyData.punctualityScore,
      efficiencyRating: efficiencyData.overallRating,
      batchHistory: batchHistory,
      totalBatchesCompleted: efficiencyData.totalBatches,
      onTimeBatches: efficiencyData.onTimeBatches,
      feedbackTags: feedbackTags,
      lastCalculated: new Date(),
      updatedAt: new Date(),
    },
    create: {
      userId: workerId,
      standardOutputQtyPerShift: 0, // Default, should be set manually
      punctualityScore: efficiencyData.punctualityScore,
      efficiencyRating: efficiencyData.overallRating,
      batchHistory: batchHistory,
      totalBatchesCompleted: efficiencyData.totalBatches,
      onTimeBatches: efficiencyData.onTimeBatches,
      feedbackTags: feedbackTags,
      lastCalculated: new Date(),
    },
  });
}

/**
 * Calculate efficiency for all workers in a batch
 */
export async function calculateBatchWorkersEfficiency(
  batchId: string
): Promise<void> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { workers: true },
  });

  if (!batch || !batch.workers || batch.workers.length === 0) {
    return;
  }

  // Calculate efficiency for each worker
  for (const workerId of batch.workers) {
    try {
      const efficiencyData = await calculateWorkerEfficiency(workerId);
      await updateWorkerEfficiencyRecord(workerId, efficiencyData);
    } catch (error) {
      console.error(
        `Error calculating efficiency for worker ${workerId}:`,
        error
      );
    }
  }
}

