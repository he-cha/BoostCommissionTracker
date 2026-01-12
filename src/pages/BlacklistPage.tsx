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

interface BlacklistFilters {
  searchTerm: string;
  storeFilter: string;
  startDate: string;
  endDate: string;
  statusFilter: string;
}

interface BlacklistPageProps {
  onBack: () => void;
  onIMEIClick: (imei: string) => void;
  filters: BlacklistFilters;
  onFiltersChange: (filters: BlacklistFilters) => void;
}

export function BlacklistPage({ onBack, onIMEIClick, filters, onFiltersChange }: BlacklistPageProps) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const getIMEISummaries = useCommissionStore((state) => state.getIMEISummaries);
  const records = useCommissionStore((state) => state.records);
  
  const searchTerm = filters.searchTerm;
  const setSearchTerm = (value: string) => onFiltersChange({ ...filters, searchTerm: value });
  const storeFilter = filters.storeFilter;
  const setStoreFilter = (value: string) => onFiltersChange({ ...filters, storeFilter: value });
  const startDate = filters.startDate;
  const setStartDate = (value: string) => onFiltersChange({ ...filters, startDate: value });
  const endDate = filters.endDate;
  const setEndDate = (value: string) => onFiltersChange({ ...filters, endDate: value });
  const statusFilter = filters.statusFilter;
  const setStatusFilter = (value: string) => onFiltersChange({ ...filters, statusFilter: value });

  const stores = useMemo(
    () => Array.from(new Set(records.map(r => r.store).filter(Boolean))),
    [records]
  );

  // Find IMEIs that are blacklisted
  const blacklistedIMEIs = useMemo(() => {
    return Array.from(imeiNotesMap.values())
      .filter(n => n.blacklisted)
      .map(n => n.imei);
  }, [imeiNotesMap]);

  // Get all summaries and filter to blacklisted IMEIs
  const allSummaries = useMemo(() => getIMEISummaries(), [getIMEISummaries]);
  const blacklistedSummaries = useMemo(
    () => allSummaries.filter(s => blacklistedIMEIs.includes(s.imei)),
    [allSummaries, blacklistedIMEIs]
  );

  const filteredSummaries = useMemo(() => {
    let filtered = [...blacklistedSummaries];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.imei.toLowerCase().includes(lower) ||
        imeiNotesMap.get(s.imei)?.customerName?.toLowerCase().includes(lower) ||
        imeiNotesMap.get(s.imei)?.customerNumber?.toLowerCase().includes(lower) ||
        imeiNotesMap.get(s.imei)?.customerEmail?.toLowerCase().includes(lower)
      );
    }

    if (storeFilter && storeFilter.trim()) {
      filtered = filtered.filter(s => s.store === storeFilter);
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(s => {
        const activationDate = new Date(s.activationDate);
        return activationDate >= start && activationDate <= end;
      });
    }

    if (statusFilter) {
      if (statusFilter === 'suspended') {
        filtered = filtered.filter(s => imeiNotesMap.get(s.imei)?.suspended);
      } else if (statusFilter === 'deactivated') {
        filtered = filtered.filter(s => imeiNotesMap.get(s.imei)?.deactivated);
      } else if (statusFilter === 'blacklist-only') {
        filtered = filtered.filter(s => {
          const notes = imeiNotesMap.get(s.imei);
          return notes && !notes.suspended && !notes.deactivated;
        });
      }
    }

    return filtered;
  }, [blacklistedSummaries, searchTerm, storeFilter, startDate, endDate, statusFilter, imeiNotesMap]);

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      storeFilter: '',
      startDate: '',
      endDate: '',
      statusFilter: '',
    });
  };

  const hasActiveFilters = searchTerm || storeFilter || startDate || endDate || statusFilter;

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
                  {filteredSummaries.length} of {blacklistedSummaries.length}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="IMEI, customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
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
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Additional Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All</SelectItem>
                    <SelectItem value="blacklist-only">Blacklist Only</SelectItem>
                    <SelectItem value="suspended">Also Suspended</SelectItem>
                    <SelectItem value="deactivated">Also Deactivated</SelectItem>
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
              Blacklisted Customers
              <Badge variant="destructive">{filteredSummaries.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customers who are blacklisted from service
            </p>
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {hasActiveFilters ? 'No matching blacklisted customers found' : 'No blacklisted customers found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummaries.map((summary) => {
                      const notes = imeiNotesMap.get(summary.imei);
                      return (
                        <TableRow key={summary.imei} className="bg-destructive/5">
                          <TableCell className="font-mono text-sm">{summary.imei}</TableCell>
                          <TableCell>{formatDate(summary.activationDate)}</TableCell>
                          <TableCell>{summary.store || '—'}</TableCell>
                          <TableCell className="font-medium">{notes?.customerName || '—'}</TableCell>
                          <TableCell>{notes?.customerNumber || '—'}</TableCell>
                          <TableCell className="max-w-xs truncate">{notes?.customerEmail || '—'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="destructive" className="text-xs">Blacklisted</Badge>
                              {notes?.suspended && <Badge variant="outline" className="text-xs">Suspended</Badge>}
                              {notes?.deactivated && <Badge variant="outline" className="text-xs">Deactivated</Badge>}
                            </div>
                          </TableCell>
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
