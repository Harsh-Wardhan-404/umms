import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import api from "../../../lib/api";
import { toast } from "react-hot-toast";
import type { PLComparisonData } from "../../../lib/types";
import ComparisonChart from "./ComparisonChart";

type ViewType = "monthly" | "quarterly" | "annual";

const ProfitLossAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>("monthly");
  const [data, setData] = useState<PLComparisonData[]>([]);
  const [periods, setPeriods] = useState(6);

  useEffect(() => {
    fetchData();
  }, [viewType, periods]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/profit-loss/analytics/comparison?type=${viewType}&periods=${periods}`
      );
      setData(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const getInsights = () => {
    if (data.length === 0) return null;

    const bestPeriod = data.reduce((max, curr) =>
      curr.netProfit > max.netProfit ? curr : max
    );
    const worstPeriod = data.reduce((min, curr) =>
      curr.netProfit < min.netProfit ? curr : min
    );
    const avgMargin =
      data.reduce((sum, curr) => sum + curr.profitMargin, 0) / data.length;
    const totalSales = data.reduce((sum, curr) => sum + curr.sales, 0);
    const totalProfit = data.reduce((sum, curr) => sum + curr.netProfit, 0);

    return {
      bestPeriod,
      worstPeriod,
      avgMargin,
      totalSales,
      totalProfit,
    };
  };

  const insights = getInsights();

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/finance/profit-loss")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">P&L Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Visual insights and comparisons
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType("monthly")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewType === "monthly"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType("quarterly")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewType === "quarterly"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setViewType("annual")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewType === "annual"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Periods:</label>
            <select
              value={periods}
              onChange={(e) => setPeriods(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Sales</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(insights.totalSales)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Net Profit</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(insights.totalProfit)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Margin</div>
            <div className="text-xl font-bold text-gray-900">
              {insights.avgMargin.toFixed(2)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div className="text-sm text-gray-600">Best Period</div>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {insights.bestPeriod.period}
            </div>
            <div className="text-xs text-gray-600">
              {formatCurrency(insights.bestPeriod.netProfit)}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {data.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No data available for selected period</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue & Profit Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue & Profit Trends
            </h2>
            <ComparisonChart
              data={data}
              chartType="line"
              dataKeys={["sales", "grossProfit", "netProfit"]}
              xAxisKey="period"
              height={350}
            />
          </div>

          {/* Expenses Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Expenses Comparison
            </h2>
            <ComparisonChart
              data={data}
              chartType="bar"
              dataKeys={["fixedExpenses", "variableExpenses"]}
              xAxisKey="period"
              height={350}
            />
          </div>

          {/* Profit Margin Trend */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Profit Margin Trend
            </h2>
            <ComparisonChart
              data={data}
              chartType="area"
              dataKeys={["profitMargin"]}
              xAxisKey="period"
              height={300}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossAnalytics;

