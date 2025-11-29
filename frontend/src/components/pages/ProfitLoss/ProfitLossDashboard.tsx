import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PieChart,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import api from "../../../lib/api";
import { toast } from "react-hot-toast";
import type { ProfitLoss, PLSummaryStats } from "@/lib/types";
import FormModal from "../_components/FormModal";
import { HomeContext } from "../../HomeContext";

const ProfitLossDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ProfitLoss[]>([]);
  const [summary, setSummary] = useState<PLSummaryStats | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: "", name: "" });
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    record: ProfitLoss | null;
  }>({ isOpen: false, record: null });

  const { Role: currentUserRole } = useContext(HomeContext);
  const isAdmin = currentUserRole === "Admin";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, summaryRes] = await Promise.all([
        api.get("/api/profit-loss?limit=6&sortBy=month&sortOrder=desc"),
        api.get("/api/profit-loss/analytics/summary"),
      ]);

      setRecords(recordsRes.data.records || []);
      setSummary(summaryRes.data);
    } catch (error: any) {
      console.error("Error fetching P&L data:", error);
      toast.error("Failed to fetch P&L data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatMonth = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const calculateProfitMargin = (netProfit: number, sales: number) => {
    if (sales === 0) return 0;
    return (netProfit / sales) * 100;
  };

  const getTotalExpenses = (record: ProfitLoss) => {
    const fixed =
      record.fixedExpenses.rent +
      record.fixedExpenses.power +
      record.fixedExpenses.salaries +
      (record.fixedExpenses.other || 0);

    const variable =
      record.variableExpenses.materialWastage +
      (record.variableExpenses.other || 0);

    return fixed + variable;
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/profit-loss/${deleteModal.id}`);
      toast.success("P&L record deleted successfully");
      setDeleteModal({ isOpen: false, id: "", name: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast.error(error.response?.data?.error || "Failed to delete record");
    }
  };

  if (loading) {
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit & Loss</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track monthly financial performance
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/finance/profit-loss/analytics")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/finance/profit-loss/new")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Entry
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Sales YTD */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-green-700">YTD</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary.totalSalesYTD)}
            </div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>

          {/* Net Profit YTD */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              {summary.growthPercentage !== 0 && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    summary.growthPercentage > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {summary.growthPercentage > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(summary.growthPercentage).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary.totalProfitYTD)}
            </div>
            <div className="text-sm text-gray-600">Net Profit (YTD)</div>
          </div>

          {/* Average Margin */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Receipt className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {summary.averageProfitMargin.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-600">Avg Profit Margin</div>
          </div>

          {/* Current Month */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              {summary.currentMonthNetProfit !== 0 && (
                <div
                  className={`text-xs font-medium ${
                    summary.currentMonthNetProfit > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  This Month
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(summary.currentMonthNetProfit)}
            </div>
            <div className="text-sm text-gray-600">Current Month Profit</div>
          </div>
        </div>
      )}

      {/* Best/Worst Months */}
      {summary && (summary.bestMonth !== "N/A" || summary.worstMonth !== "N/A") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Best Month</div>
                <div className="text-lg font-bold text-gray-900">
                  {summary.bestMonth}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Worst Month</div>
                <div className="text-lg font-bold text-gray-900">
                  {summary.worstMonth}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Records Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Entries (Last 6 Months)
          </h2>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No P&L records found</p>
            {isAdmin && (
              <button
                onClick={() => navigate("/finance/profit-loss/new")}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Entry
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fixed Exp.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variable Exp.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Profit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Profit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => {
                  const totalExpenses = getTotalExpenses(record);
                  const fixedTotal =
                    record.fixedExpenses.rent +
                    record.fixedExpenses.power +
                    record.fixedExpenses.salaries +
                    (record.fixedExpenses.other || 0);
                  const variableTotal =
                    record.variableExpenses.materialWastage +
                    (record.variableExpenses.other || 0);
                  const margin = calculateProfitMargin(
                    record.netProfit,
                    record.totalSalesValue
                  );

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatMonth(record.month)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-green-600 font-medium">
                          {formatCurrency(record.totalSalesValue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-red-600">
                          {formatCurrency(fixedTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-red-600">
                          {formatCurrency(variableTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div
                          className={`text-sm font-medium ${
                            record.grossProfit >= 0
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(record.grossProfit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div
                          className={`text-sm font-bold ${
                            record.netProfit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(record.netProfit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            margin >= 20
                              ? "bg-green-100 text-green-800"
                              : margin >= 10
                              ? "bg-blue-100 text-blue-800"
                              : margin >= 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {margin.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setDetailsModal({ isOpen: true, record })
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() =>
                                  navigate(`/finance/profit-loss/edit/${record.id}`)
                                }
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    id: record.id,
                                    name: formatMonth(record.month),
                                  })
                                }
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <FormModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: "", name: "" })}
        title="Delete P&L Entry"
        type="Profit & Loss Entry"
        id={deleteModal.id}
        name={deleteModal.name}
        onSuccess={() => {
          fetchData();
          setDeleteModal({ isOpen: false, id: "", name: "" });
        }}
      />

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  P&L Details - {formatMonth(detailsModal.record.month)}
                </h2>
                <button
                  onClick={() =>
                    setDetailsModal({ isOpen: false, record: null })
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Fixed Expenses */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Fixed Expenses Breakdown
                  </h3>
                  <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rent</span>
                      <span className="font-medium">
                        {formatCurrency(detailsModal.record.fixedExpenses.rent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Power</span>
                      <span className="font-medium">
                        {formatCurrency(detailsModal.record.fixedExpenses.power)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salaries</span>
                      <span className="font-medium">
                        {formatCurrency(
                          detailsModal.record.fixedExpenses.salaries
                        )}
                      </span>
                    </div>
                    {detailsModal.record.fixedExpenses.other > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Other</span>
                        <span className="font-medium">
                          {formatCurrency(
                            detailsModal.record.fixedExpenses.other
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-red-200">
                      <span className="font-semibold text-gray-900">Total Fixed</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(
                          detailsModal.record.fixedExpenses.rent +
                            detailsModal.record.fixedExpenses.power +
                            detailsModal.record.fixedExpenses.salaries +
                            (detailsModal.record.fixedExpenses.other || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variable Expenses */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Variable Expenses Breakdown
                  </h3>
                  <div className="space-y-2 bg-orange-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material Wastage</span>
                      <span className="font-medium">
                        {formatCurrency(
                          detailsModal.record.variableExpenses.materialWastage
                        )}
                      </span>
                    </div>
                    {detailsModal.record.variableExpenses.other > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Other</span>
                        <span className="font-medium">
                          {formatCurrency(
                            detailsModal.record.variableExpenses.other
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-orange-200">
                      <span className="font-semibold text-gray-900">
                        Total Variable
                      </span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(
                          detailsModal.record.variableExpenses.materialWastage +
                            (detailsModal.record.variableExpenses.other || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Revenue
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">
                        Sales Value
                      </span>
                      <span className="font-bold text-green-600 text-lg">
                        {formatCurrency(detailsModal.record.totalSalesValue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profitability */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Profitability
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-4 rounded-lg flex justify-between">
                      <span className="font-semibold text-gray-900">
                        Gross Profit
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          detailsModal.record.grossProfit >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(detailsModal.record.grossProfit)}
                      </span>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg flex justify-between">
                      <span className="font-semibold text-gray-900">
                        Net Profit
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          detailsModal.record.netProfit >= 0
                            ? "text-purple-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(detailsModal.record.netProfit)}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        Profit Margin
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          detailsModal.record.netProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {calculateProfitMargin(
                          detailsModal.record.netProfit,
                          detailsModal.record.totalSalesValue
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {isAdmin && (
                  <button
                    onClick={() => {
                      navigate(
                        `/finance/profit-loss/edit/${detailsModal.record.id}`
                      );
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Edit Entry
                  </button>
                )}
                <button
                  onClick={() =>
                    setDetailsModal({ isOpen: false, record: null })
                  }
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossDashboard;

