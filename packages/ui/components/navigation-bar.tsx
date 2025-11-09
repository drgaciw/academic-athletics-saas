'use client';

import { Bell, Menu, User } from 'lucide-react';
import { Button } from './button';
import { Avatar } from './avatar';
import { Badge } from './badge';
import { cn } from '../utils/cn';

export interface NavigationBarProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    imageUrl?: string;
  };
  notificationCount?: number;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onUserClick?: () => void;
  className?: string;
}

export function NavigationBar({
  title,
  user,
  notificationCount = 0,
  onMenuClick,
  onNotificationClick,
  onUserClick,
  className,
}: NavigationBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-sticky)] flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6',
        className
      )}
    >
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Title */}
      {title && <h1 className="text-lg font-semibold md:text-xl">{title}</h1>}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onNotificationClick}
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs"
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        {user && (
          <Button
            variant="ghost"
            className="gap-2"
            onClick={onUserClick}
            aria-label="User menu"
          >
            <Avatar
              src={user.imageUrl}
              alt={user.name}
              fallback={user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            />
            <span className="hidden md:inline-block text-sm font-medium">
              {user.name}
            </span>
          </Button>
        )}
      </div>
    </header>
  );
}