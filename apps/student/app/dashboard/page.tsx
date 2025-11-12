import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { PageHeading } from '@/components/page-heading';
import { AcademicOverviewCard } from '@/components/academic-overview-card';
import { EligibilityStatusCard } from '@/components/eligibility-status-card';
import { WeekScheduleCard } from '@/components/week-schedule-card';
import { NotificationsCard } from '@/components/notifications-card';
import { ChatWidget } from '@/components/chat-widget';

// Mock data - replace with actual data fetching later
const academicData = {
  gpa: 3.8,
  totalCredits: 72,
  degreeCompletion: 60,
};

const eligibilityData = {
  status: 'Eligible',
  details: 'You are currently meeting all requirements.',
};

const scheduleEvents = [
  {
    day: 'Mon',
    time: '10:00 AM',
    title: 'Calculus II',
    description: 'Class - Science Hall 204',
    color: 'primary',
  },
  {
    day: 'Tue',
    time: '3:00 PM',
    title: 'Weight Training',
    description: 'Practice - Athletic Center',
    color: 'accent-gold',
  },
  {
    day: 'Wed',
    time: '11:00 AM',
    title: 'Academic Advising',
    description: "Meeting - Advisor's Office",
    color: 'primary',
  },
];

const notifications = [
  {
    icon: 'event_available',
    iconColor: 'primary',
    text: 'Meeting with Coach Davis confirmed for Friday at 2 PM.',
    time: '2 hours ago',
  },
  {
    icon: 'warning',
    iconColor: 'status-yellow',
    text: 'Tuition payment is due in 3 days. Please review your account.',
    time: '1 day ago',
  },
  {
    icon: 'assignment_turned_in',
    iconColor: 'status-green',
    text: 'Your "History of Sport" essay grade has been posted.',
    time: '3 days ago',
  },
];

export default async function DashboardPage() {
  const { userId, user } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const studentName = user?.firstName ?? 'Student';

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading name={studentName} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <AcademicOverviewCard {...academicData} />
              <EligibilityStatusCard {...eligibilityData} />
            </div>
            <WeekScheduleCard events={scheduleEvents} />
          </div>
          <div className="lg:col-span-1">
            <NotificationsCard notifications={notifications} />
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
