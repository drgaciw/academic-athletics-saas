import { auth } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@aah/ui';
import { redirect } from 'next/navigation';
import { TutoringSection } from '@/components/tutoring-section';
import { StudyHallSection } from '@/components/study-hall-section';
import { WorkshopsSection } from '@/components/workshops-section';
import { MentorCard } from '@/components/mentor-card';

export default async function ResourcesPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Access tutoring, study halls, workshops, and mentoring support
          </p>
        </div>

        {/* Mentor Card */}
        <MentorCard />

        {/* Tutoring Services */}
        <TutoringSection />

        {/* Study Hall */}
        <StudyHallSection />

        {/* Workshops */}
        <WorkshopsSection />

        {/* Resource Library */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Library</CardTitle>
            <CardDescription>
              Access study materials, guides, and helpful documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <h4 className="font-medium">NCAA Eligibility Guide</h4>
                  <p className="text-sm text-gray-500">PDF • 2.4 MB</p>
                </div>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <h4 className="font-medium">Time Management Workshop</h4>
                  <p className="text-sm text-gray-500">Video • 45 min</p>
                </div>
                <Button variant="ghost" size="sm">
                  Watch
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <h4 className="font-medium">Study Skills Handbook</h4>
                  <p className="text-sm text-gray-500">PDF • 1.8 MB</p>
                </div>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
