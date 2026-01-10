// Helper to convert MM-DD-YYYY to YYYY-MM-DD (ISO)
function toISODate(dateStr: string): string {
  if (!dateStr) return '';
  const [month, day, year] = dateStr.split('-').map(s => s.trim());
  if (!month || !day || !year) return '';
  // Pad month and day if needed
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

import { CommissionRecord } from '../types';
import { parseCSVLine, cleanIMEI } from './utils';

// Enhanced month extraction: looks for 'Month X' or 'MonthX' (with or without space)
function extractMonthNumberFlexible(desc: string): number | null {
  if (!desc) return null;
  const match = desc.match(/Month\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}


export function parseBoostCSV(csvContent: string, fileId?: string): CommissionRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }
  const headers = parseCSVLine(lines[0]);

  // Map CSV columns to backend schema fields
  const getCol = (name: string, fallback?: string[]): number => {
    let idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
    if (idx === -1 && fallback) {
      for (const alt of fallback) {
        idx = headers.findIndex(h => h.trim().toLowerCase() === alt.toLowerCase());
        if (idx !== -1) break;
      }
    // Accept both MM/DD/YYYY and MM-DD-YYYY
    function parseDateFlexible(dateStr: string): string {
      if (!dateStr) return '';
      // Try MM/DD/YYYY or MM-DD-YYYY
      const mdy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (mdy) {
        const [ , mm, dd, yyyy ] = mdy;
        // Always return full ISO string
        const iso = new Date(`${yyyy.length === 2 ? '20'+yyyy : yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T00:00:00`).toISOString();
        return iso;
      }
      // Fallback to ISO
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.toISOString();
      return '';
    }
    }
    return idx;
  };

  const col = {
    paymentDate: getCol('Payment Date'),
    activationDate: getCol('Activation Date/Swap Date', ['Activation Date']),
    imei: getCol('IMEI'),
    amount: getCol('Amount'),
    paymentType: getCol('Payment Type'),
    paymentDesc: getCol('Payment Description'),
    saleType: getCol('Sale Type'),
    repUsername: getCol('Rep Username'),
    store: getCol('Business Name'),
    adjustmentReason: getCol('Adjustment Reason'),
  };

  const records: CommissionRecord[] = [];
  const timestamp = Date.now();

  // Accept both MM/DD/YYYY and MM-DD-YYYY
  const parseDateFlexible = (dateStr: string): string => {
    if (!dateStr) return '';
    // Try MM/DD/YYYY or MM-DD-YYYY
    const mdy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (mdy) {
      const [ , mm, dd, yyyy ] = mdy;
      // Always return full ISO string
      const iso = new Date(`${yyyy.length === 2 ? '20'+yyyy : yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T00:00:00`).toISOString();
      return iso;
    }
    // Fallback to ISO
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
    return '';
  };

  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    // Skip incomplete rows
    if (columns.length < 10) continue;

    // IMEI: clean and fallback to Sale IMEI if needed
    let imei = col.imei >= 0 ? cleanIMEI(columns[col.imei] || '') : '';
    // If IMEI is missing or 'Unknown', try Sale IMEI
    if ((!imei || imei === 'Unknown') && headers.includes('Sale IMEI')) {
      const saleImeiIdx = getCol('Sale IMEI');
      imei = saleImeiIdx >= 0 ? cleanIMEI(columns[saleImeiIdx] || '') : '';
    }
    // If still missing, try to extract IMEI from paymentDescription
    if ((!imei || imei === 'Unknown') && col.paymentDesc >= 0) {
      const paymentDescription = columns[col.paymentDesc] || '';
      // Look for IMEI as a 15-digit number in the description
      const imeiMatch = paymentDescription.match(/IMEI\s*(\d{15})/i);
      if (imeiMatch) {
        imei = imeiMatch[1];
      } else {
        // Fallback: look for any 15-digit number
        const genericMatch = paymentDescription.match(/(\d{15})/);
        if (genericMatch) {
          imei = genericMatch[1];
        }
      }
    }
    if (!imei || imei === 'Unknown') continue;

    // Amount
    const amountStr = col.amount >= 0 ? columns[col.amount] || '0' : '0';
    const amountValue = parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0;
    if (amountValue === 0) continue;

    // Payment Description
    const paymentDescription = col.paymentDesc >= 0 ? columns[col.paymentDesc] || '' : '';

    // Dates (must be parsed before monthNumber logic)
    const paymentDateRaw = col.paymentDate >= 0 ? columns[col.paymentDate] || '' : '';
    const activationDateRaw = col.activationDate >= 0 ? columns[col.activationDate] || '' : '';
    const paymentDate = parseDateFlexible(paymentDateRaw);
    const activationDate = parseDateFlexible(activationDateRaw);

    let monthNumber = extractMonthNumberFlexible(paymentDescription);
    // Only auto-calculate if not found in description
    if (!monthNumber && activationDate && paymentDate) {
      const act = new Date(activationDate);
      const pay = new Date(paymentDate);
      if (!isNaN(act.getTime()) && !isNaN(pay.getTime())) {
        const diffDays = Math.floor((pay.getTime() - act.getTime()) / (1000 * 60 * 60 * 24));
        monthNumber = Math.floor(diffDays / 35) + 1;
        if (monthNumber < 1 || monthNumber > 6) monthNumber = null;
      }
    }

    // Sale Type
    const saleType = col.saleType >= 0 ? columns[col.saleType] : (headers.includes('Sale Type') ? columns[getCol('Sale Type')] : 'Unknown');

    // Rep Username
    const repUsername = col.repUsername >= 0 ? columns[col.repUsername] : undefined;

    // Store
    const store = col.store >= 0 ? columns[col.store]?.replace(/\*\d+$/, '').trim() : undefined;

    // Adjustment Reason
    const adjustmentReason = col.adjustmentReason >= 0 && columns[col.adjustmentReason]?.trim() ? columns[col.adjustmentReason].trim() : undefined;

    // Payment Type
    const paymentType = col.paymentType >= 0 ? columns[col.paymentType] : 'Commission';

    // Build record
    const record: CommissionRecord = {
      id: `${imei}-${i}-${timestamp}`,
      imei,
      paymentDate,
      activationDate,
      paymentType,
      amount: amountValue,
      paymentDescription,
      adjustmentReason,
      monthNumber,
      saleType: saleType || 'Unknown',
      repUsername,
      store,
      isActive: true,
      fileId,
    };
    records.push(record);
  }
  if (records.length > 0) {
    console.log('First parsed record:', records[0]);
  }
  console.log(`✅ Parsed ${records.length} valid records from ${lines.length - 1} CSV rows`);
  return records;
}
