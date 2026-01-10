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
import { parseCSVLine, cleanIMEI, extractMonthNumber } from './utils';

export function parseBoostCSV(csvContent: string, fileId?: string): CommissionRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }
  
  const headers = parseCSVLine(lines[0]);
  
  // Pre-compute column indices once
  const getColumnIndex = (name: string) => {
    const index = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
    if (index === -1) {
      throw new Error(`Required column "${name}" not found in CSV`);
    }
    return index;
  };
  
  const columnIndices = {
    paymentDate: getColumnIndex('Payment Date'),
    activationDate: getColumnIndex('Activation Date'),
    imei: getColumnIndex('IMEI'),
    amount: getColumnIndex('Amount'),
    paymentType: getColumnIndex('Payment Type'),
    paymentDesc: getColumnIndex('Payment Description'),
    saleType: getColumnIndex('Sale Type'),
    repUsername: headers.findIndex(h => h.toLowerCase().includes('rep username')),
    store: headers.findIndex(h => h.toLowerCase().includes('business name')),
    adjustmentReason: headers.findIndex(h => h.toLowerCase().includes('adjustment reason')),
  };
  
  const records: CommissionRecord[] = [];
  const timestamp = Date.now();
  
  // Process records in batches for better performance
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);

    // Skip incomplete rows
    if (columns.length < headers.length - 5) continue;

    const imei = cleanIMEI(columns[columnIndices.imei] || '');
    const amountStr = columns[columnIndices.amount] || '0';

    // Skip rows without IMEI or amount
    if (!imei || imei === 'Unknown' || !amountStr) continue;

    const paymentDescription = columns[columnIndices.paymentDesc] || '';
    const monthNumber = extractMonthNumber(paymentDescription);
    const amountValue = parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0;

    // Skip zero amounts to reduce noise
    if (amountValue === 0) continue;

    // Convert dates to ISO format
    const paymentDateRaw = columns[columnIndices.paymentDate] || '';
    const activationDateRaw = columns[columnIndices.activationDate] || '';
    const paymentDate = toISODate(paymentDateRaw);
    const activationDate = toISODate(activationDateRaw);

    const record: CommissionRecord = {
      id: `${imei}-${i}-${timestamp}`,
      imei,
      paymentDate,
      activationDate,
      paymentType: columns[columnIndices.paymentType] || 'Commission',
      amount: amountValue,
      paymentDescription,
      adjustmentReason: columnIndices.adjustmentReason >= 0 && columns[columnIndices.adjustmentReason]?.trim() 
        ? columns[columnIndices.adjustmentReason].trim() 
        : undefined,
      monthNumber,
      saleType: columns[columnIndices.saleType] || 'Unknown',
      repUsername: columnIndices.repUsername >= 0 ? columns[columnIndices.repUsername] : undefined,
      store: columnIndices.store >= 0 ? columns[columnIndices.store]?.replace(/\*\d+$/, '').trim() : undefined,
      isActive: true,
      fileId,
    };

    records.push(record);
  }
  
  console.log(`✅ Parsed ${records.length} valid records from ${lines.length - 1} CSV rows`);
  return records;
}
