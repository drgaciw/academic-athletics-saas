import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@aah/ui';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@aah/ui';

export type EventType = 'class' | 'practice' | 'tutoring' | 'study-hall' | 'travel';

export interface ScheduleEvent {
  id: string;
  title: string;
  type: EventType;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export interface WeekScheduleListProps {
  events: ScheduleEvent[];
}

const eventTypeConfig: Record<
  EventType,
  { color: string; bgColor: string; label: string }
> = {
  class: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Class' },
  practice: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Practice' },
  tutoring: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Tutoring' },
  'study-hall': { color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'Study Hall' },
  travel: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Travel' },
};

export function WeekScheduleList({ events }: WeekScheduleListProps) {
  const sortedEvents = [...events].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>This Week's Schedule</CardTitle>
            <CardDescription>{events.length} upcoming events</CardDescription>
          </div>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events this week
          </p>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => {
              const config = eventTypeConfig[event.type];
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                      config.bgColor
                    )}
                  >
                    <span className={cn('text-xs font-semibold', config.color)}>
                      {format(event.startTime, 'MMM d')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{event.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(event.startTime, 'h:mm a')} -{' '}
                          {format(event.endTime, 'h:mm a')}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium',
                        config.bgColor,
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}