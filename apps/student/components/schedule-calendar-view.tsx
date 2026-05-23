'use client'

import { useState } from 'react'
import { CalendarView, type CalendarEvent, Button, AlertBanner } from '@aah/ui'
import { Download } from 'lucide-react'
import {
  buildAthleticScheduleEvents,
  buildClassScheduleEvents,
  mergeScheduleEvents,
  type CourseSectionInput,
} from '@/lib/schedule-utils'
import type { ScheduleEvent } from '@/components/week-schedule-list'

interface ScheduleCalendarViewProps {
  courses: CourseSectionInput[]
  athleticSchedule?: unknown
}

function scheduleEventsToCalendarEvents(events: ScheduleEvent[]): CalendarEvent[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startTime,
    end: event.endTime,
    type: event.type,
    location: event.location,
    description: event.title,
  }))
}

function coursesToEvents(courses: CourseSectionInput[], athleticSchedule?: unknown): CalendarEvent[] {
  const classEvents = buildClassScheduleEvents(courses)
  const athleticEvents = buildAthleticScheduleEvents(athleticSchedule)
  return scheduleEventsToCalendarEvents(mergeScheduleEvents(classEvents, athleticEvents))
}

export function ScheduleCalendarView({ courses, athleticSchedule }: ScheduleCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const events = coursesToEvents(courses, athleticSchedule)
  const hasConflicts = events.some((e) => e.conflict)

  const handleExportCalendar = () => {
    const icalContent = generateICalContent(events)
    const blob = new Blob([icalContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'schedule.ics'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={handleExportCalendar} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export to Calendar
        </Button>
      </div>

      {hasConflicts && (
        <AlertBanner
          variant="warning"
          title="Scheduling Conflicts Detected"
          description="You have overlapping events. Please review and resolve conflicts."
        />
      )}

      <CalendarView
        events={events}
        onSelectEvent={setSelectedEvent}
        defaultView="week"
      />

      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {selectedEvent.title}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Time:</span>
                <p className="text-gray-900">
                  {selectedEvent.start.toLocaleString()} -{' '}
                  {selectedEvent.end.toLocaleTimeString()}
                </p>
              </div>
              {selectedEvent.location && (
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p className="text-gray-900">{selectedEvent.location}</p>
                </div>
              )}
              {selectedEvent.description && (
                <div>
                  <span className="font-medium text-gray-700">
                    Description:
                  </span>
                  <p className="text-gray-900">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.conflict && (
                <AlertBanner
                  variant="warning"
                  description="This event conflicts with another scheduled item"
                />
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function generateICalContent(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Athletic Academics Hub//Schedule//EN',
    'CALSCALE:GREGORIAN',
  ]

  events.forEach((event) => {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}@athleticacademics.com`)
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`)
    lines.push(`DTSTART:${formatICalDate(event.start)}`)
    lines.push(`DTEND:${formatICalDate(event.end)}`)
    lines.push(`SUMMARY:${event.title}`)
    if (event.location) {
      lines.push(`LOCATION:${event.location}`)
    }
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description}`)
    }
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function formatICalDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}
