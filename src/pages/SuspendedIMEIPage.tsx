import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { ArrowLeft, Search } from 'lucide-react';
import { useCommissionStore } from '../stores/commissionStore';
import { formatCurrency, formatDate } from '../lib/utils';

export function SuspendedIMEIPage({ onBack }: { onBack: () => void }) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const getIMEISummaries = useCommissionStore((state) => state.getIMEISummaries);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIMEI, setSelectedIMEI] = useState<string | null>(null);

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

  // Filter by search
  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return suspendedSummaries;
    const lower = searchTerm.toLowerCase();
    return suspendedSummaries.filter(s => 
      s.imei.toLowerCase().includes(lower) ||
      imeiNotesMap.get(s.imei)?.customerName?.toLowerCase().includes(lower) ||
      imeiNotesMap.get(s.imei)?.customerNumber?.toLowerCase().includes(lower)
    );
  }, [suspendedSummaries, searchTerm, imeiNotesMap]);

  // Navigation to IMEI detail
  if (selectedIMEI) {
    const IMEIDetailPage = require('./IMEIDetailPage').IMEIDetailPage;
    return <IMEIDetailPage imei={selectedIMEI} onBack={() => setSelectedIMEI(null)} onEdit={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Suspended IMEIs</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredSummaries.length} suspended {filteredSummaries.length === 1 ? 'IMEI' : 'IMEIs'}
                </p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IMEI, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No suspended IMEIs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummaries.map((summary) => {
                      const notes = imeiNotesMap.get(summary.imei);
                      return (
                        <TableRow key={summary.imei}>
                          <TableCell className="font-mono text-sm">{summary.imei}</TableCell>
                          <TableCell>{formatDate(summary.activationDate)}</TableCell>
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
                              onClick={() => setSelectedIMEI(summary.imei)}
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
