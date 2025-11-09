import { auth } from '@clerk/nextjs';
import { prisma } from '@aah/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@aah/ui';
import { redirect } from 'next/navigation';

async function getStudentData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      courses: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      sessions: {
        where: { status: 'scheduled' },
        take: 3,
        orderBy: { scheduledAt: 'asc' },
      },
      complianceRecords: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return user;
}

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const student = await getStudentData(userId);

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Student not found</h1>
        <p>Please contact support if you believe this is an error.</p>
      </div>
    );
  }

  const latestCompliance = student.complianceRecords[0];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {student.firstName} {student.lastName}
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Compliance Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>NCAA eligibility status</CardDescription>
          </CardHeader>
          <CardContent>
            {latestCompliance ? (
              <div>
                <p className="text-2xl font-bold">
                  {latestCompliance.eligible ? '✓ Eligible' : '⚠ Review Required'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  GPA: {latestCompliance.gpa?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Credits: {latestCompliance.creditHours || 0}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No compliance data available</p>
            )}
          </CardContent>
        </Card>

        {/* Current Courses Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Courses</CardTitle>
            <CardDescription>{student.courses.length} enrolled</CardDescription>
          </CardHeader>
          <CardContent>
            {student.courses.length > 0 ? (
              <ul className="space-y-2">
                {student.courses.slice(0, 3).map((course) => (
                  <li key={course.id} className="text-sm">
                    {course.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No courses enrolled</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>{student.sessions.length} scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            {student.sessions.length > 0 ? (
              <ul className="space-y-2">
                {student.sessions.map((session) => (
                  <li key={session.id} className="text-sm">
                    <p className="font-medium">{session.type}</p>
                    <p className="text-gray-500">
                      {new Date(session.scheduledAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
