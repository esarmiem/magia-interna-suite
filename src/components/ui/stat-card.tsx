import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  className?: string;
  style?: CSSProperties;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  className,
  style 
}: StatCardProps) {
  return (
    <Card 
      className={cn("p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300", className)}
      style={style}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                changeType === 'positive' && "text-magia-success bg-magia-success/10",
                changeType === 'negative' && "text-red-500 bg-red-500/10",
                changeType === 'neutral' && "text-muted-foreground bg-muted"
              )}>
                {change}
              </span>
            )}
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300" />
    </Card>
  );
}
