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
});

export default model<ICommissionRecord>('CommissionRecord', CommissionRecordSchema);
