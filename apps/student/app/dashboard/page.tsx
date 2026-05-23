import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AcademicOverviewCard } from "@/components/academic-overview-card";
import { EligibilityStatusCard } from "@/components/eligibility-status-card";
import { WeekScheduleList } from "@/components/week-schedule-list";
import { ChatWidgetWrapper } from "@/components/chat-widget-wrapper";
import {
  getDashboardMetrics,
  getStudentByClerkId,
  getWeekScheduleEvents,
} from "@/lib/student-data";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const student = await getStudentByClerkId(userId);

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Student not found</h1>
        <p>Please contact support if you believe this is an error.</p>
      </div>
    );
  }

  const profile = student.studentProfile;

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Profile incomplete</h1>
        <p>Your student athletic profile has not been set up yet. Contact your compliance office.</p>
      </div>
    );
  }

  const metrics = getDashboardMetrics(profile);
  const scheduleEvents = getWeekScheduleEvents(profile);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {student.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your academic overview and upcoming schedule
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AcademicOverviewCard
            gpa={metrics.gpa}
            creditsEarned={metrics.creditsEarned}
            totalCredits={metrics.totalCredits}
            degreeProgress={metrics.degreeProgress}
          />

          <EligibilityStatusCard
            status={metrics.eligibilityStatus}
            nextCheckDate={metrics.nextCheckDate}
            message={metrics.eligibilityMessage}
          />

          <div className="md:col-span-2 lg:col-span-1">
            <WeekScheduleList events={scheduleEvents} />
          </div>
        </div>
      </div>

      <ChatWidgetWrapper />
    </div>
  );
}
