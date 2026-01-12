'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '../utils/cn';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  children?: SidebarItem[];
}

export interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  currentPath?: string;
  LinkComponent?: React.ComponentType<{ href: string; className?: string; title?: string; children: React.ReactNode }>;
  className?: string;
}

export function Sidebar({
  items,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  currentPath = '',
  LinkComponent = 'a' as any,
  className,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  const isActive = (href: string) => {
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <div key={item.href}>
              <LinkComponent
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  active && 'bg-accent text-accent-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                    </LinkComponent>

              {/* Nested Items */}
              {!collapsed && item.children && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <LinkComponent
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isActive(child.href) && 'bg-accent text-accent-foreground'
                      )}
                    >
                      {child.icon && <child.icon className="h-4 w-4" />}
                      <span>{child.label}</span>
                    </LinkComponent>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}