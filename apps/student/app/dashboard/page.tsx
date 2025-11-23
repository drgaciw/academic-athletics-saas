import { auth } from "@clerk/nextjs";
import { prisma } from "@aah/database";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { AcademicOverviewCard } from "@/components/academic-overview-card";
import {
  EligibilityStatusCard,
  type EligibilityStatus,
} from "@/components/eligibility-status-card";
import {
  WeekScheduleList,
  type ScheduleEvent,
} from "@/components/week-schedule-list";
import { ChatWidgetWrapper } from "@/components/chat-widget-wrapper";

async function getStudentData(userId: string) {
  // Fetch user data - adjust based on actual database schema
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
}

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
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

  // Mock data for now - replace with actual database queries
  const gpa = 3.45;
  const creditsEarned = 90;
  const totalCredits = 120;
  const degreeProgress = (creditsEarned / totalCredits) * 100;
  const eligibilityStatus: EligibilityStatus = "eligible";

  // Mock schedule events
  const scheduleEvents: ScheduleEvent[] = [
    {
      id: "1",
      title: "MATH 201 - Calculus II",
      type: "class",
      startTime: addDays(new Date(), 1),
      endTime: addDays(new Date(), 1),
      location: "Science Building 201",
    },
    {
      id: "2",
      title: "Team Practice",
      type: "practice",
      startTime: addDays(new Date(), 2),
      endTime: addDays(new Date(), 2),
      location: "Athletic Center",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {student.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your academic overview and upcoming schedule
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Academic Overview */}
          <AcademicOverviewCard
            gpa={gpa}
            creditsEarned={creditsEarned}
            totalCredits={totalCredits}
            degreeProgress={degreeProgress}
          />

          {/* Eligibility Status */}
          <EligibilityStatusCard
            status={eligibilityStatus}
            nextCheckDate={addDays(new Date(), 30)}
          />

          {/* Weekly Schedule */}
          <div className="md:col-span-2 lg:col-span-1">
            <WeekScheduleList events={scheduleEvents} />
          </div>
        </div>
      </div>

      {/* AI Chat Widget */}
      <ChatWidgetWrapper />
    </div>
  );
}
