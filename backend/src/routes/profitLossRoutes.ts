import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  calculateMonthlySales,
  calculateGrossProfit,
  calculateNetProfit,
  calculateProfitMargin,
  getMonthlyComparison,
  getQuarterlyComparison,
  getAnnualComparison,
  getSummaryStats,
} from "../services/profitLossCalculator";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to parse year-month string (YYYY-MM)
function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [year, month] = yearMonth.split("-").map(Number);
  return { year, month };
}

// Helper function to get first day of month
function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

// 1. Get all P&L records with pagination and filters
router.get(
  "/",
  authenticateToken,
  requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const {
        page = "1",
        limit = "10",
        sortBy = "month",
        sortOrder = "desc",
        year,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};

      if (year) {
        const yearNum = parseInt(year as string);
        where.month = {
          gte: new Date(yearNum, 0, 1),
          lt: new Date(yearNum + 1, 0, 1),
        };
      }

      // Get records
      const [records, total] = await Promise.all([
        prisma.profitLoss.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: {
            [sortBy as string]: sortOrder,
          },
        }),
        prisma.profitLoss.count({ where }),
      ]);

      res.json({
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching P&L records:", error);
      res.status(500).json({ error: "Failed to fetch P&L records" });
    }
  }
);

// 2. Get P&L analytics summary
router.get(
  "/analytics/summary",
  authenticateToken,
  requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const summary = await getSummaryStats();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching summary stats:", error);
      res.status(500).json({ error: "Failed to fetch summary statistics" });
    }
  }
);

// 3. Get comparison analytics data
router.get(
  "/analytics/comparison",
  authenticateToken,
  requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const { type = "monthly", periods = "6" } = req.query;
      const periodsNum = parseInt(periods as string);

      let data;
      switch (type) {
        case "monthly":
          data = await getMonthlyComparison(periodsNum);
          break;
        case "quarterly":
          data = await getQuarterlyComparison(periodsNum);
          break;
        case "annual":
          data = await getAnnualComparison(periodsNum);
          break;
        default:
          return res.status(400).json({
            error: "Invalid type. Must be: monthly, quarterly, or annual",
          });
      }

      res.json({ type, data });
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      res.status(500).json({ error: "Failed to fetch comparison data" });
    }
  }
);

// 4. Calculate sales for a specific month
router.get(
  "/calculate/:yearMonth",
  authenticateToken,
  requireRole(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const { yearMonth } = req.params;

      // Validate format
      if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        return res.status(400).json({
          error: "Invalid format. Use YYYY-MM (e.g., 2024-01)",
        });
      }

      const { year, month } = parseYearMonth(yearMonth);

      // Validate month
      if (month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid month (1-12)" });
      }

      // Check if month is in the future
      const targetMonth = getFirstDayOfMonth(year, month);
      const now = new Date();
      if (targetMonth > now) {
        return res.status(400).json({
          error: "Cannot calculate sales for future months",
        });
      }

      const result = await calculateMonthlySales(year, month);

      res.json({
        month: yearMonth,
        totalSales: result.totalSales,
        invoiceCount: result.invoiceCount,
      });
    } catch (error) {
      console.error("Error calculating sales:", error);
      res.status(500).json({ error: "Failed to calculate sales" });
    }
  }
);

// 5. Get P&L for specific month
router.get(
  "/month/:yearMonth",
  authenticateToken,
  requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const { yearMonth } = req.params;

      // Validate format
      if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        return res.status(400).json({
          error: "Invalid format. Use YYYY-MM (e.g., 2024-01)",
        });
      }

      const { year, month } = parseYearMonth(yearMonth);
      const monthDate = getFirstDayOfMonth(year, month);

      const record = await prisma.profitLoss.findUnique({
        where: { month: monthDate },
      });

      if (!record) {
        return res.status(404).json({
          error: "No P&L record found for this month",
        });
      }

      res.json(record);
    } catch (error) {
      console.error("Error fetching P&L record:", error);
      res.status(500).json({ error: "Failed to fetch P&L record" });
    }
  }
);

// 6. Get single P&L record by ID
router.get(
  "/:id",
  authenticateToken,
  requireRole(["Admin", "ProductionManager", "InventoryManager", "Supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const record = await prisma.profitLoss.findUnique({
        where: { id },
      });

      if (!record) {
        return res.status(404).json({ error: "P&L record not found" });
      }

      res.json(record);
    } catch (error) {
      console.error("Error fetching P&L record:", error);
      res.status(500).json({ error: "Failed to fetch P&L record" });
    }
  }
);

// 7. Create new P&L record
router.post(
  "/",
  authenticateToken,
  requireRole(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const {
        month,
        fixedExpenses,
        variableExpenses,
        totalSalesValue,
        manualSalesOverride = false,
      } = req.body;

      // Validate required fields
      if (!month || !fixedExpenses || !variableExpenses) {
        return res.status(400).json({
          error: "Missing required fields: month, fixedExpenses, variableExpenses",
        });
      }

      // Parse month string to Date
      const { year, monthNum } = (() => {
        if (month.includes("-")) {
          const { year, month: m } = parseYearMonth(month);
          return { year, monthNum: m };
        } else {
          const date = new Date(month);
          return { year: date.getFullYear(), monthNum: date.getMonth() + 1 };
        }
      })();

      const monthDate = getFirstDayOfMonth(year, monthNum);

      // Check if month is in the future
      const now = new Date();
      if (monthDate > now) {
        return res.status(400).json({
          error: "Cannot create P&L entry for future months",
        });
      }

      // Check if record already exists
      const existingRecord = await prisma.profitLoss.findUnique({
        where: { month: monthDate },
      });

      if (existingRecord) {
        return res.status(400).json({
          error: "P&L record already exists for this month",
        });
      }

      // Validate expenses
      const { rent, power, salaries, other: fixedOther } = fixedExpenses;
      const { materialWastage, other: varOther } = variableExpenses;

      if (
        rent < 0 ||
        power < 0 ||
        salaries < 0 ||
        (fixedOther && fixedOther < 0)
      ) {
        return res.status(400).json({
          error: "Fixed expenses cannot be negative",
        });
      }

      if (materialWastage < 0 || (varOther && varOther < 0)) {
        return res.status(400).json({
          error: "Variable expenses cannot be negative",
        });
      }

      // Calculate total expenses
      const totalFixedExpenses =
        rent + power + salaries + (fixedOther || 0);
      const totalVariableExpenses = materialWastage + (varOther || 0);

      // Get sales value
      let salesValue = totalSalesValue || 0;
      if (!manualSalesOverride) {
        const { totalSales } = await calculateMonthlySales(year, monthNum);
        salesValue = totalSales;
      }

      // Calculate profits
      const grossProfit = calculateGrossProfit(
        salesValue,
        totalVariableExpenses
      );
      const netProfit = calculateNetProfit(grossProfit, totalFixedExpenses);

      // Create record
      const record = await prisma.profitLoss.create({
        data: {
          month: monthDate,
          fixedExpenses: {
            rent,
            power,
            salaries,
            other: fixedOther || 0,
          },
          variableExpenses: {
            materialWastage,
            other: varOther || 0,
          },
          totalSalesValue: salesValue,
          grossProfit,
          netProfit,
        },
      });

      res.status(201).json({
        message: "P&L record created successfully",
        record,
      });
    } catch (error: any) {
      console.error("Error creating P&L record:", error);
      if (error.code === "P2002") {
        return res.status(400).json({
          error: "P&L record already exists for this month",
        });
      }
      res.status(500).json({ error: "Failed to create P&L record" });
    }
  }
);

// 8. Update existing P&L record
router.put(
  "/:id",
  authenticateToken,
  requireRole(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        fixedExpenses,
        variableExpenses,
        totalSalesValue,
        manualSalesOverride = false,
      } = req.body;

      // Check if record exists
      const existingRecord = await prisma.profitLoss.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        return res.status(404).json({ error: "P&L record not found" });
      }

      // Build update data
      const updateData: any = {};

      // Update fixed expenses
      if (fixedExpenses) {
        const { rent, power, salaries, other: fixedOther } = fixedExpenses;

        if (
          rent < 0 ||
          power < 0 ||
          salaries < 0 ||
          (fixedOther && fixedOther < 0)
        ) {
          return res.status(400).json({
            error: "Fixed expenses cannot be negative",
          });
        }

        updateData.fixedExpenses = {
          rent,
          power,
          salaries,
          other: fixedOther || 0,
        };
      }

      // Update variable expenses
      if (variableExpenses) {
        const { materialWastage, other: varOther } = variableExpenses;

        if (materialWastage < 0 || (varOther && varOther < 0)) {
          return res.status(400).json({
            error: "Variable expenses cannot be negative",
          });
        }

        updateData.variableExpenses = {
          materialWastage,
          other: varOther || 0,
        };
      }

      // Recalculate sales if needed
      let salesValue = existingRecord.totalSalesValue;
      if (totalSalesValue !== undefined) {
        if (manualSalesOverride) {
          salesValue = totalSalesValue;
        } else {
          const monthDate = new Date(existingRecord.month);
          const { totalSales } = await calculateMonthlySales(
            monthDate.getFullYear(),
            monthDate.getMonth() + 1
          );
          salesValue = totalSales;
        }
        updateData.totalSalesValue = salesValue;
      }

      // Get final values for calculation
      const finalFixedExp = updateData.fixedExpenses || existingRecord.fixedExpenses;
      const finalVarExp = updateData.variableExpenses || existingRecord.variableExpenses;
      const finalSales = salesValue;

      const fixedExp = finalFixedExp as any;
      const varExp = finalVarExp as any;

      const totalFixed =
        (fixedExp.rent || 0) +
        (fixedExp.power || 0) +
        (fixedExp.salaries || 0) +
        (fixedExp.other || 0);

      const totalVariable =
        (varExp.materialWastage || 0) + (varExp.other || 0);

      // Recalculate profits
      updateData.grossProfit = calculateGrossProfit(finalSales, totalVariable);
      updateData.netProfit = calculateNetProfit(
        updateData.grossProfit,
        totalFixed
      );

      // Update record
      const updatedRecord = await prisma.profitLoss.update({
        where: { id },
        data: updateData,
      });

      res.json({
        message: "P&L record updated successfully",
        record: updatedRecord,
      });
    } catch (error) {
      console.error("Error updating P&L record:", error);
      res.status(500).json({ error: "Failed to update P&L record" });
    }
  }
);

// 9. Delete P&L record
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["Admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if record exists
      const existingRecord = await prisma.profitLoss.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        return res.status(404).json({ error: "P&L record not found" });
      }

      // Delete record
      await prisma.profitLoss.delete({
        where: { id },
      });

      res.json({ message: "P&L record deleted successfully" });
    } catch (error) {
      console.error("Error deleting P&L record:", error);
      res.status(500).json({ error: "Failed to delete P&L record" });
    }
  }
);

export default router;

