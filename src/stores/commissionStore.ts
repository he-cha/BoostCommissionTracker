import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CommissionRecord, DashboardMetrics, IMEISummary, Alert, MonthPaymentStatus, IMEINotes, FileUpload } from '../types';
import { calculateExpectedPaymentDate, getPaymentStatus } from '../lib/utils';

interface CommissionState {
  records: CommissionRecord[];
  setRecords: (records: CommissionRecord[]) => void;
  uploadedFiles: FileUpload[];
  imeiNotes: Map<string, IMEINotes>;
  addRecords: (records: CommissionRecord[], fileMetadata?: { filename: string; fileId: string }) => void;
  deleteFile: (fileId: string) => void;
  updateRecord: (id: string, updates: Partial<CommissionRecord>) => void;
  deleteRecord: (id: string) => void;
  toggleActive: (imei: string) => void;
  getRecordsByIMEI: (imei: string) => CommissionRecord[];
  getMetrics: (filters?: { dateRange?: [string, string]; store?: string; category?: string }) => DashboardMetrics;
  getIMEISummaries: (filters?: { dateRange?: [string, string]; store?: string; saleType?: string; category?: string }) => IMEISummary[];
  getAlerts: () => Alert[];
  clearRecords: () => void;
  updateIMEINotes: (imei: string, notes: string, suspended?: boolean, suspendedInfo?: string, deactivated?: boolean, deactivatedInfo?: string) => void;
  updateWithholdingResolved: (imei: string, resolved: boolean) => void;
  getIMEINotes: (imei: string) => IMEINotes | undefined;
  addMonthPayment: (imei: string, month: number, amount: number, paymentReceived: boolean, paymentDate?: string) => void;
}


export const useCommissionStore = create<CommissionState>()(persist((set, get) => ({
  records: [],
  setRecords: (records: CommissionRecord[]) => set({ records }),
  uploadedFiles: [],
  imeiNotes: new Map(),
  
  addRecords: (newRecords, fileMetadata) => {
    set((state) => {
      // Optimized deduplication using Map for O(1) lookups
      const existing = new Map(
        state.records.map(r => [`${r.imei}-${r.paymentDate}-${r.amount}`, true])
      );
      
      const unique = newRecords.filter(
        r => !existing.has(`${r.imei}-${r.paymentDate}-${r.amount}`)
      );
      
      console.log(`📊 Adding ${unique.length} new records (${newRecords.length - unique.length} duplicates skipped)`);
      
      const newState: any = {
        records: [...state.records, ...unique],
      };
      
      // Add file metadata if provided
      if (fileMetadata && unique.length > 0) {
        const totalAmount = unique.reduce((sum, r) => sum + r.amount, 0);
        const fileUpload: FileUpload = {
          id: fileMetadata.fileId,
          filename: fileMetadata.filename,
          uploadedAt: new Date().toISOString(),
          recordCount: unique.length,
          totalAmount,
        };
        newState.uploadedFiles = [...state.uploadedFiles, fileUpload];
      }
      
      return newState;
    });
  },
  
  deleteFile: (fileId) => {
    set((state) => {
      const recordsToDelete = state.records.filter(r => r.fileId === fileId).length;
      console.log(`🗑️ Deleting ${recordsToDelete} records from file ${fileId}`);
      
      return {
        records: state.records.filter(r => r.fileId !== fileId),
        uploadedFiles: state.uploadedFiles.filter(f => f.id !== fileId),
      };
    });
  },
  
  updateRecord: (id, updates) => {
    set((state) => ({
      records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  },
  
  deleteRecord: (id) => {
    set((state) => ({
      records: state.records.filter(r => r.id !== id)
    }));
  },
  
  toggleActive: (imei) => {
    set((state) => {
      const imeiRecords = state.records.filter(r => r.imei === imei);
      if (imeiRecords.length === 0) return state;
      
      const newActiveState = !imeiRecords[0].isActive;
      return {
        records: state.records.map(r => 
          r.imei === imei ? { ...r, isActive: newActiveState } : r
        )
      };
    });
  },
  
  getRecordsByIMEI: (imei) => {
    return get().records.filter(r => r.imei === imei);
  },
  
  clearRecords: () => {
    set({ records: [] });
  },
  
  updateIMEINotes: (imei, notes, suspended, suspendedInfo, deactivated, deactivatedInfo) => {
    set((state) => {
      const newNotes = new Map(state.imeiNotes);
      const existing = newNotes.get(imei) || { imei, notes: '', withholdingResolved: false };
      newNotes.set(imei, {
        ...existing,
        notes,
        suspended: suspended ?? existing.suspended,
        suspendedInfo: suspendedInfo ?? existing.suspendedInfo,
        deactivated: deactivated ?? existing.deactivated,
        deactivatedInfo: deactivatedInfo ?? existing.deactivatedInfo,
      });
      return { imeiNotes: newNotes };
    });
  },
  
  updateWithholdingResolved: (imei, resolved) => {
    set((state) => {
      const newNotes = new Map(state.imeiNotes);
      const existing = newNotes.get(imei) || { imei, notes: '', withholdingResolved: false };
      newNotes.set(imei, { ...existing, withholdingResolved: resolved });
      return { imeiNotes: newNotes };
    });
  },
  
  getIMEINotes: (imei) => {
    return get().imeiNotes.get(imei);
  },
  
  addMonthPayment: (imei, month, amount, paymentReceived, paymentDate) => {
    const records = get().getRecordsByIMEI(imei);
    const activationRecord = records.find(r => r.activationDate) || records[0];
    
    if (!activationRecord) return;
    
    const newRecord: CommissionRecord = {
      id: `manual-${Date.now()}-${Math.random()}`,
      imei,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      activationDate: activationRecord.activationDate,
      paymentType: `${activationRecord.saleType} - Month ${month}`,
      amount,
      paymentDescription: `Manual Entry - Month ${month}`,
      monthNumber: month,
      saleType: activationRecord.saleType,
      repUsername: activationRecord.repUsername,
      store: activationRecord.store,
      isActive: true,
      paymentReceived,
      manuallyEntered: true,
    };
    
    set((state) => ({
      records: [...state.records, newRecord],
    }));
  },
  
  getMetrics: (filters) => {
    let records = get().records.filter(r => r.isActive);
    
    if (filters?.dateRange) {
      const [start, end] = filters.dateRange;
      records = records.filter(r => {
        const paymentDate = new Date(r.paymentDate);
        return paymentDate >= new Date(start) && paymentDate <= new Date(end);
      });
    }
    
    if (filters?.store && filters.store.trim()) {
      records = records.filter(r => r.store === filters.store);
    }
    
    if (filters?.category) {
      if (filters.category === 'earned') {
        records = records.filter(r => r.amount > 0);
      } else if (filters.category === 'withheld') {
        records = records.filter(r => r.amount < 0);
      }
    };
    const alerts = get().getAlerts();
    const allRecords = get().records.filter(r => r.isActive);
    
    const totalEarned = records
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalWithheld = Math.abs(
      records
        .filter(r => r.amount < 0)
        .reduce((sum, r) => sum + r.amount, 0)
    );
    
    const netCommission = totalEarned - totalWithheld;
    
    const uniqueIMEIs = new Set(records.map(r => r.imei)).size;
    
    const negativeCount = records.filter(r => r.amount < 0).length;
    
    // Calculate alerts from all active records
    const allIMEIs = new Set(allRecords.map(r => r.imei));
    let overdueCount = 0;
    
    allIMEIs.forEach(imei => {
      const imeiRecords = allRecords.filter(r => r.imei === imei);
      const activationRecord = imeiRecords.find(r => r.activationDate) || imeiRecords[0];
      if (activationRecord) {
        for (let month = 1; month <= 6; month++) {
          const expectedDate = calculateExpectedPaymentDate(activationRecord.activationDate, month);
          const monthPayment = imeiRecords.find(r => r.monthNumber === month && r.amount > 0);
          if (!monthPayment) {
            // Calculate days overdue
            const today = new Date();
            const expected = new Date(expectedDate);
            if (today > expected) {
              const daysOverdue = Math.floor((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
              // Optionally, you can push an alert here for each overdue month
              overdueCount++;
              // Example: add to alerts array if you want per-month alert
              // alerts.push({
              //   id: `${imei}-overdue-${month}`,
              //   imei,
              //   type: 'overdue',
              //   severity: daysOverdue > 30 ? 'high' : 'medium',
              //   message: `Month ${month} payment overdue by ${daysOverdue} days`,
              //   expectedMonth: month,
              //   expectedDate,
              //   activationDate: activationRecord.activationDate,
              // });
            }
          }
        }
      }
    });
    
    const overduePayments = overdueCount;
    const missingMonths = alerts.filter(a => a.type === 'missing_month' || a.type === 'sequence_gap').length;
    
    let currentPeriod = 'All Time';
    if (filters?.dateRange) {
      const [start, end] = filters.dateRange;
      const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      currentPeriod = `${startDate} - ${endDate}`;
    } else {
      const now = new Date();
      currentPeriod = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return {
      totalEarned,
      totalWithheld,
      netCommission,
      uniqueIMEIs,
      currentPeriod,
      negativeCount,
      overduePayments,
      missingMonths,
    };
  },
  
  getIMEISummaries: (filters) => {
    let records = get().records.filter(r => r.isActive);
    
    if (filters?.store && filters.store.trim()) {
      records = records.filter(r => r.store === filters.store);
    }
    
    if (filters?.saleType && filters.saleType.trim()) {
      records = records.filter(r => r.saleType === filters.saleType);
    }
    
    if (filters?.dateRange) {
      const [start, end] = filters.dateRange;
      records = records.filter(r => {
        const activationDate = new Date(r.activationDate);
        return activationDate >= new Date(start) && activationDate <= new Date(end);
      });
    }
    
    if (filters?.category === 'overdue') {
      // Filter to only show IMEIs with overdue payments
      const imeiGroups = new Map<string, CommissionRecord[]>();
      records.forEach(record => {
        if (!imeiGroups.has(record.imei)) {
          imeiGroups.set(record.imei, []);
        }
        imeiGroups.get(record.imei)!.push(record);
      });
      
      const overdueIMEIs = new Set<string>();
      imeiGroups.forEach((imeiRecords, imei) => {
        const activationRecord = imeiRecords.find(r => r.activationDate) || imeiRecords[0];
        if (activationRecord) {
          for (let month = 1; month <= 6; month++) {
            const expectedDate = calculateExpectedPaymentDate(activationRecord.activationDate, month);
            const monthPayment = imeiRecords.find(r => r.monthNumber === month && r.amount > 0);
            if (!monthPayment && getPaymentStatus(expectedDate) === 'overdue') {
              overdueIMEIs.add(imei);
              break;
            }
          }
        }
      });
      
      records = records.filter(r => overdueIMEIs.has(r.imei));
    } else if (filters?.category === 'withheld') {
      // Filter to only show IMEIs with withholdings
      const imeiGroups = new Map<string, CommissionRecord[]>();
      records.forEach(record => {
        if (!imeiGroups.has(record.imei)) {
          imeiGroups.set(record.imei, []);
        }
        imeiGroups.get(record.imei)!.push(record);
      });
      
      const withheldIMEIs = new Set<string>();
      imeiGroups.forEach((imeiRecords, imei) => {
        const hasWithholding = imeiRecords.some(r => r.amount < 0);
        if (hasWithholding) {
          withheldIMEIs.add(imei);
        }
      });
      
      records = records.filter(r => withheldIMEIs.has(r.imei));
    };
    const imeiGroups = new Map<string, CommissionRecord[]>();
    
    // Group records by IMEI
    records.forEach(record => {
      if (!imeiGroups.has(record.imei)) {
        imeiGroups.set(record.imei, []);
      }
      imeiGroups.get(record.imei)!.push(record);
    });
    
    const summaries: IMEISummary[] = [];
    
    imeiGroups.forEach((imeiRecords, imei) => {
      const activationRecord = imeiRecords.find(r => r.activationDate) || imeiRecords[0];
      const activationDate = activationRecord.activationDate;
      
      if (!activationDate) return;
      
      // Calculate month status for months 1-6
      const monthsStatus: MonthPaymentStatus[] = [];
      
      for (let month = 1; month <= 6; month++) {
        const expectedDate = calculateExpectedPaymentDate(activationDate, month);
        const monthPayment = imeiRecords.find(r => r.monthNumber === month && r.amount > 0);
        
        let status: 'paid' | 'overdue' | 'pending' | 'missing' = 'pending';
        
        if (monthPayment) {
          status = 'paid';
        } else {
          // Check if this month is overdue
          const paymentStatus = getPaymentStatus(expectedDate);
          if (paymentStatus === 'overdue') {
            // Check if there's a later month paid (indicating this month was skipped)
            const laterMonthPaid = imeiRecords.some(r => r.monthNumber && r.monthNumber > month && r.amount > 0);
            status = laterMonthPaid ? 'missing' : 'overdue';
          } else {
            status = 'pending';
          }
        }
        
        monthsStatus.push({
          month,
          expectedDate,
          actualDate: monthPayment?.paymentDate,
          amount: monthPayment?.amount,
          status,
          recordId: monthPayment?.id,
          paymentReceived: monthPayment?.paymentReceived,
        });
      }
      
      const totalEarned = imeiRecords
        .filter(r => r.amount > 0)
        .reduce((sum, r) => sum + r.amount, 0);
      
      const totalWithheld = Math.abs(
        imeiRecords
          .filter(r => r.amount < 0)
          .reduce((sum, r) => sum + r.amount, 0)
      );
      
      const alertCount = monthsStatus.filter(m => m.status === 'overdue' || m.status === 'missing').length +
                        (totalWithheld > 0 ? 1 : 0);
      
      summaries.push({
        imei,
        activationDate,
        saleType: activationRecord.saleType,
        repUsername: activationRecord.repUsername,
        store: activationRecord.store,
        monthsStatus,
        totalEarned,
        totalWithheld,
        netAmount: totalEarned - totalWithheld,
        alertCount,
        isActive: activationRecord.isActive,
      });
    });
    
    return summaries.sort((a, b) => 
      new Date(b.activationDate).getTime() - new Date(a.activationDate).getTime()
    );
  },
  
  getAlerts: () => {
    const summaries = get().getIMEISummaries();
    const imeiNotes = get().imeiNotes;
    const alerts: Alert[] = [];
    
    summaries.forEach(summary => {
      // Check for missing months (sequence gaps)
      const paidMonths = summary.monthsStatus
        .filter(m => m.status === 'paid')
        .map(m => m.month)
        .sort((a, b) => a - b);
      
      if (paidMonths.length > 0) {
        const maxPaidMonth = Math.max(...paidMonths);
        for (let month = 1; month < maxPaidMonth; month++) {
          if (!paidMonths.includes(month)) {
            alerts.push({
              id: `${summary.imei}-missing-${month}`,
              imei: summary.imei,
              type: 'sequence_gap',
              severity: 'high',
              message: `Month ${month} payment missing (later months received)`,
              expectedMonth: month,
              expectedDate: summary.monthsStatus[month - 1].expectedDate,
              activationDate: summary.activationDate,
            });
          }
        }
      }
      
      // Check for overdue payments
      summary.monthsStatus.forEach(monthStatus => {
        if (monthStatus.status === 'overdue') {
          const daysOverdue = Math.floor(
            (new Date().getTime() - new Date(monthStatus.expectedDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          alerts.push({
            id: `${summary.imei}-overdue-${monthStatus.month}`,
            imei: summary.imei,
            type: 'overdue',
            severity: daysOverdue > 30 ? 'high' : 'medium',
            message: `Month ${monthStatus.month} payment overdue by ${daysOverdue} days`,
            expectedMonth: monthStatus.month,
            expectedDate: monthStatus.expectedDate,
            activationDate: summary.activationDate,
          });
        }
      });
      
      // Check for negative commissions (only if not resolved)
      const notes = imeiNotes.get(summary.imei);
      if (summary.totalWithheld > 0 && !notes?.withholdingResolved) {
        alerts.push({
          id: `${summary.imei}-negative`,
          imei: summary.imei,
          type: 'negative',
          severity: 'medium',
          message: `Withholding/clawback detected: -$${summary.totalWithheld.toFixed(2)}`,
          activationDate: summary.activationDate,
        });
      }
    });
    
    return alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  },
}), {
  name: 'commission-storage',
  partialize: (state) => ({
    // Only persist metadata, not full records
    uploadedFiles: state.uploadedFiles,
    imeiNotes: Array.from(state.imeiNotes.entries()),
  }),
  onRehydrateStorage: () => (state) => {
    if (state && Array.isArray(state.imeiNotes)) {
      state.imeiNotes = new Map(state.imeiNotes as any);
    }
  },
}));
