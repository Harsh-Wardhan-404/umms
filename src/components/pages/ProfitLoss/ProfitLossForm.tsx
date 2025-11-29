import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, Loader2 } from "lucide-react";
import api from "../../../lib/api";
import { toast } from "react-hot-toast";

interface ExpenseFormData {
  month: string;
  rent: number;
  power: number;
  salaries: number;
  fixedOther: number;
  materialWastage: number;
  variableOther: number;
  totalSalesValue: number;
  manualSalesOverride: boolean;
}

const ProfitLossForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    month: "",
    rent: 0,
    power: 0,
    salaries: 0,
    fixedOther: 0,
    materialWastage: 0,
    variableOther: 0,
    totalSalesValue: 0,
    manualSalesOverride: false,
  });
  const [invoiceCount, setInvoiceCount] = useState<number>(0);

  // Load existing record if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchRecord();
    }
  }, [id, isEditMode]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/profit-loss/${id}`);
      const record = response.data;

      const monthDate = new Date(record.month);
      const monthString = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

      setFormData({
        month: monthString,
        rent: record.fixedExpenses.rent || 0,
        power: record.fixedExpenses.power || 0,
        salaries: record.fixedExpenses.salaries || 0,
        fixedOther: record.fixedExpenses.other || 0,
        materialWastage: record.variableExpenses.materialWastage || 0,
        variableOther: record.variableExpenses.other || 0,
        totalSalesValue: record.totalSalesValue,
        manualSalesOverride: false,
      });
    } catch (error: any) {
      console.error("Error fetching P&L record:", error);
      toast.error(error.response?.data?.error || "Failed to fetch record");
      navigate("/finance/profit-loss");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateSales = async () => {
    if (!formData.month) {
      toast.error("Please select a month first");
      return;
    }

    try {
      setCalculating(true);
      const response = await api.get(`/api/profit-loss/calculate/${formData.month}`);
      const { totalSales, invoiceCount: count } = response.data;

      setFormData((prev) => ({
        ...prev,
        totalSalesValue: totalSales,
        manualSalesOverride: false,
      }));
      setInvoiceCount(count);
      toast.success(`Calculated from ${count} invoices`);
    } catch (error: any) {
      console.error("Error calculating sales:", error);
      toast.error(error.response?.data?.error || "Failed to calculate sales");
    } finally {
      setCalculating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.month) {
      toast.error("Please select a month");
      return;
    }

    if (
      formData.rent < 0 ||
      formData.power < 0 ||
      formData.salaries < 0 ||
      formData.fixedOther < 0 ||
      formData.materialWastage < 0 ||
      formData.variableOther < 0
    ) {
      toast.error("Expense values cannot be negative");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        month: formData.month,
        fixedExpenses: {
          rent: formData.rent,
          power: formData.power,
          salaries: formData.salaries,
          other: formData.fixedOther,
        },
        variableExpenses: {
          materialWastage: formData.materialWastage,
          other: formData.variableOther,
        },
        totalSalesValue: formData.totalSalesValue,
        manualSalesOverride: formData.manualSalesOverride,
      };

      if (isEditMode) {
        await api.put(`/api/profit-loss/${id}`, payload);
        toast.success("P&L record updated successfully");
      } else {
        await api.post("/api/profit-loss", payload);
        toast.success("P&L record created successfully");
      }

      navigate("/finance/profit-loss");
    } catch (error: any) {
      console.error("Error saving P&L record:", error);
      toast.error(error.response?.data?.error || "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalFixedExpenses =
    formData.rent + formData.power + formData.salaries + formData.fixedOther;

  const totalVariableExpenses =
    formData.materialWastage + formData.variableOther;

  const grossProfit = formData.totalSalesValue - totalVariableExpenses;
  const netProfit = grossProfit - totalFixedExpenses;
  const profitMargin =
    formData.totalSalesValue > 0
      ? (netProfit / formData.totalSalesValue) * 100
      : 0;

  // Get max month (current month)
  const now = new Date();
  const maxMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/finance/profit-loss")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit P&L Entry" : "New P&L Entry"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? "Update" : "Enter"} monthly profit and loss information
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Month Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Month Selection
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <input
              type="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              max={maxMonth}
              disabled={isEditMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">
                Month cannot be changed in edit mode
              </p>
            )}
          </div>
        </div>

        {/* Fixed Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fixed Expenses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent (₹)
              </label>
              <input
                type="number"
                name="rent"
                value={formData.rent}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Power/Electricity (₹)
              </label>
              <input
                type="number"
                name="power"
                value={formData.power}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salaries (₹)
              </label>
              <input
                type="number"
                name="salaries"
                value={formData.salaries}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Fixed Expenses (₹)
              </label>
              <input
                type="number"
                name="fixedOther"
                value={formData.fixedOther}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total Fixed Expenses
              </span>
              <span className="text-lg font-bold text-gray-900">
                ₹{totalFixedExpenses.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Variable Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Variable Expenses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Wastage (₹)
              </label>
              <input
                type="number"
                name="materialWastage"
                value={formData.materialWastage}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Variable Expenses (₹)
              </label>
              <input
                type="number"
                name="variableOther"
                value={formData.variableOther}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total Variable Expenses
              </span>
              <span className="text-lg font-bold text-gray-900">
                ₹{totalVariableExpenses.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Sales */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sales Revenue
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Sales Value (₹)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="totalSalesValue"
                value={formData.totalSalesValue}
                onChange={(e) => {
                  handleChange(e);
                  setFormData((prev) => ({ ...prev, manualSalesOverride: true }));
                }}
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={handleCalculateSales}
                disabled={!formData.month || calculating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {calculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                Calculate
              </button>
            </div>
            {invoiceCount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Calculated from {invoiceCount} paid invoices
              </p>
            )}
            {formData.manualSalesOverride && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠ Manual override - Click Calculate to fetch from invoices
              </p>
            )}
          </div>
        </div>

        {/* Summary Preview */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Summary Preview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Gross Profit</div>
              <div className={`text-2xl font-bold ${grossProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ₹{grossProfit.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Sales - Variable Expenses
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Net Profit</div>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{netProfit.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Gross Profit - Fixed Expenses
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 md:col-span-2">
              <div className="text-sm text-gray-600 mb-1">Profit Margin</div>
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${profitMargin >= 0 ? "text-purple-600" : "text-red-600"}`}>
                  {profitMargin.toFixed(2)}%
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${profitMargin >= 0 ? "bg-purple-600" : "bg-red-600"}`}
                    style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                (Net Profit / Sales) × 100
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/finance/profit-loss")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditMode ? "Update Entry" : "Create Entry"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfitLossForm;

