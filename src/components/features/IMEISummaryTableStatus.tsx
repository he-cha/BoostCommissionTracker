import { IMEISummary } from '../../types';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

interface IMEISummaryTableStatusProps {
  summaries: IMEISummary[];
  onIMEIClick?: (imei: string) => void;
}

export function IMEISummaryTableStatus({ summaries, onIMEIClick }: IMEISummaryTableStatusProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    const lowerSearch = searchTerm.toLowerCase();
    return summaries.filter(summary =>
      summary.imei.toLowerCase().includes(lowerSearch)
    );
  }, [summaries, searchTerm]);

  return (
    <div className="space-y-4" />
  );
}
