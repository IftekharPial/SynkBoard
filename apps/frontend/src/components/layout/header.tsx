/**
 * Header component for SynkBoard
 * Following frontend-behavior.md header requirements
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();

  const themeIcons = {
    light: SunIcon,
    dark: MoonIcon,
    system: ComputerDesktopIcon,
  };

  const ThemeIcon = themeIcons[theme];

  return (
    <header className={cn('bg-card border-b border-border', className)}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative">
            <div className="flex items-center">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setSearchOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            title={`Current theme: ${theme}`}
          >
            <ThemeIcon className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent relative">
            <BellIcon className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {user?.name}
              </span>
            </button>

            {/* Dropdown menu */}
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-20">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role} • {user?.tenant?.name}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        // Navigate to profile
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <UserCircleIcon className="mr-3 h-4 w-4" />
                      Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        // Navigate to settings
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Cog6ToothIcon className="mr-3 h-4 w-4" />
                      Settings
                    </button>
                    
                    <div className="border-t border-border">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
