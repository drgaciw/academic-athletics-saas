'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const navigationLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/academics', label: 'Academics', icon: 'school' },
  { href: '/athletics', label: 'Athletics', icon: 'emoji_events' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_month' },
  { href: '/messages', label: 'Messages', icon: 'mail' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="flex h-screen min-h-full w-64 flex-col border-r border-neutral-border bg-white p-4 sticky top-0">
      <div className="mb-4 flex items-center gap-2 px-2 py-4">
        <span className="material-symbols-outlined text-3xl text-primary">
          school
        </span>
        <h2 className="text-xl font-bold text-neutral-text">Athletics Hub</h2>
      </div>
      <div className="flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div
              className="aspect-square size-10 rounded-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${user.imageUrl})` }}
              data-alt={`Portrait of ${user.fullName}`}
            ></div>
            <div className="flex flex-col">
              <h1 className="text-base font-medium leading-normal text-neutral-text">
                {user.fullName}
              </h1>
              <p className="text-sm font-normal leading-normal text-gray-500">
                Student Athlete
              </p>
            </div>
          </div>
        )}
        <nav className="mt-4 flex flex-col gap-2">
          {navigationLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-text hover:bg-gray-100'
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    isActive ? 'fill' : ''
                  }`}
                >
                  {link.icon}
                </span>
                <p className="text-sm font-medium leading-normal">
                  {link.label}
                </p>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-text hover:bg-gray-100"
        >
          <span className="material-symbols-outlined">settings</span>
          <p className="text-sm font-medium leading-normal">Settings</p>
        </Link>
      </div>
    </aside>
  );
}
