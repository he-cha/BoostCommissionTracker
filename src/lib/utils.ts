import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CommissionRecord, MonthPaymentStatus } from '../types/index.ts';

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

export function extractMonthNumbers(desc: string): number[] {
  if (!desc) return [];

  const monthNumbers = new Set<number>();
  const rangePattern = /\bmonth(?:s)?\b\s*(?:#)?\s*(\d{1,2})\s*(?:-|to|through|thru)\s*(\d{1,2})/gi;
  const singlePattern = /\bmonth(?:s)?\b\s*(?:#)?\s*(\d{1,2})/gi;
  let match: RegExpExecArray | null;

  while ((match = rangePattern.exec(desc)) !== null) {
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    const from = Math.min(start, end);
    const to = Math.max(start, end);

    for (let month = from; month <= to; month++) {
      if (month >= 1 && month <= 6) monthNumbers.add(month);
    }
  }

  while ((match = singlePattern.exec(desc)) !== null) {
    const month = parseInt(match[1], 10);
    if (month >= 1 && month <= 6) monthNumbers.add(month);
  }

  return Array.from(monthNumbers).sort((a, b) => a - b);
}

export function inferMonthNumberFromDates(activationDate: string, paymentDate: string): number | null {
  if (!paymentDate) return null;

  const payment = new Date(paymentDate);
  if (isNaN(payment.getTime())) return null;

  if (!activationDate) return null;

  const activation = new Date(activationDate);
  if (isNaN(activation.getTime())) return null;

  const diffDays = Math.floor((payment.getTime() - activation.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;

  if (diffDays <= 15) return 1;
  if (diffDays <= 55) return 2;

  const inferredMonth = Math.floor((diffDays - 8) / 40) + 1;
  return inferredMonth >= 1 && inferredMonth <= 6 ? inferredMonth : null;
}

export function isLikelyMonthPaymentRecord(paymentType: string, paymentDescription: string): boolean {
  const combined = `${paymentType || ''} ${paymentDescription || ''}`.toLowerCase();
  const hasMonthText = /\bmonth\b/.test(combined);
  const hasLikelyPaymentType = /\b(?:commission|bounty|spiff|incentive)\b/.test(combined);
  const isWithholding = /\bwithholding\b/.test(combined);

  return (hasLikelyPaymentType && !isWithholding) || hasMonthText;
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
  const months = extractMonthNumbers(paymentDescription);
  return months[0] ?? null;
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
