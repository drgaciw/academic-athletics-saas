import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, type BadgeVariant } from '@aah/ui';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export type EligibilityStatus = 'eligible' | 'at-risk' | 'ineligible' | 'pending-review';

export interface EligibilityStatusCardProps {
  status: EligibilityStatus;
  nextCheckDate?: Date;
  message?: string;
}

const statusConfig: Record<
  EligibilityStatus,
  {
    label: string;
    variant: BadgeVariant;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  eligible: {
    label: 'Eligible',
    variant: 'eligible',
    icon: CheckCircle2,
    description: 'You meet all NCAA eligibility requirements',
  },
  'at-risk': {
    label: 'At Risk',
    variant: 'at-risk',
    icon: AlertCircle,
    description: 'Action needed to maintain eligibility',
  },
  ineligible: {
    label: 'Ineligible',
    variant: 'ineligible',
    icon: XCircle,
    description: 'Currently not meeting eligibility requirements',
  },
  'pending-review': {
    label: 'Pending Review',
    variant: 'pending-review',
    icon: Clock,
    description: 'Your eligibility status is under review',
  },
};

export function EligibilityStatusCard({
  status,
  nextCheckDate,
  message,
}: EligibilityStatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eligibility Status</CardTitle>
        <CardDescription>NCAA compliance status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8" />
          <div className="flex-1">
            <Badge variant={config.variant} className="mb-1">
              {config.label}
            </Badge>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        {message && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {nextCheckDate && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Next compliance check</p>
            <p className="text-sm font-medium">{format(nextCheckDate, 'MMMM d, yyyy')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}