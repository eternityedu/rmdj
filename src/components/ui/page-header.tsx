import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon,
  iconColor = 'text-primary',
  action,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6",
      className
    )}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn(
            "p-2.5 rounded-xl bg-muted/50 border border-border/50",
            iconColor
          )}>
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
