import { useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useCommissionStore } from '../stores/commissionStore';
import { ArrowLeft } from 'lucide-react';

export function NotesPendingPage({ onBack }: { onBack: () => void }) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const [filter, setFilter] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);

  // Convert Map to array
  const imeiNotes = useMemo(() => Array.from(imeiNotesMap.values()), [imeiNotesMap]);

  // Filter by IMEI and pending notes
  const filtered = useMemo(() => {
    return imeiNotes.filter(n => {
      if (filter && !n.imei.includes(filter)) return false;
      if (pendingOnly && !n.notes) return false;
      return true;
    });
  }, [imeiNotes, filter, pendingOnly]);

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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={e => setPendingOnly(e.target.checked)}
            />
            Pending Notes Only
          </label>
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {n.notes ? (
                    <div className="text-xs text-muted-foreground">Notes: {n.notes}</div>
                  ) : (
                    <div className="text-xs text-destructive">Pending: No notes added</div>
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
