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
  paymentDate: { type: String, required: true },
  activationDate: { type: String, required: true },
  paymentType: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentDescription: { type: String, required: true },
  adjustmentReason: { type: String },
  monthNumber: { type: Number, default: null },
  saleType: { type: String, required: true },
  repUsername: { type: String },
  store: { type: String },
  isActive: { type: Boolean, required: true },
  paymentReceived: { type: Boolean },
  manuallyEntered: { type: Boolean },
  fileId: { type: String },
});

export default model<ICommissionRecord>('CommissionRecord', CommissionRecordSchema);
