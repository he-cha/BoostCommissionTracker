import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Search, Filter, X } from 'lucide-react';
import { useCommissionStore } from '../stores/commissionStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { Badge } from '../components/ui/badge';

interface SuspendedIMEIPageProps {
  onBack: () => void;
  onIMEIClick: (imei: string) => void;
}

export function SuspendedIMEIPage({ onBack, onIMEIClick }: SuspendedIMEIPageProps) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const getIMEISummaries = useCommissionStore((state) => state.getIMEISummaries);
  const records = useCommissionStore((state) => state.records);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Get unique stores
  const stores = useMemo(
    () => Array.from(new Set(records.map(r => r.store).filter(Boolean))),
    [records]
  );

  // Find IMEIs that are suspended
  const suspendedIMEIs = useMemo(() => {
    return Array.from(imeiNotesMap.values())
      .filter(n => n.suspended)
      .map(n => n.imei);
  }, [imeiNotesMap]);

  // Get all summaries and filter to suspended IMEIs
  const allSummaries = useMemo(() => getIMEISummaries(), [getIMEISummaries]);
  const suspendedSummaries = useMemo(
    () => allSummaries.filter(s => suspendedIMEIs.includes(s.imei)),
    [allSummaries, suspendedIMEIs]
  );

  // Filter by search, store, and date
  const filteredSummaries = useMemo(() => {
    let filtered = [...suspendedSummaries];

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.imei.toLowerCase().includes(lower) ||
        imeiNotesMap.get(s.imei)?.customerName?.toLowerCase().includes(lower) ||
        imeiNotesMap.get(s.imei)?.customerNumber?.toLowerCase().includes(lower) ||
        imeiNotesMap.get(s.imei)?.customerEmail?.toLowerCase().includes(lower)
      );
    }

    // Store filter
    if (storeFilter && storeFilter.trim()) {
      filtered = filtered.filter(s => s.store === storeFilter);
    }

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(s => {
        const activationDate = new Date(s.activationDate);
        return activationDate >= start && activationDate <= end;
      });
    }

    return filtered;
  }, [suspendedSummaries, searchTerm, storeFilter, startDate, endDate, imeiNotesMap]);

  const clearFilters = () => {
    setSearchTerm('');
    setStoreFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchTerm || storeFilter || startDate || endDate;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        {/* Filters Card */}
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  {filteredSummaries.length} of {suspendedSummaries.length}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="IMEI, customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Store
                </label>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Stores</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s} value={s!}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4">
                <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Suspended IMEIs</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredSummaries.length} suspended {filteredSummaries.length === 1 ? 'IMEI' : 'IMEIs'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Activation Date</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Customer Number</TableHead>
                    <TableHead>Customer Email</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {hasActiveFilters ? 'No matching suspended IMEIs found' : 'No suspended IMEIs found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummaries.map((summary) => {
                      const notes = imeiNotesMap.get(summary.imei);
                      return (
                        <TableRow key={summary.imei}>
                          <TableCell className="font-mono text-sm">{summary.imei}</TableCell>
                          <TableCell>{formatDate(summary.activationDate)}</TableCell>
                          <TableCell>{summary.store || '—'}</TableCell>
                          <TableCell>{notes?.customerName || '—'}</TableCell>
                          <TableCell>{notes?.customerNumber || '—'}</TableCell>
                          <TableCell className="max-w-xs truncate">{notes?.customerEmail || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={summary.netAmount >= 0 ? 'text-success' : 'text-destructive'}>
                              {formatCurrency(summary.netAmount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onIMEIClick(summary.imei)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
