'use client';

import { Sidebar, NavigationBar, type SidebarItem } from '@aah/ui';
import { useUIStore } from '@aah/ui';
import { useUser } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  FlaskConical,
  FileText,
  Settings,
} from 'lucide-react';

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Students',
    href: '/admin/students',
    icon: Users,
  },
  {
    label: 'Alerts',
    href: '/admin/alerts',
    icon: AlertTriangle,
  },
  {
    label: 'AI Evaluations',
    href: '/admin/evals',
    icon: FlaskConical,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navigation Bar */}
        <NavigationBar
          title="Admin Portal"
          user={
            user
              ? {
                  name: user.fullName || 'Admin User',
                  email: user.primaryEmailAddress?.emailAddress || '',
                  imageUrl: user.imageUrl,
                }
              : undefined
          }
          notificationCount={3}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}