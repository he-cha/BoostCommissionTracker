
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { MetricsCard } from '../components/features/MetricsCard';
import { IMEISummaryTable } from '../components/features/IMEISummaryTable';
import { AlertsPanel } from '../components/features/AlertsPanel';
import { CSVUpload } from '../components/features/CSVUpload';
import { FileManagement } from '../components/features/FileManagement';
import { FilterBar } from '../components/features/FilterBar';
import { AlertsPage } from './AlertsPage';
import { IMEIDetailPage } from './IMEIDetailPage';
import { EditPaymentPage } from './EditPaymentPage';
import { SuspendedIMEIPage } from './SuspendedIMEIPage';
import { DeactivatedIMEIPage } from './DeactivatedIMEIPage';
import { BlacklistPage } from './BlacklistPage';
import { BYODPage } from './BYODPage';
import { NotesPendingPage } from './NotesPendingPage';
import { useCommissionStore } from '../stores/commissionStore';
import { DollarSign, TrendingDown, TrendingUp, Smartphone, AlertTriangle, FileWarning } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';

type View = 'dashboard' | 'alerts' | 'imei-detail' | 'edit-payment' | 'suspended' | 'deactivated' | 'blacklist' | 'byod' | 'notes';



export function DashboardPage() {
  // ALL STATE AND HOOKS MUST BE AT THE TOP
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewHistory, setViewHistory] = useState<View[]>([]);
  const [selectedIMEI, setSelectedIMEI] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [filters, setFilters] = useState<any>({});
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');
  const [dashboardStore, setDashboardStore] = useState<string>(' ');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  // Filter states for each page view (preserved across navigation)
  const [alertsFilters, setAlertsFilters] = useState({
    filterType: '',
    filterSeverity: '',
    filterStore: '',
    searchIMEI: '',
    startDate: '',
    endDate: '',
  });
  const [suspendedFilters, setSuspendedFilters] = useState({
    searchTerm: '',
    storeFilter: '',
    startDate: '',
    endDate: '',
  });
  const [deactivatedFilters, setDeactivatedFilters] = useState({
    searchTerm: '',
    storeFilter: '',
    startDate: '',
    endDate: '',
  });
  const [blacklistFilters, setBlacklistFilters] = useState({
    searchTerm: '',
    storeFilter: '',
    startDate: '',
    endDate: '',
    statusFilter: '',
  });
  const [byodFilters, setByodFilters] = useState({
    searchTerm: '',
    storeFilter: '',
    saleTypeFilter: '',
    startDate: '',
    endDate: '',
  });

  // Store hooks
  const { records, getMetrics, getIMEISummaries, getAlerts, setRecords } = useCommissionStore();
  const imeiNotesMap = useCommissionStore((state) => state.imeiNotes);
  const imeiNotesArr = useMemo(() => Array.from(imeiNotesMap.values()), [imeiNotesMap]);
  const notesCount = imeiNotesArr.filter(n => n.notes && n.notes.trim() !== '').length;
  const suspendedCount = imeiNotesArr.filter(n => n.suspended).length;
  const deactivatedCount = imeiNotesArr.filter(n => n.deactivated).length;
  const blacklistCount = imeiNotesArr.filter(n => n.blacklisted).length;
  const byodCount = imeiNotesArr.filter(n => n.byodSwap).length;
  
  // Memoize stores
  const stores = useMemo(
    () => Array.from(new Set(records.map(r => r.store).filter(Boolean))),
    [records]
  );
  
  // Memoize metrics filters
  const metricsFilters = useMemo(() => {
    const filters: any = {};
    if (dashboardStartDate && dashboardEndDate) filters.dateRange = [dashboardStartDate, dashboardEndDate];
    if (dashboardStore && dashboardStore.trim()) filters.store = dashboardStore;
    if (categoryFilter) filters.category = categoryFilter;
    return filters;
  }, [dashboardStartDate, dashboardEndDate, dashboardStore, categoryFilter]);
  
  // Memoize metrics calculation
  const metrics = useMemo(() => getMetrics(metricsFilters), [metricsFilters, records, getMetrics]);
  
  // Memoize summary filters
  const summaryFilters = useMemo(() => {
    const sf: any = { ...filters };
    if (categoryFilter) sf.category = categoryFilter;
    return sf;
  }, [filters, categoryFilter]);
  
  // Memoize summaries calculation
  const allSummaries = useMemo(() => getIMEISummaries(summaryFilters), [summaryFilters, records, getIMEISummaries]);
  
  // Paginate summaries
  const paginatedSummaries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allSummaries.slice(startIndex, endIndex);
  }, [allSummaries, currentPage]);
  
  const totalPages = Math.ceil(allSummaries.length / ITEMS_PER_PAGE);
  
  // Memoize alerts
  const alerts = useMemo(() => getAlerts(), [records, getAlerts]);

  // Fetch all commission records from backend on mount
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/commissions`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch commission records');
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        // Optionally log or show error
        console.error('Error loading commission records:', err);
      }
    };
    fetchRecords();
  }, [setRecords]);

  // Navigation helpers
  const navigateTo = useCallback((view: View) => {
    setViewHistory(prev => [...prev, currentView]);
    setCurrentView(view);
  }, [currentView]);

  const goBack = useCallback(() => {
    if (viewHistory.length === 0) {
      setCurrentView('dashboard');
      return;
    }
    const lastView = viewHistory[viewHistory.length - 1];
    setViewHistory(prev => prev.slice(0, -1));
    setCurrentView(lastView);
  }, [viewHistory]);
  
  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // CONDITIONAL RENDERS - AFTER ALL HOOKS
  if (currentView === 'notes') {
    return <NotesPendingPage onBack={goBack} onIMEIClick={(imei) => {
      setSelectedIMEI(imei);
      navigateTo('imei-detail');
    }} />;
  }
  if (currentView === 'suspended') {
    return <SuspendedIMEIPage 
      onBack={goBack} 
      onIMEIClick={(imei) => {
        setSelectedIMEI(imei);
        navigateTo('imei-detail');
      }}
      filters={suspendedFilters}
      onFiltersChange={setSuspendedFilters}
    />;
  }
  if (currentView === 'deactivated') {
    return <DeactivatedIMEIPage 
      onBack={goBack} 
      onIMEIClick={(imei) => {
        setSelectedIMEI(imei);
        navigateTo('imei-detail');
      }}
      filters={deactivatedFilters}
      onFiltersChange={setDeactivatedFilters}
    />;
  }
  if (currentView === 'blacklist') {
    return <BlacklistPage 
      onBack={goBack} 
      onIMEIClick={(imei) => {
        setSelectedIMEI(imei);
        navigateTo('imei-detail');
      }}
      filters={blacklistFilters}
      onFiltersChange={setBlacklistFilters}
    />;
  }
  if (currentView === 'byod') {
    return <BYODPage 
      onBack={goBack} 
      onIMEIClick={(imei) => {
        setSelectedIMEI(imei);
        navigateTo('imei-detail');
      }}
      filters={byodFilters}
      onFiltersChange={setByodFilters}
    />;
  }

  if (currentView === 'alerts') {
    return <AlertsPage 
      onBack={goBack} 
      onIMEIClick={(imei) => {
        console.log('Navigating to IMEI detail:', imei);
        // Set both states in sequence - React 18 will batch them
        setSelectedIMEI(imei);
        setViewHistory(prev => [...prev, currentView]);
        setCurrentView('imei-detail');
      }}
      filters={alertsFilters}
      onFiltersChange={setAlertsFilters}
    />;
  }

  if (currentView === 'imei-detail') {
    // Safety check: if no IMEI is selected, go back to dashboard
    if (!selectedIMEI || selectedIMEI.trim() === '') {
      console.error('No IMEI selected for detail view');
      setCurrentView('dashboard');
      return null;
    }
    
    return (
      <IMEIDetailPage
        imei={selectedIMEI}
        onBack={goBack}
        onEdit={(recordId) => {
          setSelectedRecordId(recordId);
          navigateTo('edit-payment');
        }}
      />
    );
  }

  if (currentView === 'edit-payment') {
    return (
      <EditPaymentPage
        recordId={selectedRecordId}
        onBack={goBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Commission Dashboard</h2>
              <p className="text-muted-foreground">{metrics.currentPeriod}</p>
            </div>
            <div className="flex gap-3">
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={dashboardStartDate}
                  onChange={(e) => setDashboardStartDate(e.target.value)}
                  placeholder="Start date"
                />
              </div>
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={dashboardEndDate}
                  onChange={(e) => setDashboardEndDate(e.target.value)}
                  placeholder="End date"
                />
              </div>
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Store
                </label>
                <Select value={dashboardStore} onValueChange={setDashboardStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Stores</SelectItem>
                    {stores.map(s => (
                      <SelectItem key={s} value={s!}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="IMEIs with Notes"
            value={notesCount.toString()}
            icon={FileWarning}
            trend={notesCount > 0 ? 'neutral' : 'positive'}
            badge={notesCount}
            clickable
            onClick={() => navigateTo('notes')}
          />
          <MetricsCard
            title="Suspended IMEIs"
            value={suspendedCount.toString()}
            icon={Smartphone}
            trend={suspendedCount > 0 ? 'neutral' : 'positive'}
            badge={suspendedCount}
            clickable
            onClick={() => navigateTo('suspended')}
          />
          <MetricsCard
            title="Deactivated IMEIs"
            value={deactivatedCount.toString()}
            icon={FileWarning}
            trend={deactivatedCount > 0 ? 'negative' : 'neutral'}
            badge={deactivatedCount}
            clickable
            onClick={() => navigateTo('deactivated')}
          />
          <MetricsCard
            title="Blacklisted"
            value={blacklistCount.toString()}
            icon={AlertTriangle}
            trend={blacklistCount > 0 ? 'negative' : 'positive'}
            badge={blacklistCount}
            clickable
            onClick={() => navigateTo('blacklist')}
          />
          <MetricsCard
            title="BYOD Swaps"
            value={byodCount.toString()}
            icon={Smartphone}
            trend="neutral"
            badge={byodCount}
            clickable
            onClick={() => navigateTo('byod')}
          />
          <MetricsCard
            title="Total Earned"
            value={formatCurrency(metrics.totalEarned)}
            icon={TrendingUp}
            trend="positive"
            subtitle={metrics.currentPeriod}
            clickable
            onClick={() => setCategoryFilter(categoryFilter === 'earned' ? '' : 'earned')}
          />
          <MetricsCard
            title="Total Withheld"
            value={formatCurrency(metrics.totalWithheld)}
            icon={TrendingDown}
            trend="negative"
            badge={metrics.negativeCount}
            clickable
            onClick={() => setCategoryFilter(categoryFilter === 'withheld' ? '' : 'withheld')}
          />
          <MetricsCard
            title="Net Commission"
            value={formatCurrency(metrics.netCommission)}
            icon={DollarSign}
            trend={metrics.netCommission >= 0 ? 'positive' : 'negative'}
          />
          <MetricsCard
            title="Overdue Payments"
            value={metrics.overduePayments.toString()}
            icon={AlertTriangle}
            trend={metrics.overduePayments > 0 ? 'negative' : 'neutral'}
            badge={metrics.overduePayments}
            clickable
            onClick={() => setCategoryFilter(categoryFilter === 'overdue' ? '' : 'overdue')}
          />
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">IMEI Summary</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              Alerts
              {alerts.length > 0 && (
                <span className="bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <FilterBar onFilterChange={handleFilterChange} />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Activation Timeline Tracker</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track commission payments across 6-month activation lifecycles
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <IMEISummaryTable
                  summaries={paginatedSummaries}
                  totalRecords={allSummaries.length}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onIMEIClick={(imei) => {
                    setSelectedIMEI(imei);
                    setCurrentView('imei-detail');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertsPanel
              alerts={alerts}
              onAlertClick={(imei) => {
                setSelectedIMEI(imei);
                navigateTo('imei-detail');
              }}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <FileManagement />
            <CSVUpload />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
