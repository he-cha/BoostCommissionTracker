import { useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { useCommissionStore } from '../stores/commissionStore';
import { ArrowLeft } from 'lucide-react';
import { IMEIStatusTable } from '../components/features/IMEIStatusTable';

export function SuspendedDeactivatedPage({ onBack }: { onBack: () => void }) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const imeiNotes = useMemo(() => Array.from(imeiNotesMap.values()), [imeiNotesMap]);
  // Only IMEIs with suspended or deactivated status
  const statusList = imeiNotes.filter(n => n.suspended || n.deactivated);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <IMEIStatusTable notesList={statusList} type="status" />
      </main>
    </div>
  );
}
