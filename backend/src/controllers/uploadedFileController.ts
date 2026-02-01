import { Request, Response } from 'express';
import UploadedFile from '../models/UploadedFile';
import CommissionRecord from '../models/CommissionRecord';

export const getAllUploadedFiles = async (_req: Request, res: Response) => {
  try {
    const files = await UploadedFile.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch uploaded files' });
  }
};

  try {
    const file = new UploadedFile(req.body);
    await file.save();
    res.status(201).json(file);
  } catch (error) {
    res.status(400).json({ error: 'Failed to save uploaded file' });
  }
};

export const deleteUploadedFile = async (req: Request, res: Response) => {
  try {
    const file = await UploadedFile.findOneAndDelete({ fileId: req.params.fileId });
    if (!file) return res.status(404).json({ error: 'File not found' });
    // Delete all commission records with this fileId
    await CommissionRecord.deleteMany({ fileId: req.params.fileId });
    res.json({ message: 'File and associated records deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file and records' });
  }
};
