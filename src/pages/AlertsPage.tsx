
import { Header } from '../components/layout/Header';
import { AlertsPanel } from '../components/features/AlertsPanel';
import { useCommissionStore } from '../stores/commissionStore';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AlertsPageProps {
  onBack: () => void;
}

export function AlertsPage({ onBack }: AlertsPageProps) {
  const alerts = useCommissionStore((state) => state.getAlerts());

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Commission Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Track missing payments, overdue commissions, and payment issues
          </p>
        </div>

        <AlertsPanel alerts={alerts} />
      </main>
    </div>
  );
}
