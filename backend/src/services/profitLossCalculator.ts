import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// Types
export interface ComparisonData {
  period: string;
  sales: number;
  fixedExpenses: number;
  variableExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface SummaryStats {
  currentMonthNetProfit: number;
  previousMonthNetProfit: number;
  growthPercentage: number;
  averageProfitMargin: number;
  bestMonth: string;
  worstMonth: string;
  totalSalesYTD: number;
  totalProfitYTD: number;
}

// Calculate total sales from invoices for a specific month
export async function calculateMonthlySales(
  year: number,
  month: number
): Promise<{ totalSales: number; invoiceCount: number }> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: {
        gte: startDate,
        lt: endDate,
      },
      paymentStatus: { in: ["Paid", "Partial"] },
    },
  });

  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return {
    totalSales,
    invoiceCount: invoices.length,
  };
}

// Calculate gross profit (sales - variable expenses)
export function calculateGrossProfit(
  sales: number,
  variableExpenses: number
): number {
  return sales - variableExpenses;
}

// Calculate net profit (gross profit - fixed expenses)
export function calculateNetProfit(
  grossProfit: number,
  fixedExpenses: number
): number {
  return grossProfit - fixedExpenses;
}

// Calculate profit margin percentage
export function calculateProfitMargin(
  netProfit: number,
  sales: number
): number {
  if (sales === 0) return 0;
  return (netProfit / sales) * 100;
}

// Get monthly comparison data (last N months)
export async function getMonthlyComparison(
  months: number = 6
): Promise<ComparisonData[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const plRecords = await prisma.profitLoss.findMany({
    where: {
      month: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      month: "asc",
    },
  });

  return plRecords.map((record) => {
    const fixedExp = record.fixedExpenses as any;
    const variableExp = record.variableExpenses as any;

    const totalFixed =
      (fixedExp.rent || 0) +
      (fixedExp.power || 0) +
      (fixedExp.salaries || 0) +
      (fixedExp.other || 0);

    const totalVariable =
      (variableExp.materialWastage || 0) + (variableExp.other || 0);

    const monthDate = new Date(record.month);
    const monthName = monthDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    return {
      period: monthName,
      sales: record.totalSalesValue,
      fixedExpenses: totalFixed,
      variableExpenses: totalVariable,
      grossProfit: record.grossProfit,
      netProfit: record.netProfit,
      profitMargin: calculateProfitMargin(
        record.netProfit,
        record.totalSalesValue
      ),
    };
  });
}

// Get quarterly comparison data
export async function getQuarterlyComparison(
  quarters: number = 4
): Promise<ComparisonData[]> {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3);

  const comparisonData: ComparisonData[] = [];

  for (let i = quarters - 1; i >= 0; i--) {
    let quarterNum = currentQuarter - i;
    let year = currentYear;

    while (quarterNum < 0) {
      quarterNum += 4;
      year -= 1;
    }

    const quarterStart = new Date(year, quarterNum * 3, 1);
    const quarterEnd = new Date(year, (quarterNum + 1) * 3, 1);

    const plRecords = await prisma.profitLoss.findMany({
      where: {
        month: {
          gte: quarterStart,
          lt: quarterEnd,
        },
      },
    });

    let totalSales = 0;
    let totalFixedExpenses = 0;
    let totalVariableExpenses = 0;
    let totalGrossProfit = 0;
    let totalNetProfit = 0;

    plRecords.forEach((record) => {
      const fixedExp = record.fixedExpenses as any;
      const variableExp = record.variableExpenses as any;

      const totalFixed =
        (fixedExp.rent || 0) +
        (fixedExp.power || 0) +
        (fixedExp.salaries || 0) +
        (fixedExp.other || 0);

      const totalVariable =
        (variableExp.materialWastage || 0) + (variableExp.other || 0);

      totalSales += record.totalSalesValue;
      totalFixedExpenses += totalFixed;
      totalVariableExpenses += totalVariable;
      totalGrossProfit += record.grossProfit;
      totalNetProfit += record.netProfit;
    });

    comparisonData.push({
      period: `Q${quarterNum + 1} ${year}`,
      sales: totalSales,
      fixedExpenses: totalFixedExpenses,
      variableExpenses: totalVariableExpenses,
      grossProfit: totalGrossProfit,
      netProfit: totalNetProfit,
      profitMargin: calculateProfitMargin(totalNetProfit, totalSales),
    });
  }

  return comparisonData;
}

// Get annual comparison data
export async function getAnnualComparison(
  years: number = 3
): Promise<ComparisonData[]> {
  const currentYear = new Date().getFullYear();
  const comparisonData: ComparisonData[] = [];

  for (let i = years - 1; i >= 0; i--) {
    const year = currentYear - i;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const plRecords = await prisma.profitLoss.findMany({
      where: {
        month: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });

    let totalSales = 0;
    let totalFixedExpenses = 0;
    let totalVariableExpenses = 0;
    let totalGrossProfit = 0;
    let totalNetProfit = 0;

    plRecords.forEach((record) => {
      const fixedExp = record.fixedExpenses as any;
      const variableExp = record.variableExpenses as any;

      const totalFixed =
        (fixedExp.rent || 0) +
        (fixedExp.power || 0) +
        (fixedExp.salaries || 0) +
        (fixedExp.other || 0);

      const totalVariable =
        (variableExp.materialWastage || 0) + (variableExp.other || 0);

      totalSales += record.totalSalesValue;
      totalFixedExpenses += totalFixed;
      totalVariableExpenses += totalVariable;
      totalGrossProfit += record.grossProfit;
      totalNetProfit += record.netProfit;
    });

    comparisonData.push({
      period: year.toString(),
      sales: totalSales,
      fixedExpenses: totalFixedExpenses,
      variableExpenses: totalVariableExpenses,
      grossProfit: totalGrossProfit,
      netProfit: totalNetProfit,
      profitMargin: calculateProfitMargin(totalNetProfit, totalSales),
    });
  }

  return comparisonData;
}

// Get summary statistics
export async function getSummaryStats(): Promise<SummaryStats> {
  const currentDate = new Date();
  const currentMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const previousMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1
  );
  const yearStart = new Date(currentDate.getFullYear(), 0, 1);

  // Get current month P&L
  const currentMonthPL = await prisma.profitLoss.findUnique({
    where: { month: currentMonth },
  });

  // Get previous month P&L
  const previousMonthPL = await prisma.profitLoss.findUnique({
    where: { month: previousMonth },
  });

  // Get all records for calculating best/worst months and averages
  const allRecords = await prisma.profitLoss.findMany({
    orderBy: { month: "desc" },
    take: 12,
  });

  // Calculate year-to-date totals
  const ytdRecords = await prisma.profitLoss.findMany({
    where: {
      month: {
        gte: yearStart,
      },
    },
  });

  const totalSalesYTD = ytdRecords.reduce(
    (sum, record) => sum + record.totalSalesValue,
    0
  );
  const totalProfitYTD = ytdRecords.reduce(
    (sum, record) => sum + record.netProfit,
    0
  );

  // Calculate average profit margin
  let averageProfitMargin = 0;
  if (allRecords.length > 0) {
    const totalMargin = allRecords.reduce(
      (sum, record) =>
        sum + calculateProfitMargin(record.netProfit, record.totalSalesValue),
      0
    );
    averageProfitMargin = totalMargin / allRecords.length;
  }

  // Find best and worst months
  let bestMonth = "N/A";
  let worstMonth = "N/A";
  if (allRecords.length > 0) {
    const sortedByProfit = [...allRecords].sort(
      (a, b) => b.netProfit - a.netProfit
    );
    const bestRecord = sortedByProfit[0];
    const worstRecord = sortedByProfit[sortedByProfit.length - 1];

    bestMonth = new Date(bestRecord.month).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    worstMonth = new Date(worstRecord.month).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  // Calculate growth percentage
  let growthPercentage = 0;
  if (currentMonthPL && previousMonthPL && previousMonthPL.netProfit !== 0) {
    growthPercentage =
      ((currentMonthPL.netProfit - previousMonthPL.netProfit) /
        Math.abs(previousMonthPL.netProfit)) *
      100;
  }

  return {
    currentMonthNetProfit: currentMonthPL?.netProfit || 0,
    previousMonthNetProfit: previousMonthPL?.netProfit || 0,
    growthPercentage,
    averageProfitMargin,
    bestMonth,
    worstMonth,
    totalSalesYTD,
    totalProfitYTD,
  };
}

