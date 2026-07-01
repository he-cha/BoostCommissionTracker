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
  if (!activationDate || !paymentDate) return null;

  const activation = new Date(activationDate);
  const payment = new Date(paymentDate);
  if (isNaN(activation.getTime()) || isNaN(payment.getTime())) return null;

  const diffDays = Math.floor((payment.getTime() - activation.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;

  if (diffDays <= 15) return 1;
  if (diffDays <= 55) return 2;

  const inferredMonth = Math.floor((diffDays - 8) / 40) + 1;
  return inferredMonth >= 1 && inferredMonth <= 6 ? inferredMonth : null;
}

export function inferMonthNumbersFromRecord(record: {
  monthNumber?: number | null;
  paymentType?: string;
  paymentDescription?: string;
  paymentDate?: string;
  activationDate?: string;
}): number[] {
  const explicitText = [record.paymentType, record.paymentDescription].filter(Boolean).join(' ');
  const explicitMonths = extractMonthNumbers(explicitText);
  if (explicitMonths.length > 0) {
    return explicitMonths;
  }

  if (typeof record.monthNumber === 'number' && record.monthNumber >= 1 && record.monthNumber <= 6) {
    return [record.monthNumber];
  }

  if (record.paymentDate && record.activationDate) {
    const inferredMonth = inferMonthNumberFromDates(record.activationDate, record.paymentDate);
    if (inferredMonth) return [inferredMonth];
  }

  return [];
}
