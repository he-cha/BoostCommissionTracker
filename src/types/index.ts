export interface CommissionRecord {
  id: string;
  imei: string;
  paymentDate: string;
  activationDate: string;
  paymentType: string;
  amount: number;
  paymentDescription: string;
  adjustmentReason?: string;
  monthNumber: number | null;
  saleType: string;
  repUsername?: string;
  store?: string;
  isActive: boolean;
  paymentReceived?: boolean;
  manuallyEntered?: boolean;
  fileId?: string;
}

export interface FileUpload {
  id: string;
  filename: string;
  uploadedAt: string;
  recordCount: number;
  totalAmount: number;
}

export interface IMEINotes {
  imei: string;
  notes: string;
  withholdingResolved: boolean;
  suspended: boolean;
  deactivated: boolean;
  blacklisted: boolean;
  byodSwap: boolean;
  alertsAcknowledged: boolean;
  customerName?: string;
  customerNumber?: string;
  customerEmail?: string;
}

export interface DashboardMetrics {
  totalEarned: number;
  totalWithheld: number;
  netCommission: number;
  uniqueIMEIs: number;
  currentPeriod: string;
  negativeCount: number;
  overduePayments: number;
  missingMonths: number;
}

export interface MonthPaymentStatus {
  month: number;
  expectedDate: string;
  actualDate?: string;
  amount?: number;
  status: 'paid' | 'overdue' | 'pending' | 'missing';
  recordId?: string;
  paymentReceived?: boolean;
}

export interface IMEISummary {
  imei: string;
  activationDate: string;
  saleType: string;
  repUsername?: string;
  store?: string;
  monthsStatus: MonthPaymentStatus[];
  totalEarned: number;
  totalWithheld: number;
  netAmount: number;
  alertCount: number;
  isActive: boolean;
}

export interface Alert {
  id: string;
  imei: string;
  type: 'missing_month' | 'overdue' | 'negative' | 'sequence_gap';
  severity: 'high' | 'medium' | 'low';
  message: string;
  expectedMonth?: number;
  expectedDate?: string;
  activationDate: string;
}

export interface User {
  id: string;
  email: string;
  role: 'manager';
}
