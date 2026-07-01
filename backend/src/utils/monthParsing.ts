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

  if (record.paymentDate && (record.activationDate || record.paymentDate)) {
    const actDate = new Date(record.activationDate || record.paymentDate);
    const payDate = new Date(record.paymentDate);
    if (!isNaN(actDate.getTime()) && !isNaN(payDate.getTime())) {
      const diffDays = Math.floor((payDate.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24));
      const autoMonth = Math.floor(diffDays / 35) + 1;
      if (autoMonth >= 1 && autoMonth <= 6) return [autoMonth];
    }
  }

  return [];
}
