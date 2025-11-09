import { StatCard } from '@aah/ui';
import { Users, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of student-athlete academic performance and compliance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={247}
          description="Active student-athletes"
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 5.2, label: 'from last month' }}
        />
        <StatCard
          title="Active Alerts"
          value={12}
          description="Requiring attention"
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={{ value: -15.3, label: 'from last week' }}
        />
        <StatCard
          title="Eligibility Rate"
          value="94.3%"
          description="NCAA compliant"
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{ value: 2.1, label: 'from last semester' }}
        />
        <StatCard
          title="Active Interventions"
          value={34}
          description="Support sessions"
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: 8.7, label: 'from last month' }}
        />
      </div>

      {/* Additional Dashboard Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">
            Activity feed will be displayed here
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">
            Quick action buttons will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}