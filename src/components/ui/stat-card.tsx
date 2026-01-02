import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorClass?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  trendValue,
  colorClass = 'text-primary',
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "stat-card group cursor-default animate-fade-in",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={cn("text-2xl font-bold mono", colorClass)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              trend === 'up' ? 'text-income' : trend === 'down' ? 'text-expense' : 'text-muted-foreground'
            )}>
              <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg bg-muted/50 transition-transform group-hover:scale-110",
            colorClass
          )}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
