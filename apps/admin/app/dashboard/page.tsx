import { auth } from '@clerk/nextjs';
import { prisma } from '@aah/database';
import { Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { redirect } from 'next/navigation';
import { EligibilityChart } from './EligibilityChart';
import { RecentAlerts } from './RecentAlerts';

async function getAdminAnalytics() {
  const now = new Date();
  const oneMonthAgo = new Date(new Date().setMonth(now.getMonth() - 1));

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const [
    totalStudents,
    prevTotalStudents,
    activeAlerts,
    prevActiveAlerts,
    eligibleStudents,
    prevEligibleStudents,
    activeInterventions,
    prevActiveInterventions,
    recentAlertsRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', createdAt: { lt: oneMonthAgo } } }),
    prisma.alert.count({ where: { status: 'ACTIVE' } }),
    prisma.alert.count({ where: { status: 'ACTIVE', createdAt: { lt: oneMonthAgo } } }),
    prisma.complianceRecord.count({ where: { isEligible: true } }),
    prisma.complianceRecord.count({ where: { isEligible: true, createdAt: { lt: oneMonthAgo } } }),
    prisma.interventionPlan.count({ where: { status: 'ACTIVE' } }),
    prisma.interventionPlan.count({ where: { status: 'ACTIVE', createdAt: { lt: oneMonthAgo } } }),
    prisma.alert.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    }),
  ]);

  const totalStudentsChange = calculatePercentageChange(totalStudents, prevTotalStudents);
  const activeAlertsChange = calculatePercentageChange(activeAlerts, prevActiveAlerts);
  const activeInterventionsChange = calculatePercentageChange(activeInterventions, prevActiveInterventions);

  const eligibilityRate = totalStudents > 0 ? (eligibleStudents / totalStudents) * 100 : 0;
  const prevEligibilityRate = prevTotalStudents > 0 ? (prevEligibleStudents / prevTotalStudents) * 100 : 0;
  const eligibilityRateChange = eligibilityRate - prevEligibilityRate;

  // Eligibility History (Database-level aggregation)
  const eligibilityHistoryRaw: { month: string; Eligibility: number }[] = await prisma.$queryRaw`
    SELECT
      to_char(date_trunc('month', "createdAt"), 'Mon') AS month,
      ROUND(
        (COUNT(CASE WHEN "isEligible" = true THEN 1 END)::decimal / COUNT(*)::decimal) * 100
      ) AS "Eligibility"
    FROM "ComplianceRecord"
    WHERE "createdAt" >= date_trunc('month', NOW() - interval '11 months')
    GROUP BY 1
    ORDER BY date_trunc('month', "createdAt")
  `;

    const eligibilityHistoryMap = new Map(eligibilityHistoryRaw.map(item => [item.month, item.Eligibility]));
    const eligibilityHistory = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        eligibilityHistory.push({
            name: monthName,
            Eligibility: Number(eligibilityHistoryMap.get(monthName)) || 0,
        });
    }

  const recentAlerts = recentAlertsRaw.map(alert => ({
    id: alert.id,
    studentName: `${alert.student.user.firstName} ${alert.student.user.lastName}`,
    alertType: alert.alertType,
    severity: alert.severity,
  }));


  return {
    totalStudents: {
      value: totalStudents,
      change: totalStudentsChange.toFixed(1),
    },
    activeAlerts: {
      value: activeAlerts,
      change: activeAlertsChange.toFixed(1),
    },
    eligibilityRate: {
      value: eligibilityRate.toFixed(1),
      change: eligibilityRateChange.toFixed(1),
    },
    activeInterventions: {
        value: activeInterventions,
        change: activeInterventionsChange.toFixed(1),
    },
    eligibilityHistory,
    recentAlerts,
  };
}

const StatCard = ({ title, value, change, isPercentage = false }) => {
  const changeValue = parseFloat(change);
  const isPositive = changeValue >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {isPercentage && '%'}
        </div>
        <p className={`text-xs ${changeColor}`}>
          {isPositive ? '+' : ''}
          {change}%
        </p>
      </CardContent>
    </Card>
  );
};

export default async function AdminDashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const analytics = await getAdminAnalytics();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={analytics.totalStudents.value}
          change={analytics.totalStudents.change}
        />
        <StatCard
          title="Active Alerts"
          value={analytics.activeAlerts.value}
          change={analytics.activeAlerts.change}
        />
        <StatCard
          title="Overall Eligibility"
          value={analytics.eligibilityRate.value}
          change={analytics.eligibilityRate.change}
          isPercentage
        />
        <StatCard
          title="Active Interventions"
          value={analytics.activeInterventions.value}
          change={analytics.activeInterventions.change}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <EligibilityChart data={analytics.eligibilityHistory} />
        </div>
        <div className="lg:col-span-3">
            <RecentAlerts alerts={analytics.recentAlerts} />
        </div>
      </div>
    </div>
  );
}
