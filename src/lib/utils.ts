import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CommissionRecord, MonthPaymentStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(absAmount);
  return isNegative ? `-${formatted}` : formatted;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  if (!date || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getAmountColor(amount: number): string {
  if (amount > 0) return 'text-success';
  if (amount < 0) return 'text-destructive';
  return 'text-muted-foreground';
}

export function getPaymentTypeBadgeColor(type: string): string {
  if (type.toLowerCase().includes('commission') && !type.toLowerCase().includes('withholding')) {
    return 'bg-success/10 text-success border-success/30';
  }
  if (type.toLowerCase().includes('withholding')) {
    return 'bg-destructive/10 text-destructive border-destructive/30';
  }
  if (type.toLowerCase().includes('adjustment')) {
    return 'bg-warning/10 text-warning border-warning/30';
  }
  return 'bg-muted text-muted-foreground';
}

export function calculateExpectedPaymentDate(activationDate: string, monthNumber: number): string {
  const activation = new Date(activationDate);
  if (!activationDate || isNaN(activation.getTime())) return '';
  let expectedDate = new Date(activation);

  if (monthNumber === 1) {
    // Month 1: within 15 days
     expectedDate.setDate(expectedDate.getDate() + 8);
  } else {
    // Month 2-6: +40 days from previous month
     expectedDate.setDate(expectedDate.getDate() + (monthNumber - 1) * 40);
  }

  return !isNaN(expectedDate.getTime()) ? expectedDate.toISOString().split('T')[0] : '';
}

export function getPaymentStatus(
  expectedDate: string,
  actualDate?: string
): 'paid' | 'overdue' | 'pending' {
  const today = new Date();
  const expected = new Date(expectedDate);
  
  if (actualDate) {
    return 'paid';
  }
  
  if (today > expected) {
    return 'overdue';
  }
  
  return 'pending';
}

export function extractMonthNumber(paymentDescription: string): number | null {
  const match = paymentDescription.match(/Month\s+(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function cleanIMEI(imei: string): string {
  // Remove Excel formula prefix like ="123456789"
  return imei.replace(/^="|"$/g, '').trim();
}
