
import { useState, useMemo } from 'react';
import { IMEISummary } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, AlertCircle, CheckCircle2, Clock, XCircle, Edit, Trash2, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCommissionStore } from '../../stores/commissionStore';
import { useToast } from '../../hooks/use-toast';

interface IMEISummaryTableProps {
  summaries: IMEISummary[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onIMEIClick: (imei: string) => void;
}

export function IMEISummaryTable({ summaries, totalRecords, currentPage, totalPages, onPageChange, onIMEIClick }: IMEISummaryTableProps) {
    const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const toggleActive = useCommissionStore((state) => state.toggleActive);
  const deleteRecord = useCommissionStore((state) => state.deleteRecord);
  const getRecordsByIMEI = useCommissionStore((state) => state.getRecordsByIMEI);

  // Memoize filtered summaries to avoid recalculation
  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    
    const lowerSearch = searchTerm.toLowerCase();
    return summaries.filter(summary => 
      summary.imei.toLowerCase().includes(lowerSearch) ||
      summary.saleType.toLowerCase().includes(lowerSearch) ||
      summary.store?.toLowerCase().includes(lowerSearch)
    );
  }, [summaries, searchTerm]);

  const handleToggleActive = (imei: string) => {
    toggleActive(imei);
    const records = getRecordsByIMEI(imei);
    const newState = !records[0]?.isActive;
    toast({
      title: newState ? 'Activated' : 'Deactivated',
      description: `IMEI ${imei} has been ${newState ? 'activated' : 'deactivated'}`,
    });
  };

  const handleDelete = (imei: string) => {
    if (confirm(`Delete all records for IMEI ${imei}?`)) {
      const records = getRecordsByIMEI(imei);
      records.forEach(r => deleteRecord(r.id));
      toast({
        title: 'Deleted',
        description: `All records for IMEI ${imei} have been deleted`,
        variant: 'destructive',
      });
    }
  };

  const getMonthIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by IMEI, Sale Type, or Store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">IMEI</TableHead>
                <TableHead className="font-semibold">Activation Date</TableHead>
                <TableHead className="font-semibold">Sale Type</TableHead>
                <TableHead className="font-semibold">Store</TableHead>
                <TableHead className="font-semibold text-center">Payment Timeline</TableHead>
                <TableHead className="font-semibold text-right">Total Earned</TableHead>
                <TableHead className="font-semibold text-right">Withheld</TableHead>
                <TableHead className="font-semibold text-right">Net</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSummaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSummaries.map((summary) => (
                  (() => {
                    const notes = imeiNotesMap.get(summary.imei);
                    let rowColor = "";
                    if (notes?.deactivated) rowColor = "bg-red-100";
                    else if (notes?.suspended) rowColor = "bg-white";
                    return (
                      <TableRow key={summary.imei} className={cn("hover:bg-muted/30", !summary.isActive && "opacity-50", rowColor)}>
                    <TableCell className="font-mono text-sm font-medium">
                      <button
                        onClick={() => onIMEIClick(summary.imei)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {summary.imei}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(summary.activationDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {summary.saleType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {summary.store || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        {summary.monthsStatus.map((month) => (
                          <div
                            key={month.month}
                            className="group relative"
                          >
                            <div
                              className={cn(
                                'flex items-center justify-center w-8 h-8 rounded border transition-all',
                                month.status === 'paid' && 'bg-success/10 border-success/30',
                                month.status === 'overdue' && 'bg-destructive/10 border-destructive/30 animate-pulse',
                                month.status === 'missing' && 'bg-destructive/10 border-destructive/30',
                                month.status === 'pending' && 'bg-muted border-border'
                              )}
                            >
                              {getMonthIcon(month.status)}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <div className="font-semibold">Month {month.month}</div>
                              <div className="text-muted-foreground">
                                {month.status === 'paid' ? `Paid: ${formatDate(month.actualDate!)}` : `Due: ${formatDate(month.expectedDate)}`}
                              </div>
                              {month.amount && (
                                <div className="text-success font-medium">
                                  {formatCurrency(month.amount)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatCurrency(summary.totalEarned)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {summary.totalWithheld > 0 ? `-${formatCurrency(summary.totalWithheld)}` : '—'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-bold text-base',
                      summary.netAmount >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {formatCurrency(summary.netAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onIMEIClick(summary.imei)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(summary.imei)}
                          className="h-8 w-8 p-0"
                        >
                          <Power className={cn("h-4 w-4", summary.isActive ? "text-success" : "text-muted-foreground")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(summary.imei)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {((currentPage - 1) * summaries.length) + 1} - {Math.min(currentPage * summaries.length, totalRecords)} of {totalRecords} activations
          {searchTerm && ` (filtered to ${filteredSummaries.length})`}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-destructive" />
            <span>Missing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
