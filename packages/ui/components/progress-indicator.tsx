import { cn } from '../utils/cn';

export interface ProgressIndicatorProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function ProgressIndicator({
  value,
  max = 100,
  variant = 'linear',
  size = 'md',
  showLabel = false,
  className,
  color = 'primary',
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorClasses = {
    primary: 'bg-brand-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  const sizeClasses = {
    linear: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
    circular: {
      sm: 'h-12 w-12',
      md: 'h-16 w-16',
      lg: 'h-24 w-24',
    },
  };

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 6;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg
          className={cn(sizeClasses.circular[size], 'transform -rotate-90')}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(colorClasses[color])}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-sm font-semibold">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses.linear[size])}>
        <div
          className={cn('h-full transition-all duration-300 ease-in-out', colorClasses[color])}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground mt-1">
          {value} / {max} ({Math.round(percentage)}%)
        </p>
      )}
    </div>
  );
}