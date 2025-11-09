import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-success/10 text-success hover:bg-success/20',
        warning: 'border-transparent bg-warning/10 text-warning hover:bg-warning/20',
        error: 'border-transparent bg-error/10 text-error hover:bg-error/20',
        info: 'border-transparent bg-info/10 text-info hover:bg-info/20',
        // NCAA Status variants
        eligible: 'border-transparent bg-status-eligible/10 text-status-eligible hover:bg-status-eligible/20',
        'at-risk': 'border-transparent bg-status-at-risk/10 text-status-at-risk hover:bg-status-at-risk/20',
        ineligible: 'border-transparent bg-status-ineligible/10 text-status-ineligible hover:bg-status-ineligible/20',
        'pending-review': 'border-transparent bg-status-pending-review/10 text-status-pending-review hover:bg-status-pending-review/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export type BadgeVariant = NonNullable<BadgeProps['variant']>;
