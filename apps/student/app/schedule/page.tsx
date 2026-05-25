import { auth } from '@clerk/nextjs/server'
import { Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { redirect } from 'next/navigation';
import { ScheduleCalendarView } from '@/components/schedule-calendar-view';
import { getEnrolledCourseSections, getStudentByClerkId } from '@/lib/student-data';

export default async function SchedulePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const student = await getStudentByClerkId(userId);

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Student not found</h1>
      </div>
    );
  }

  const profile = student.studentProfile;

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Profile incomplete</h1>
        <p>Your student athletic profile has not been set up yet.</p>
      </div>
    );
  }

  const courses = getEnrolledCourseSections(profile);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">
            View your academic and athletic commitments
          </p>
        </div>

        <ScheduleCalendarView
          courses={courses}
          athleticSchedule={profile.athleticSchedule}
        />

        <Card>
          <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <h3 className="font-semibold text-lg">{course.courseName}</h3>
                    <p className="text-sm text-gray-600">
                      {course.courseCode || 'No course code'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Schedule: {course.days.join(', ')} {course.startTime}-{course.endTime}
                      {course.location ? ` • ${course.location}` : ''}
                    </p>
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
