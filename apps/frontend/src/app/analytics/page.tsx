/**
 * Analytics Dashboard Page for SynkBoard
 * Displays analytics and metrics across all entities
 */

'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Records',
      value: '2,847',
      change: '+12%',
      changeType: 'positive',
      icon: DocumentTextIcon,
    },
    {
      name: 'Active Users',
      value: '156',
      change: '+8%',
      changeType: 'positive',
      icon: UsersIcon,
    },
    {
      name: 'Data Sources',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: ChartBarIcon,
    },
    {
      name: 'Growth Rate',
      value: '24.5%',
      change: '+4.2%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Overview of your data and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600">
                    {stat.change} from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart visualization will be implemented here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Entity breakdown chart will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New entity created: Support Tickets</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard updated: Customer Overview</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Rule triggered: High Priority Alert</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
