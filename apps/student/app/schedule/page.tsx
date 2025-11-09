import { auth } from '@clerk/nextjs';
import { prisma } from '@aah/database';
import { Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { redirect } from 'next/navigation';
import { ScheduleCalendarView } from '@/components/schedule-calendar-view';

async function getStudentSchedule(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // TODO: Fetch courses from proper relation when schema is updated
  // For now, return user with empty courses array
  return user ? { ...user, courses: [] } : null;
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">
            View your academic and athletic commitments
          </p>
        </div>

        {/* Calendar View */}
        <ScheduleCalendarView courses={student.courses || []} />

        {/* Course List */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {student.courses && student.courses.length > 0 ? (
              <div className="space-y-4">
                {student.courses.map((course: any) => (
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
              <p className="text-gray-500">No courses in your schedule yet. Courses will appear here once enrolled.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
