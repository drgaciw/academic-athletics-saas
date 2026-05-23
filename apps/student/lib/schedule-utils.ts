import { addDays, startOfWeek } from 'date-fns';
import type { ScheduleEvent } from '@/components/week-schedule-list';

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export interface CourseSectionInput {
  id: string;
  courseCode: string;
  courseName: string;
  days: string[];
  startTime: string;
  endTime: string;
  location?: string | null;
}

function parseTimeValue(timeStr: string): { hours: number; minutes: number } {
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) {
    return { hours: 9, minutes: 0 };
  }

  let hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

function resolveDayIndex(day: string): number | null {
  const upper = day.trim().toUpperCase();
  if (upper in DAY_INDEX) {
    return DAY_INDEX[upper]!;
  }

  const shortMap: Record<string, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    TUES: 2,
    WED: 3,
    THU: 4,
    THUR: 4,
    THURS: 4,
    FRI: 5,
    SAT: 6,
  };

  return shortMap[upper.slice(0, 4)] ?? shortMap[upper.slice(0, 3)] ?? null;
}

function eventDateForDay(dayIndex: number, timeStr: string, weekStart: Date): Date {
  const { hours, minutes } = parseTimeValue(timeStr);
  const date = addDays(weekStart, dayIndex);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function buildClassScheduleEvents(sections: CourseSectionInput[]): ScheduleEvent[] {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const events: ScheduleEvent[] = [];

  for (const section of sections) {
    for (const day of section.days) {
      const dayIndex = resolveDayIndex(day);
      if (dayIndex == null) continue;

      const startTime = eventDateForDay(dayIndex, section.startTime, weekStart);
      const endTime = eventDateForDay(dayIndex, section.endTime, weekStart);

      events.push({
        id: `${section.id}-${day}`,
        title: section.courseCode || section.courseName,
        type: 'class',
        startTime,
        endTime,
        location: section.location ?? undefined,
      });
    }
  }

  return events;
}

interface AthleticEventInput {
  day?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  title?: string;
  location?: string;
}

export function buildAthleticScheduleEvents(athleticSchedule: unknown): ScheduleEvent[] {
  if (!athleticSchedule) return [];

  let rawEvents: AthleticEventInput[] = [];

  if (Array.isArray(athleticSchedule)) {
    rawEvents = athleticSchedule as AthleticEventInput[];
  } else if (
    typeof athleticSchedule === 'object' &&
    athleticSchedule !== null &&
    Array.isArray((athleticSchedule as { events?: AthleticEventInput[] }).events)
  ) {
    rawEvents = (athleticSchedule as { events: AthleticEventInput[] }).events;
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const events: ScheduleEvent[] = [];

  rawEvents.forEach((event, index) => {
    if (!event.day || !event.startTime || !event.endTime) return;

    const dayIndex = resolveDayIndex(event.day);
    if (dayIndex == null) return;

    const eventType = (event.type ?? 'practice').toLowerCase();
    const type =
      eventType.includes('practice') || eventType.includes('athletic')
        ? 'practice'
        : eventType.includes('travel')
          ? 'travel'
          : 'practice';

    events.push({
      id: `athletic-${index}`,
      title: event.title ?? event.type ?? 'Athletic Event',
      type,
      startTime: eventDateForDay(dayIndex, event.startTime, weekStart),
      endTime: eventDateForDay(dayIndex, event.endTime, weekStart),
      location: event.location,
    });
  });

  return events;
}

export function mergeScheduleEvents(...groups: ScheduleEvent[][]): ScheduleEvent[] {
  return groups.flat().sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}
