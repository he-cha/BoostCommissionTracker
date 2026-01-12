import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Search, Filter, X } from 'lucide-react';
import { useCommissionStore } from '../stores/commissionStore';
import { formatCurrency, formatDate } from '../lib/utils';

interface BYODFilters {
  searchTerm: string;
  storeFilter: string;
  saleTypeFilter: string;
  startDate: string;
  endDate: string;
}

interface BYODPageProps {
  onBack: () => void;
  onIMEIClick: (imei: string) => void;
  filters: BYODFilters;
  onFiltersChange: (filters: BYODFilters) => void;
}

export function BYODPage({ onBack, onIMEIClick, filters, onFiltersChange }: BYODPageProps) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const getIMEISummaries = useCommissionStore((state) => state.getIMEISummaries);
  const records = useCommissionStore((state) => state.records);
  
  const searchTerm = filters.searchTerm;
  const setSearchTerm = (value: string) => onFiltersChange({ ...filters, searchTerm: value });
  const storeFilter = filters.storeFilter;
  const setStoreFilter = (value: string) => onFiltersChange({ ...filters, storeFilter: value });
  const saleTypeFilter = filters.saleTypeFilter;
  const setSaleTypeFilter = (value: string) => onFiltersChange({ ...filters, saleTypeFilter: value });
  const startDate = filters.startDate;
  const setStartDate = (value: string) => onFiltersChange({ ...filters, startDate: value });
  const endDate = filters.endDate;
  const setEndDate = (value: string) => onFiltersChange({ ...filters, endDate: value });

  const stores = useMemo(
    () => Array.from(new Set(records.map(r => r.store).filter(Boolean))),
    [records]
  );
  const saleTypes = useMemo(
    () => Array.from(new Set(records.map(r => r.saleType).filter(Boolean))),
    [records]
  );

  // Find IMEIs that are BYOD swaps
  const byodIMEIs = useMemo(() => {
    return Array.from(imeiNotesMap.values())
      .filter(n => n.byodSwap)
      .map(n => n.imei);
  }, [imeiNotesMap]);

  // Get all summaries and filter to BYOD IMEIs
  const allSummaries = useMemo(() => getIMEISummaries(), [getIMEISummaries]);
  const byodSummaries = useMemo(
    () => allSummaries.filter(s => byodIMEIs.includes(s.imei)),
    [allSummaries, byodIMEIs]
  );

  const filteredSummaries = useMemo(() => {
    let filtered = [...byodSummaries];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.imei.toLowerCase().includes(lower));
    }

    if (storeFilter && storeFilter.trim()) {
      filtered = filtered.filter(s => s.store === storeFilter);
    }

    if (saleTypeFilter && saleTypeFilter.trim()) {
      filtered = filtered.filter(s => s.saleType === saleTypeFilter);
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(s => {
        const activationDate = new Date(s.activationDate);
        return activationDate >= start && activationDate <= end;
      });
    }

    return filtered;
  }, [byodSummaries, searchTerm, storeFilter, saleTypeFilter, startDate, endDate]);

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      storeFilter: '',
      saleTypeFilter: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = searchTerm || storeFilter || saleTypeFilter || startDate || endDate;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  {filteredSummaries.length} of {byodSummaries.length}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Search IMEI</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="IMEI..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Store</label>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger><SelectValue placeholder="All Stores" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Stores</SelectItem>
                    {stores.map((s) => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Sale Type</label>
                <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Types</SelectItem>
                    {saleTypes.map((t) => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4">
                <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2">
                  <X className="h-4 w-4" />Clear Filters</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              BYOD Swaps
              <Badge variant="outline">{filteredSummaries.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              IMEIs marked as Bring Your Own Device swaps
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Activation Date</TableHead>
                    <TableHead>Sale Type</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {hasActiveFilters ? 'No matching BYOD swaps found' : 'No BYOD swaps found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummaries.map((summary) => {
                      return (
                        <TableRow key={summary.imei}>
                          <TableCell className="font-mono text-sm">{summary.imei}</TableCell>
                          <TableCell>{formatDate(summary.activationDate)}</TableCell>
                          <TableCell><Badge variant="outline">{summary.saleType}</Badge></TableCell>
                          <TableCell>{summary.store || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={summary.netAmount >= 0 ? 'text-success' : 'text-destructive'}>
                              {formatCurrency(summary.netAmount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => onIMEIClick(summary.imei)}>
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
