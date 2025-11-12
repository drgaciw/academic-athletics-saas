'use client';

interface ScheduleEvent {
  day: string;
  time: string;
  title: string;
  description: string;
  color: 'primary' | 'accent-gold';
}

interface WeekScheduleCardProps {
  events: ScheduleEvent[];
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  'accent-gold': 'bg-accent-gold/10 text-yellow-600',
};

export function WeekScheduleCard({ events }: WeekScheduleCardProps) {
  return (
    <div className="rounded-xl bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-neutral-text">This Week</h3>
      <div className="flex flex-col gap-4">
        {events.map((event, index) => (
          <div key={index} className="flex items-center gap-4">
            <div
              className={`flex w-16 flex-col items-center justify-center rounded-lg p-3 ${
                colorClasses[event.color]
              }`}
            >
              <p className="text-lg font-bold">{event.day}</p>
              <p className="text-xs">{event.time}</p>
            </div>
            <div>
              <p className="font-semibold text-neutral-text">{event.title}</p>
              <p className="text-sm text-gray-500">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
