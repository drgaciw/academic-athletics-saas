import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, type BadgeVariant } from '@aah/ui';
import { AlertTriangle, AlertCircle, Info, DollarSign, Bell } from 'lucide-react';
import { format } from 'date-fns';

export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertType = 'ACADEMIC' | 'ELIGIBILITY' | 'ATTENDANCE' | 'FINANCIAL' | 'GENERAL';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  createdAt: Date;
}

export interface AlertsWidgetProps {
  alerts: Alert[];
}

const priorityConfig: Record<
  AlertPriority,
  { variant: BadgeVariant; icon: React.ComponentType<{ className?: string }> }
> = {
  CRITICAL: { variant: 'ineligible', icon: AlertTriangle },
  HIGH: { variant: 'at-risk', icon: AlertCircle },
  MEDIUM: { variant: 'pending-review', icon: Info },
  LOW: { variant: 'eligible', icon: Info },
};

const typeConfig: Record<AlertType, { label: string; color: string }> = {
  ACADEMIC: { label: 'Academic', color: 'text-blue-700' },
  ELIGIBILITY: { label: 'Eligibility', color: 'text-red-700' },
  ATTENDANCE: { label: 'Attendance', color: 'text-orange-700' },
  FINANCIAL: { label: 'Financial', color: 'text-green-700' },
  GENERAL: { label: 'General', color: 'text-gray-700' },
};

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  // Sort by priority and date
  const sortedAlerts = [...alerts]
    .sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 5); // Limit to 5 alerts

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>
              {alerts.length === 0
                ? 'No active alerts'
                : `${alerts.length} active alert${alerts.length > 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
              <Info className="h-6 w-6 text-green-700" />
            </div>
            <p className="text-sm font-medium">All clear!</p>
            <p className="text-xs text-muted-foreground mt-1">
              You have no active alerts at this time
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert) => {
              const priorityCfg = priorityConfig[alert.priority];
              const typeCfg = typeConfig[alert.type];
              const PriorityIcon = priorityCfg.icon;

              return (
                <div
                  key={alert.id}
                  className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <PriorityIcon className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-tight">{alert.title}</h4>
                      <Badge variant={priorityCfg.variant} className="flex-shrink-0">
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={typeCfg.color}>{typeCfg.label}</span>
                      <span>•</span>
                      <span>{format(alert.createdAt, 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {alerts.length > 5 && (
          <div className="mt-3 pt-3 border-t text-center">
            <button className="text-sm text-primary hover:underline">
              View all {alerts.length} alerts
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
