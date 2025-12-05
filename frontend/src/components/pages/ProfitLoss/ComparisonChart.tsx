import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PLComparisonData } from "../../../lib/types";

interface ComparisonChartProps {
  data: PLComparisonData[];
  chartType: "line" | "bar" | "area";
  dataKeys: string[];
  xAxisKey: string;
  height?: number;
  colors?: { [key: string]: string };
}

const defaultColors: { [key: string]: string } = {
  sales: "#22c55e",
  grossProfit: "#3b82f6",
  netProfit: "#a855f7",
  fixedExpenses: "#ef4444",
  variableExpenses: "#f97316",
  profitMargin: "#8b5cf6",
};

const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  chartType,
  dataKeys,
  xAxisKey,
  height = 350,
  colors = defaultColors,
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name.toLowerCase().includes("margin")) {
      return `${value.toFixed(2)}%`;
    }
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatLabel = (label: string) => {
    const labelMap: { [key: string]: string } = {
      sales: "Sales",
      grossProfit: "Gross Profit",
      netProfit: "Net Profit",
      fixedExpenses: "Fixed Expenses",
      variableExpenses: "Variable Expenses",
      profitMargin: "Profit Margin %",
    };
    return labelMap[label] || label;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-gray-600">{formatLabel(entry.dataKey)}:</span>
            <span className="font-medium text-gray-900">
              {formatTooltipValue(entry.value, entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={formatLabel}
            />
            {dataKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[key] || "#6b7280"}
                strokeWidth={2}
                dot={{ fill: colors[key] || "#6b7280", r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={formatLabel}
            />
            {dataKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[key] || "#6b7280"}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={formatLabel}
            />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[key] || "#6b7280"}
                fill={colors[key] || "#6b7280"}
                fillOpacity={0.6 - index * 0.15}
              />
            ))}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  const chart = renderChart();
  if (!chart) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      {chart}
    </ResponsiveContainer>
  );
};

export default ComparisonChart;

