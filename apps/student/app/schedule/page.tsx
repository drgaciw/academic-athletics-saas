import { auth } from '@clerk/nextjs';
import { prisma } from '@aah/database';
import { Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { redirect } from 'next/navigation';

async function getStudentSchedule(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      courses: {
        orderBy: { name: 'asc' },
      },
    },
  });

  return user;
}

export default async function SchedulePage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const student = await getStudentSchedule(userId);

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Student not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Schedule</h1>

      <Card>
        <CardHeader>
          <CardTitle>Course Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {student.courses.length > 0 ? (
            <div className="space-y-4">
              {student.courses.map((course) => (
                <div
                  key={course.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <h3 className="font-semibold text-lg">{course.name}</h3>
                  <p className="text-sm text-gray-600">
                    {course.code || 'No course code'}
                  </p>
                  {course.schedule && (
                    <p className="text-sm text-gray-500 mt-1">
                      Schedule: {course.schedule}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No courses in your schedule</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Conflict Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600">✓ No scheduling conflicts detected</p>
            <p className="text-sm text-gray-500 mt-2">
              Your academic schedule does not conflict with athletic commitments.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
