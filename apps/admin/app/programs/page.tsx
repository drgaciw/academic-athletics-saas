import { auth } from '@clerk/nextjs';
import { prisma } from '@aah/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@aah/ui';
import { redirect } from 'next/navigation';

async function getProgramData() {
  // Get upcoming sessions
  const upcomingSessions = await prisma.tutoringSession.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: {
        gte: new Date(),
      },
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      tutor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 10,
  });

  // Get session statistics
  const totalSessions = await prisma.tutoringSession.count();
  const completedSessions = await prisma.tutoringSession.count({
    where: { status: 'completed' },
  });
  const scheduledSessions = await prisma.tutoringSession.count({
    where: { status: 'scheduled' },
  });

  return {
    upcomingSessions,
    totalSessions,
    completedSessions,
    scheduledSessions,
  };
}

export default async function ProgramsPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const programData = await getProgramData();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Program Management</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Total Sessions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{programData.totalSessions}</p>
          </CardContent>
        </Card>

        {/* Completed Sessions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Finished sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {programData.completedSessions}
            </p>
          </CardContent>
        </Card>

        {/* Scheduled Sessions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled</CardTitle>
            <CardDescription>Upcoming sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {programData.scheduledSessions}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Next 10 scheduled sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {programData.upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {programData.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{session.type}</p>
                    <p className="text-sm text-gray-600">
                      {session.user.firstName} {session.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming sessions</p>
          )}
        </CardContent>
      </Card>

      {/* Program Actions */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tutoring Management</CardTitle>
            <CardDescription>Manage tutoring sessions and tutors</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Schedule Tutoring Session</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Hall Management</CardTitle>
            <CardDescription>Manage study hall schedules and attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Create Study Hall Session</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
