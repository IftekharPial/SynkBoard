/**
 * Settings Page for SynkBoard
 * Application and tenant configuration settings
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
} from '@/components/ui';
import {
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    // Profile settings
    name: user?.name || '',
    email: user?.email || '',
    timezone: 'UTC',
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    
    // Security settings
    twoFactorAuth: false,
    sessionTimeout: '24',
    
    // Appearance settings
    theme: theme,
    compactMode: false,
    showAnimations: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings logic would go here
    console.log('Saving settings:', settings);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Settings Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div>
          <Card id="profile">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Profile Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={settings.name}
                  onChange={(e) => handleSettingChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <Select
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'America/New_York', label: 'Eastern Time' },
                    { value: 'America/Chicago', label: 'Central Time' },
                    { value: 'America/Denver', label: 'Mountain Time' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time' },
                  ]}
                  value={settings.timezone}
                  onChange={(value) => handleSettingChange('timezone', value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings */}
        <div>
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BellIcon className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Receive weekly analytics reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.weeklyReports}
                  onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <div>
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">
                  {settings.twoFactorAuth ? 'Disable' : 'Enable'}
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (hours)</label>
                <Select
                  options={[
                    { value: '1', label: '1 hour' },
                    { value: '8', label: '8 hours' },
                    { value: '24', label: '24 hours' },
                    { value: '168', label: '1 week' },
                  ]}
                  value={settings.sessionTimeout}
                  onChange={(value) => handleSettingChange('sessionTimeout', value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appearance Settings */}
        <div>
          <Card id="appearance">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PaintBrushIcon className="h-5 w-5" />
                <span>Appearance Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <Select
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' },
                  ]}
                  value={settings.theme}
                  onChange={(value) => {
                    handleSettingChange('theme', value);
                    setTheme(value as any);
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Use smaller spacing and elements</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Animations</p>
                  <p className="text-sm text-muted-foreground">Enable UI animations and transitions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showAnimations}
                  onChange={(e) => handleSettingChange('showAnimations', e.target.checked)}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
