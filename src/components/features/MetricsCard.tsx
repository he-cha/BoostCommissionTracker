import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
  badge?: number;
  clickable?: boolean;
}

export function MetricsCard({ title, value, icon: Icon, trend = 'neutral', subtitle, onClick, badge, clickable = false }: MetricsCardProps) {
  const trendColors = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const CardWrapper = onClick ? 'button' : 'div';
  const cardProps = onClick ? { onClick, className: 'w-full text-left' } : {};

  return (
    <CardWrapper {...cardProps}>
    <Card className={cn(
      'border-border/50 transition-all relative',
      (onClick || clickable) && 'hover:border-primary/50 hover:shadow-md cursor-pointer'
    )}>      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold z-10">
          {badge}
        </div>
      )}
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className={cn('text-3xl font-bold tracking-tight', trendColors[trend])}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            trend === 'positive' && 'bg-success/10',
            trend === 'negative' && 'bg-destructive/10',
            trend === 'neutral' && 'bg-muted'
          )}>
            <Icon className={cn('h-6 w-6', trendColors[trend])} />
          </div>
        </div>
      </CardContent>
    </Card>
    </CardWrapper>
  );
}
