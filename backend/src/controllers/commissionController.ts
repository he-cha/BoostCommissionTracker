// Bulk upload commissions
export const uploadCommissions = async (req: Request, res: Response) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }
    // Insert many records at once
    const inserted = await CommissionRecord.insertMany(records, { ordered: false });
    res.status(201).json(inserted);
  } catch (error) {
    res.status(400).json({ error: 'Failed to upload commission records', details: error });
  }
};
import { Request, Response } from 'express';
import CommissionRecord from '../models/CommissionRecord';

export const getAllCommissions = async (_req: Request, res: Response) => {
  try {
    const commissions = await CommissionRecord.find();
    res.json(commissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commission records' });
  }
};

export const createCommission = async (req: Request, res: Response) => {
  try {
    const commission = new CommissionRecord(req.body);
    await commission.save();
    res.status(201).json(commission);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create commission record' });
  }
};

export const getCommissionById = async (req: Request, res: Response) => {
  try {
    const commission = await CommissionRecord.findById(req.params.id);
    if (!commission) return res.status(404).json({ error: 'Not found' });
    res.json(commission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commission record' });
  }
};

export const updateCommission = async (req: Request, res: Response) => {
  try {
    const commission = await CommissionRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!commission) return res.status(404).json({ error: 'Not found' });
    res.json(commission);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update commission record' });
  }
};

export const deleteCommission = async (req: Request, res: Response) => {
  try {
    const commission = await CommissionRecord.findByIdAndDelete(req.params.id);
    if (!commission) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Commission record deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete commission record' });
  }
};
