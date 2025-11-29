import React from "react";

interface EfficiencyBadgeProps {
  efficiency: number; // 0-100 percentage
  size?: "sm" | "md" | "lg";
}

const EfficiencyBadge: React.FC<EfficiencyBadgeProps> = ({
  efficiency,
  size = "md",
}) => {
  const getColor = () => {
    if (efficiency >= 90) return "bg-green-100 text-green-800 border-green-300";
    if (efficiency >= 75) return "bg-blue-100 text-blue-800 border-blue-300";
    if (efficiency >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getLabel = () => {
    if (efficiency >= 90) return "Excellent";
    if (efficiency >= 75) return "Good";
    if (efficiency >= 60) return "Average";
    return "Needs Improvement";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getColor()} ${
        sizeClasses[size]
      }`}
    >
      <span className="font-semibold">{efficiency.toFixed(1)}%</span>
      <span className="opacity-75">•</span>
      <span>{getLabel()}</span>
    </span>
  );
};

export default EfficiencyBadge;

