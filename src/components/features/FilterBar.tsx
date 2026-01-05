import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calendar, X, Filter } from 'lucide-react';
import { useCommissionStore } from '../../stores/commissionStore';

interface FilterBarProps {
  onFilterChange: (filters: {
    dateRange?: [string, string];
    store?: string;
    saleType?: string;
  }) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const records = useCommissionStore((state) => state.records);
  const [store, setStore] = useState<string>('');
  const [saleType, setSaleType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const stores = Array.from(new Set(records.map(r => r.store).filter(Boolean)));
  const saleTypes = Array.from(new Set(records.map(r => r.saleType)));

  const applyFilters = () => {
    const filters: any = {};
    if (store) filters.store = store;
    if (saleType) filters.saleType = saleType;
    if (startDate && endDate) filters.dateRange = [startDate, endDate];
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setStore('');
    setSaleType('');
    setStartDate('');
    setEndDate('');
    onFilterChange({});
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Filters</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Store
          </label>
          <Select value={store} onValueChange={setStore}>
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
            Sale Type
          </label>
          <Select value={saleType} onValueChange={setSaleType}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Types</SelectItem>
              {saleTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters} size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Apply Filters
        </Button>
        <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2">
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
