import mongoose from 'mongoose';

const UploadedFileSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  recordCount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
});

export default mongoose.model('UploadedFile', UploadedFileSchema);