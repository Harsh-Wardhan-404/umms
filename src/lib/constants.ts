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

export const medicines = [
  {
    id: "cku1raw001",
    name: "Paracetamol 500mg",
    type: "Raw",
    currentStockQty: 120,
    minThresholdQty: 50,
    unit: "units",
  },
  {
    id: "cku1raw002",
    name: "Amoxicillin 250mg",
    type: "Raw",
    currentStockQty: 30,
    minThresholdQty: 40,
    unit: "units",
  },
  {
    id: "cku1raw003",
    name: "Ibuprofen 400mg",
    type: "Raw",
    currentStockQty: 75,
    minThresholdQty: 60,
    unit: "units",
  },
  {
    id: "cku1cons001",
    name: "ORS Sachet",
    type: "Consumable",
    currentStockQty: 20,
    minThresholdQty: 25,
    unit: "units",
  },
  {
    id: "cku1cons002",
    name: "Cough Syrup (100ml)",
    type: "Consumable",
    currentStockQty: 10,
    minThresholdQty: 15,
    unit: "units",
  },
  {
    id: "cku1raw004",
    name: "Vitamin C 500mg",
    type: "Raw",
    currentStockQty: 200,
    minThresholdQty: 100,
    unit: "units",
  },
  {
    id: "cku1pack001",
    name: "Insulin Packaging Vial",
    type: "Packaging",
    currentStockQty: 300,
    minThresholdQty: 150,
    unit: "units",
  },
];


export const formulations = [
  {
    id: "f1",
    productName: "Pain Relief Gel",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-03-02"),
    versions: [
      { id: "v1", formulationId: "f1", versionNumber: 1, isLocked: true, creatorId: "u1", creationDate: new Date("2024-02-10") },
      { id: "v2", formulationId: "f1", versionNumber: 2, isLocked: false, creatorId: "u1", creationDate: new Date("2024-03-02") }
    ]
  },
  {
    id: "f2",
    productName: "Herbal Shampoo",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-30"),
    versions: [
      { id: "v3", formulationId: "f2", versionNumber: 1, isLocked: false, creatorId: "u2", creationDate: new Date("2024-01-15") }
    ]
  },
  {
    id: "f3",
    productName: "Disinfectant Solution",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-05"),
    versions: [
      { id: "v4", formulationId: "f3", versionNumber: 1, isLocked: true, creatorId: "u3", creationDate: new Date("2024-03-01") },
      { id: "v5", formulationId: "f3", versionNumber: 2, isLocked: false, creatorId: "u3", creationDate: new Date("2024-03-05") }
    ]
  }
];

export const users = [
  { id: "u1", firstName: "Akhilesh", lastName: "Patil", email: "akhilesh.patil@example.com", role: "Admin" },
  { id: "u2", firstName: "Sneha", lastName: "Shah", email: "sneha.shah@example.com", role: "Staff" },
  { id: "u3", firstName: "Rohan", lastName: "Mehta", email: "rohan.mehta@example.com", role: "Staff" },
  { id: "u4", firstName: "Priya", lastName: "Kulkarni", email: "priya.kulkarni@example.com", role: "Staff" }
]



