import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { cn } from '../utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="h-4 w-4 text-error" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-success';
    if (trend.value < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <div className={cn('flex items-center gap-1', getTrendColor())}>
                {getTrendIcon()}
                <span className="font-medium">
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
                {trend.label && <span>{trend.label}</span>}
              </div>
            )}
            {description && !trend && <p>{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}