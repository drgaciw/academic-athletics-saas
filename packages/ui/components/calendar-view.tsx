'use client'

import * as React from 'react'
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import { cn } from '../utils/cn'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type?: 'class' | 'practice' | 'tutoring' | 'study-hall' | 'travel' | 'other'
  location?: string
  description?: string
  conflict?: boolean
}

export interface CalendarViewProps {
  events: CalendarEvent[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
  defaultView?: View
  className?: string
}

const eventTypeColors = {
  class: 'bg-blue-500 border-blue-600',
  practice: 'bg-green-500 border-green-600',
  tutoring: 'bg-purple-500 border-purple-600',
  'study-hall': 'bg-indigo-500 border-indigo-600',
  travel: 'bg-orange-500 border-orange-600',
  other: 'bg-gray-500 border-gray-600',
}

export function CalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
  defaultView = 'week',
  className,
}: CalendarViewProps) {
  const eventStyleGetter = (event: CalendarEvent) => {
    const colorClass = eventTypeColors[event.type || 'other']
    
    return {
      className: cn(
        colorClass,
        'text-white rounded px-2 py-1 text-sm',
        event.conflict && 'ring-2 ring-red-500 ring-offset-1'
      ),
    }
  }

  return (
    <div className={cn('h-[600px] bg-white rounded-lg p-4', className)}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={defaultView}
        views={['month', 'week', 'day']}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        className="custom-calendar"
      />
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Class</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Practice</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500" />
          <span>Tutoring</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-500" />
          <span>Study Hall</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span>Travel</span>
        </div>
      </div>
    </div>
  )
}