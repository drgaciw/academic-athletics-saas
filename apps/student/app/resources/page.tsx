import { auth } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@aah/ui';
import { redirect } from 'next/navigation';

export default async function ResourcesPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Resources</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tutoring Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tutoring Services</CardTitle>
            <CardDescription>Get academic support from peer tutors</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Schedule one-on-one or group tutoring sessions for your courses.
            </p>
            <Button>Book Tutoring Session</Button>
          </CardContent>
        </Card>

        {/* Study Hall Card */}
        <Card>
          <CardHeader>
            <CardTitle>Study Hall</CardTitle>
            <CardDescription>Structured study time with supervision</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Join study hall sessions to complete coursework in a focused environment.
            </p>
            <Button variant="secondary">View Study Hall Schedule</Button>
          </CardContent>
        </Card>

        {/* Life Skills Card */}
        <Card>
          <CardHeader>
            <CardTitle>Life Skills Workshops</CardTitle>
            <CardDescription>Personal and professional development</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Attend workshops on time management, career planning, and more.
            </p>
            <Button variant="outline">Browse Workshops</Button>
          </CardContent>
        </Card>

        {/* Academic Advising Card */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Advising</CardTitle>
            <CardDescription>Course planning and degree progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Meet with an academic advisor to plan your course schedule.
            </p>
            <Button variant="outline">Schedule Advising</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
