// Bulk upload commissions
export const uploadCommissions = async (req: Request, res: Response) => {
  try {
    const { records } = req.body;
    console.log('Received records for upload:', Array.isArray(records) ? records.length : records);
    if (!Array.isArray(records) || records.length === 0) {
      console.error('No records provided');
      return res.status(400).json({ error: 'No records provided' });
    }
    // Log a sample record for debugging
    console.log('Sample record:', records[0]);
    // Insert many records at once
    const inserted = await CommissionRecord.insertMany(records, { ordered: false });
    console.log('Inserted records:', inserted.length);
    res.status(201).json(inserted);
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(400).json({ error: 'Failed to upload commission records', details: error?.message || error });
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
