'use client'

import { useState } from 'react'
import { CalendarView, type CalendarEvent, Button, AlertBanner } from '@aah/ui'
import { Download, Calendar as CalendarIcon } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string | null
  schedule: string | null
}

interface ScheduleCalendarViewProps {
  courses: Course[]
}

// Mock function to convert courses to calendar events
// In production, this would parse actual schedule data
function coursesToEvents(courses: Course[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  
  // Mock schedule data - replace with actual parsing
  const mockSchedules = [
    { day: 1, hour: 9, duration: 1.5 }, // Monday 9am
    { day: 3, hour: 9, duration: 1.5 }, // Wednesday 9am
    { day: 5, hour: 9, duration: 1.5 }, // Friday 9am
  ]

  courses.forEach((course, index) => {
    const schedule = mockSchedules[index % mockSchedules.length]
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    
    const eventDate = new Date(startOfWeek)
    eventDate.setDate(eventDate.getDate() + schedule.day)
    eventDate.setHours(schedule.hour, 0, 0, 0)
    
    const endDate = new Date(eventDate)
    endDate.setHours(eventDate.getHours() + Math.floor(schedule.duration))
    endDate.setMinutes((schedule.duration % 1) * 60)

    events.push({
      id: course.id,
      title: `${course.code || course.name}`,
      start: eventDate,
      end: endDate,
      type: 'class',
      location: 'TBD',
      description: course.name,
    })
  })

  // Add mock practice events
  const practiceDate = new Date()
  practiceDate.setHours(15, 0, 0, 0)
  events.push({
    id: 'practice-1',
    title: 'Team Practice',
    start: practiceDate,
    end: new Date(practiceDate.getTime() + 2 * 60 * 60 * 1000),
    type: 'practice',
    location: 'Athletic Center',
    description: 'Regular team practice',
  })

  return events
}

export function ScheduleCalendarView({ courses }: ScheduleCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const events = coursesToEvents(courses)
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