import { useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useCommissionStore } from '../stores/commissionStore';
import { ArrowLeft } from 'lucide-react';

export function SuspendedDeactivatedPage({ onBack }: { onBack: () => void }) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'suspended' | 'deactivated'>('all');

  // Convert Map to array
  const imeiNotes = useMemo(() => Array.from(imeiNotesMap.values()), [imeiNotesMap]);

  // Filter by status and IMEI
  const filtered = useMemo(() => {
    return imeiNotes.filter(n => {
      if (filter && !n.imei.includes(filter)) return false;
      if (statusFilter === 'suspended' && !n.suspended) return false;
      if (statusFilter === 'deactivated' && !n.deactivated) return false;
      if (statusFilter === 'all' && !n.suspended && !n.deactivated) return false;
      return true;
    });
  }, [imeiNotes, filter, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-4 mb-6">
          <Input
            type="text"
            placeholder="Filter by IMEI..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-64"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No IMEIs found for selected filter.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(n => (
              <Card key={n.imei} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {n.imei}
                    {n.suspended && <Badge variant="outline" className="bg-white text-black border">Suspended</Badge>}
                    {n.deactivated && <Badge variant="outline" className="bg-red-500 text-white border">Deactivated</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {n.suspended && n.suspendedInfo && (
                    <div className="text-xs text-muted-foreground">Suspended Info: {n.suspendedInfo}</div>
                  )}
                  {n.deactivated && n.deactivatedInfo && (
                    <div className="text-xs text-destructive">Deactivated Info: {n.deactivatedInfo}</div>
                  )}
                  {n.notes && (
                    <div className="text-xs text-muted-foreground">Notes: {n.notes}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
