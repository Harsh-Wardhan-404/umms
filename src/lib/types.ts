// Generated TypeScript Interfaces from Prisma Schema

export type UserRole = "Admin" | "Supervisor" | "Worker" | "Dispatch" | "Sales";
export type StockType = "Raw" | "Packaging" | "Consumable";
export type DispatchStatus = "Ready" | "InTransit" | "Delivered";
export type BatchStatus = "Planned" | "InProgress" | "QualityCheck" | "Completed" | "Cancelled";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;

  createdFormulations?: FormulationVersion[];
  supervisedBatches?: Batch[];
  workerEfficiency?: WorkerEfficiency | null;
  createdInvoices?: Invoice[];
  createdDispatches?: Dispatch[];
}

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  contactPerson?: string | null;
  creditLimit?: number | null;
  paymentTerms?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  invoices?: Invoice[];
  feedback?: Feedback[];
}

export interface StockManagement {
  id: string;
  name: string;
  type: StockType;
  unit: string;
  currentStockQty: number;
  minThresholdQty: number;
  purchaseHistory: any[];
  createdAt: Date;
  updatedAt: Date;

  ingredients?: FormulationIngredient[];
  materialsUsed?: BatchMaterial[];
}

export interface Formulation {
  id: string;
  productName: string;
  versions?: FormulationVersion[];
  createdAt: Date;
  updatedAt: Date;

  batches?: Batch[];
  finishedGoods?: FinishedGood[];
}

export interface FormulationVersion {
  id: string;
  formulationId: string;
  versionNumber: number;
  isLocked: boolean;
  creatorId: string;
  creationDate: Date;
  notes?: string | null;
  ingredients?: FormulationIngredient[];

  formulation?: Formulation;
  creator?: User;
  batches?: Batch[];
}

export interface FormulationIngredient {
  id: string;
  formulationVersionId: string;
  materialId: string;
  percentageOrComposition: number;
  unit: string;
  notes?: string | null;

  formulationVersion?: FormulationVersion;
  material?: StockManagement;
}

export interface Batch {
  id: string;
  batchCode: string;
  productName: string;
  formulationVersionId: string;
  batchSize: number;
  supervisorId: string;
  workers: string[];
  shift: string;
  startTime: Date;
  endTime?: Date | null;
  status: BatchStatus;
  rawMaterialsUsed: any[];
  qrCodeData: string;
  photos: any[];
  productionNotes?: string | null;
  qualityChecks: any[];
  createdAt: Date;
  updatedAt: Date;

  formulationVersion?: FormulationVersion;
  supervisor?: User;
  finishedGood?: FinishedGood | null;
  materialsUsed?: BatchMaterial[];
  formulation?: Formulation;
}

export interface BatchMaterial {
  id: string;
  batchId: string;
  materialId: string;
  quantityUsed: number;

  batch?: Batch;
  material?: StockManagement;
}

export interface FinishedGood {
  id: string;
  batchId: string;
  productName: string;
  quantityProduced: number;
  availableQuantity: number;
  unitPrice: number;
  hsnCode: string;
  qualityStatus: string;
  createdAt: Date;
  updatedAt: Date;

  batch?: Batch;
  formulation?: Formulation;
  invoiceItems?: InvoiceItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  creatorId: string;
  invoiceDate: Date;
  dueDate: Date;
  items: any[];
  subtotal: number;
  taxDetails: any;
  totalAmount: number;
  invoicePdfUrl?: string | null;
  paymentStatus: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  invoiceItems?: InvoiceItem[];
  dispatch?: Dispatch | null;
  creator?: User;
  client?: Client;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  finishedGoodId: string;
  batchCode: string;
  quantity: number;
  hsnCode: string;
  pricePerUnit: number;

  invoice?: Invoice;
  finishedGood?: FinishedGood;
}

export interface Dispatch {
  id: string;
  invoiceId: string;
  courierName: string;
  awbNumber: string;
  dispatchDate: Date;
  status: DispatchStatus;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;

  invoice?: Invoice;
  feedback?: Feedback | null;
  creator?: User;
}

export interface Feedback {
  id: string;
  dispatchId: string;
  clientId: string;
  productId: string;
  ratingQuality: number;
  ratingPackaging: number;
  ratingDelivery: number;
  clientRemarks?: string | null;
  issueTags: string[];
  feedbackDate: Date;
  createdAt: Date;
  updatedAt: Date;

  dispatch?: Dispatch;
  client?: Client;
}

export interface WorkerEfficiency {
  id: string;
  userId: string;
  standardOutputQtyPerShift: number;
  punctualityScore: number;
  efficiencyRating: number;
  batchHistory: string[];
  createdAt: Date;
  updatedAt: Date;

  user?: User;
}

export interface ProfitLoss {
  id: string;
  month: Date;
  fixedExpenses: any;
  variableExpenses: any;
  totalSalesValue: number;
  grossProfit: number;
  netProfit: number;
  createdAt: Date;
  updatedAt: Date;
}
