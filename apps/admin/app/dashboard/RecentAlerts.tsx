'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button } from '@aah/ui';
import { AlertTriangleIcon, XCircleIcon, BellIcon } from 'lucide-react';
import Link from 'next/link';

const severityIcons = {
  LOW: <BellIcon className="h-6 w-6 text-blue-500" />,
  MEDIUM: <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />,
  HIGH: <XCircleIcon className="h-6 w-6 text-orange-500" />,
  CRITICAL: <XCircleIcon className="h-6 w-6 text-red-500" />,
};

export const RecentAlerts = ({ alerts }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Active Alerts</CardTitle>
        <Button asChild variant="outline">
          <Link href="/alerts">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-start space-x-4">
              {severityIcons[alert.severity] || <BellIcon className="h-6 w-6" />}
              <div className="flex-1">
                <p className="font-semibold">{alert.alertType}</p>
                <p className="text-sm text-gray-500">{alert.studentName}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
