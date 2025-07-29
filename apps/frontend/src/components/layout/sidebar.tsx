/**
 * Sidebar navigation for SynkBoard
 * Following frontend-behavior.md navigation requirements
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, usePermissions } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  ChartBarIcon,
  TableCellsIcon,
  CogIcon,
  BoltIcon,
  DocumentTextIcon,
  UsersIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string;
  badge?: string;
}

export function Sidebar({ open, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission, hasMinimumRole } = usePermissions();

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      permission: 'dashboard:view',
    },
    {
      name: 'Entities',
      href: '/entities',
      icon: TableCellsIcon,
      permission: 'entity:view',
    },
    {
      name: 'Rules',
      href: '/rules',
      icon: BoltIcon,
      permission: 'rule:edit',
    },
    {
      name: 'Webhooks',
      href: '/webhooks',
      icon: DocumentTextIcon,
      permission: 'webhook:manage',
    },
    {
      name: 'Users',
      href: '/users',
      icon: UsersIcon,
      role: 'admin',
    },
    {
      name: 'API Keys',
      href: '/api-keys',
      icon: KeyIcon,
      role: 'admin',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
    },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (item.permission && !hasPermission(item.permission as any)) {
      return false;
    }
    if (item.role && !hasMinimumRole(item.role as any)) {
      return false;
    }
    return true;
  });

  return (
    <div className={cn('flex flex-col bg-card border-r border-border', className)}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">SynkBoard</span>
        </Link>
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded-full bg-primary/10 text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role} • {user?.tenant?.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
