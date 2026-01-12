import { Schema, model, Document } from 'mongoose';

export interface ICommissionRecord extends Document {
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
  // IMEI status fields
  suspended: boolean;
  deactivated: boolean;
  blacklisted: boolean;
  byodSwap: boolean;
  customerName?: string;
  customerNumber?: string;
  customerEmail?: string;
  notes?: string;
  withholdingResolved?: boolean;
}

const CommissionRecordSchema = new Schema<ICommissionRecord>({
  imei: { type: String, required: true },
  store: { type: String, required: true },
  paymentDate: { type: String },
  activationDate: { type: String },
  paymentType: { type: String },
  amount: { type: Number },
  paymentDescription: { type: String },
  adjustmentReason: { type: String },
  monthNumber: { type: Number, default: null },
  saleType: { type: String },
  repUsername: { type: String },
  isActive: { type: Boolean },
  paymentReceived: { type: Boolean },
  manuallyEntered: { type: Boolean },
  fileId: { type: String },
  // IMEI status fields
  suspended: { type: Boolean, default: false },
  deactivated: { type: Boolean, default: false },
  blacklisted: { type: Boolean, default: false },
  byodSwap: { type: Boolean, default: false },
  customerName: { type: String },
  customerNumber: { type: String },
  customerEmail: { type: String },
  notes: { type: String },
  withholdingResolved: { type: Boolean, default: false },
});

export default model<ICommissionRecord>('CommissionRecord', CommissionRecordSchema);
