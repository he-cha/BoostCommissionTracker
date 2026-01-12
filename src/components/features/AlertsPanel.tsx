
import { useState, useMemo } from 'react';
import { Alert } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { AlertTriangle, AlertCircle, XCircle, DollarSign, Filter, X, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCommissionStore } from '../../stores/commissionStore';

interface AlertsPageFilters {
  filterType: string;
  filterSeverity: string;
  filterStore: string;
  searchIMEI: string;
  startDate: string;
  endDate: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertClick?: (imei: string) => void;
  filters?: AlertsPageFilters;
  onFiltersChange?: (filters: AlertsPageFilters) => void;
}

export function AlertsPanel({ alerts, onAlertClick, filters: externalFilters, onFiltersChange }: AlertsPanelProps) {
  const records = useCommissionStore((state) => state.records);
  
  // Use external filters if provided, otherwise use local state
  const [internalFilters, setInternalFilters] = useState({
    filterType: '',
    filterSeverity: '',
    filterStore: '',
    searchIMEI: '',
    startDate: '',
    endDate: '',
  });
  
  const activeFilters = externalFilters || internalFilters;
  const updateFilters = onFiltersChange || setInternalFilters;
  
  const filterType = activeFilters.filterType;
  const setFilterType = (value: string) => updateFilters({ ...activeFilters, filterType: value });
  const filterSeverity = activeFilters.filterSeverity;
  const setFilterSeverity = (value: string) => updateFilters({ ...activeFilters, filterSeverity: value });
  const filterStore = activeFilters.filterStore;
  const setFilterStore = (value: string) => updateFilters({ ...activeFilters, filterStore: value });
  const searchIMEI = activeFilters.searchIMEI;
  const setSearchIMEI = (value: string) => updateFilters({ ...activeFilters, searchIMEI: value });
  const startDate = activeFilters.startDate;
  const setStartDate = (value: string) => updateFilters({ ...activeFilters, startDate: value });
  const endDate = activeFilters.endDate;
  const setEndDate = (value: string) => updateFilters({ ...activeFilters, endDate: value });

  const stores = Array.from(new Set(records.map(r => r.store).filter(Boolean)));

  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    if (filterType && filterType.trim()) {
      filtered = filtered.filter(a => a.type === filterType);
    }

    if (filterSeverity && filterSeverity.trim()) {
      filtered = filtered.filter(a => a.severity === filterSeverity);
    }

    if (filterStore && filterStore.trim()) {
      const storeIMEIs = new Set(
        records.filter(r => r.store === filterStore).map(r => r.imei)
      );
      filtered = filtered.filter(a => storeIMEIs.has(a.imei));
    }

    if (searchIMEI && searchIMEI.trim()) {
      filtered = filtered.filter(a => 
        a.imei.toLowerCase().includes(searchIMEI.toLowerCase())
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(a => {
        const activationDate = new Date(a.activationDate);
        return activationDate >= new Date(startDate) && activationDate <= new Date(endDate);
      });
    }

    return filtered;
  }, [alerts, filterType, filterSeverity, filterStore, searchIMEI, startDate, endDate, records]);

  const clearFilters = () => {
    updateFilters({
      filterType: '',
      filterSeverity: '',
      filterStore: '',
      searchIMEI: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = filterType || filterSeverity || filterStore || searchIMEI || startDate || endDate;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sequence_gap':
      case 'missing_month':
        return <XCircle className="h-5 w-5" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5" />;
      case 'negative':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-destructive bg-destructive/5 text-destructive';
      case 'medium':
        return 'border-warning bg-warning/5 text-warning';
      case 'low':
        return 'border-muted-foreground bg-muted text-muted-foreground';
      default:
        return 'border-border bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card className="border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Alert Filters</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs ml-auto">
                {filteredAlerts.length} of {alerts.length}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Alert Type
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Types</SelectItem>
                  <SelectItem value="overdue">Overdue Payments</SelectItem>
                  <SelectItem value="sequence_gap">Missing Months</SelectItem>
                  <SelectItem value="negative">Withholdings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Severity
              </label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Store
              </label>
              <Select value={filterStore} onValueChange={setFilterStore}>
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
                Search IMEI
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search IMEI..."
                  value={searchIMEI}
                  onChange={(e) => setSearchIMEI(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Activation Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Activation End Date
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

      {/* Alerts List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Alerts</h3>
        <Badge variant="destructive" className="text-sm">
          {filteredAlerts.length} Alert{filteredAlerts.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card className="border-success/30">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {hasActiveFilters ? 'No Matching Alerts' : 'All Clear!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? 'No alerts match your current filter criteria.' 
                  : 'No payment issues detected. All commissions are on track.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={cn(
                'border-l-4 transition-all',
                getSeverityColor(alert.severity)
              )}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5', getSeverityColor(alert.severity))}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div 
                    className={cn(
                      'flex-1 min-w-0',
                      onAlertClick && 'cursor-pointer hover:opacity-80'
                    )}
                    onClick={() => onAlertClick?.(alert.imei)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{alert.message}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{alert.imei}</span>
                      <span>Activated: {formatDate(alert.activationDate)}</span>
                      {alert.expectedDate && (
                        <span>Expected: {formatDate(alert.expectedDate)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
