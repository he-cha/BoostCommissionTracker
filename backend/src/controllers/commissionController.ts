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
      // Save file metadata to UploadedFile collection
      if (records.length > 0) {
        const { fileId, filename } = records[0];
        const recordCount = records.length;
        const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);
        if (fileId && filename) {
          try {
            await UploadedFile.create({ fileId, filename, recordCount, totalAmount });
          } catch (err) {
            console.error('Failed to save uploaded file metadata:', err);
          }
        }
      }
    res.status(201).json(inserted);
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(400).json({ error: 'Failed to upload commission records', details: error?.message || error });
  }
};
import { Request, Response } from 'express';
import CommissionRecord from '../models/CommissionRecord';
  import UploadedFile from '../models/UploadedFile';

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

// Update IMEI notes for all records with a specific IMEI
export const updateIMEINotes = async (req: Request, res: Response) => {
  try {
    const { imei } = req.params;
    const {
      notes,
      suspended,
      deactivated,
      blacklisted,
      byodSwap,
      customerName,
      customerNumber,
      customerEmail,
      withholdingResolved,
      isActive,
    } = req.body;

    // Update all records with this IMEI
    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (suspended !== undefined) updateData.suspended = suspended;
    if (deactivated !== undefined) updateData.deactivated = deactivated;
    if (blacklisted !== undefined) updateData.blacklisted = blacklisted;
    if (byodSwap !== undefined) updateData.byodSwap = byodSwap;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerNumber !== undefined) updateData.customerNumber = customerNumber;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
    if (withholdingResolved !== undefined) updateData.withholdingResolved = withholdingResolved;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await CommissionRecord.updateMany(
      { imei },
      { $set: updateData }
    );

    res.json({ 
      message: 'IMEI notes updated', 
      modifiedCount: result.modifiedCount,
      imei,
      updates: updateData
    });
  } catch (error) {
    console.error('Update IMEI notes error:', error);
    res.status(400).json({ error: 'Failed to update IMEI notes' });
  }
};

// Get IMEI notes (from any record with this IMEI)
export const getIMEINotes = async (req: Request, res: Response) => {
  try {
    const { imei } = req.params;
    const record = await CommissionRecord.findOne({ imei });
    
    if (!record) {
      return res.status(404).json({ error: 'IMEI not found' });
    }

    res.json({
      imei: record.imei,
      notes: record.notes || '',
      suspended: record.suspended || false,
      deactivated: record.deactivated || false,
      blacklisted: record.blacklisted || false,
      byodSwap: record.byodSwap || false,
      customerName: record.customerName,
      customerNumber: record.customerNumber,
      customerEmail: record.customerEmail,
      withholdingResolved: record.withholdingResolved || false,
    });
  } catch (error) {
    console.error('Get IMEI notes error:', error);
    res.status(500).json({ error: 'Failed to fetch IMEI notes' });
  }
};
