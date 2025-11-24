import { auth } from "@clerk/nextjs";
import { prisma } from "@aah/database";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@aah/ui";
import { redirect } from "next/navigation";

async function getAdminAnalytics() {
  // Get total students
  const totalStudents = await prisma.user.count({
    where: { role: "STUDENT" },
  });

  // Get eligible students
  const eligibleStudents = await prisma.complianceRecord.count({
    where: {
      isEligible: true,
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
  });

  // Get at-risk students (GPA < 2.5)
  const atRiskStudents = await prisma.complianceRecord.count({
    where: {
      cumulativeGpa: {
        lt: 2.5,
      },
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
  });

  // Get upcoming sessions
  const upcomingSessions = await prisma.session.count({
    where: {
      status: "scheduled",
      scheduledAt: {
        gte: new Date(),
      },
    },
  });

  // Calculate eligibility rate
  const eligibilityRate =
    totalStudents > 0
      ? ((eligibleStudents / totalStudents) * 100).toFixed(1)
      : "0.0";

  return {
    totalStudents,
    eligibleStudents,
    atRiskStudents,
    upcomingSessions,
    eligibilityRate,
  };
}

export default async function AdminDashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const analytics = await getAdminAnalytics();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Students Card */}
        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
            <CardDescription>Active student-athletes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analytics.totalStudents}</p>
          </CardContent>
        </Card>

        {/* Eligibility Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Rate</CardTitle>
            <CardDescription>NCAA compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              {analytics.eligibilityRate}%
            </p>
          </CardContent>
        </Card>

        {/* At-Risk Students Card */}
        <Card>
          <CardHeader>
            <CardTitle>At-Risk Students</CardTitle>
            <CardDescription>GPA below 2.5</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-600">
              {analytics.atRiskStudents}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Sessions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Scheduled support</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analytics.upcomingSessions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <a
                href="/admin/students"
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-2">Manage Students</h3>
                <p className="text-sm text-gray-600">
                  View and manage student records
                </p>
              </a>
              <a
                href="/admin/programs"
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-2">Manage Programs</h3>
                <p className="text-sm text-gray-600">
                  Tutoring and study hall management
                </p>
              </a>
              <a
                href="/admin/reports"
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-2">Generate Reports</h3>
                <p className="text-sm text-gray-600">
                  Compliance and performance reports
                </p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
