'use client';

interface Notification {
  icon: string;
  iconColor: 'primary' | 'status-yellow' | 'status-green';
  text: string;
  time: string;
}

interface NotificationsCardProps {
  notifications: Notification[];
}

const iconColorClasses = {
  primary: 'bg-primary/10 text-primary',
  'status-yellow': 'bg-status-yellow/10 text-status-yellow',
  'status-green': 'bg-status-green/10 text-status-green',
};

export function NotificationsCard({ notifications }: NotificationsCardProps) {
  return (
    <div className="rounded-xl bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-neutral-text">
        Notifications
      </h3>
      <div className="flex flex-col gap-4">
        {notifications.map((notification, index) => (
          <div key={index} className="flex gap-3">
            <div
              className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full ${
                iconColorClasses[notification.iconColor]
              }`}
            >
              <span className="material-symbols-outlined">
                {notification.icon}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-text">
                {notification.text}
              </p>
              <p className="text-xs text-gray-500">{notification.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
