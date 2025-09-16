import {
  AlertCircle,
  Box,
  ClockArrowUp,
  Layers,
  TestTubes,
  Truck,
  User,
} from "lucide-react";

export const CriticalAlertsData = [
  {
    id: 1,
    message:
      "Turmeric Powder is below minimum threshold (8.2 kg remaining, minimum: 15 kg)",
  },
  {
    id: 2,
    message:
      "Aloe Vera Gel is below minimum threshold (12.5 liters remaining, minimum: 25 liters)",
  },
  {
    id: 3,
    message:
      "Ginger Extract is below minimum threshold (5.0 liters remaining, minimum: 10 liters)",
  },
];

export const primaryCardData = [
  { id: 1, title: "Product Efficiency", metric: 50, icon: Box, change: 12 },
  {
    id: 2,
    title: "Inventory Turnover",
    metric: 18,
    icon: AlertCircle,
    change: -3,
  },
  { id: 3, title: "Quality Score", metric: 85, icon: Layers, change: 5 },
  { id: 4, title: "Profit Margin", metric: 23, icon: Truck, change: 18 },
];

export const secondaryCardData = [
  { id: 1, title: "Raw Materials", metric: 120, icon: Box },
  { id: 2, title: "Low Stock Alerts", metric: 15, icon: AlertCircle },
  { id: 3, title: "Active Batches", metric: 8, icon: Layers },
  { id: 4, title: "Formulations", metric: 5, icon: TestTubes },
  { id: 3, title: "Active Orders", metric: 8, icon: ClockArrowUp },
  { id: 4, title: "System Users", metric: 5, icon: User },
];
