import { prisma } from '@aah/database';
import type { EligibilityStatus } from '@/components/eligibility-status-card';
import {
  buildAthleticScheduleEvents,
  buildClassScheduleEvents,
  mergeScheduleEvents,
  type CourseSectionInput,
} from '@/lib/schedule-utils';
import type { ScheduleEvent } from '@/components/week-schedule-list';

const DEFAULT_DEGREE_CREDITS = 120;

export function mapEligibilityStatus(status: string, isEligible?: boolean): EligibilityStatus {
  const normalized = status.toUpperCase();

  if (normalized.includes('INELIG') || isEligible === false) {
    return 'ineligible';
  }
  if (normalized.includes('RISK') || normalized.includes('PROBATION')) {
    return 'at-risk';
  }
  if (normalized.includes('ELIG') || normalized.includes('GOOD') || isEligible === true) {
    return 'eligible';
  }
  return 'pending-review';
}

export async function getStudentByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      studentProfile: {
        include: {
          complianceRecords: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          schedules: {
            where: { status: 'ENROLLED' },
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sections: {
                include: { course: true },
              },
            },
          },
        },
      },
    },
  });
}

type LoadedStudent = NonNullable<Awaited<ReturnType<typeof getStudentByClerkId>>>;
type LoadedStudentProfile = NonNullable<LoadedStudent['studentProfile']>;

export function getDashboardMetrics(studentProfile: LoadedStudentProfile) {
  const latestCompliance = studentProfile.complianceRecords[0];
  const gpa = latestCompliance?.cumulativeGpa ?? studentProfile.gpa ?? 0;
  const creditsEarned = latestCompliance?.creditHours ?? studentProfile.creditHours ?? 0;
  const totalCredits = DEFAULT_DEGREE_CREDITS;
  const degreeProgress = totalCredits > 0 ? (creditsEarned / totalCredits) * 100 : 0;
  const eligibilityStatus = mapEligibilityStatus(
    studentProfile.eligibilityStatus,
    latestCompliance?.isEligible
  );

  const nextCheckDate = latestCompliance?.reviewedAt
    ? new Date(latestCompliance.reviewedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    : undefined;

  return {
    gpa,
    creditsEarned,
    totalCredits,
    degreeProgress,
    eligibilityStatus,
    nextCheckDate,
    eligibilityMessage: latestCompliance?.notes ?? undefined,
  };
}

export function getEnrolledCourseSections(studentProfile: LoadedStudentProfile): CourseSectionInput[] {
  const schedule = studentProfile.schedules[0];
  if (!schedule) return [];

  return schedule.sections.map((section) => ({
    id: section.id,
    courseCode: section.course.courseCode,
    courseName: section.course.courseName,
    days: section.days,
    startTime: section.startTime,
    endTime: section.endTime,
    location: section.location,
  }));
}

export function getWeekScheduleEvents(studentProfile: LoadedStudentProfile): ScheduleEvent[] {
  const classEvents = buildClassScheduleEvents(getEnrolledCourseSections(studentProfile));
  const athleticEvents = buildAthleticScheduleEvents(studentProfile.athleticSchedule);
  return mergeScheduleEvents(classEvents, athleticEvents);
}
