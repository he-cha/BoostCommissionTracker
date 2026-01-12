
import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { IMEISummaryTable } from '../components/features/IMEISummaryTable';
import { useCommissionStore } from '../stores/commissionStore';

const ITEMS_PER_PAGE = 25;

export function NotesPendingPage({ onBack }: { onBack: () => void }) {
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const getIMEISummaries = useCommissionStore((state) => state.getIMEISummaries);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIMEI, setSelectedIMEI] = useState<string | null>(null);

  // Find IMEIs with notes saved (not empty)
  const notesIMEIs = useMemo(() => {
    return Array.from(imeiNotesMap.values())
      .filter(n => n.notes && n.notes.trim() !== '')
      .map(n => n.imei);
  }, [imeiNotesMap]);

  // Get all summaries and filter to those IMEIs
  const allSummaries = useMemo(() => getIMEISummaries(), [getIMEISummaries]);
  const filteredSummaries = useMemo(
    () => allSummaries.filter(s => notesIMEIs.includes(s.imei)),
    [allSummaries, notesIMEIs]
  );

  // Pagination
  const paginatedSummaries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSummaries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSummaries, currentPage]);
  const totalPages = Math.ceil(filteredSummaries.length / ITEMS_PER_PAGE) || 1;

  // Navigation to IMEI detail
  if (selectedIMEI) {
    // Lazy-load IMEIDetailPage to avoid circular import
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
        <h2 className="text-2xl font-bold mb-4">IMEIs with Notes</h2>
        <IMEISummaryTable
          summaries={paginatedSummaries}
          totalRecords={filteredSummaries.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onIMEIClick={setSelectedIMEI}
        />
      </main>
    </div>
  );
}
