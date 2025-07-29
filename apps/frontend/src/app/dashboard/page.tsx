/**
 * Dashboard page for SynkBoard
 * Following frontend-behavior.md dashboard requirements
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useDashboards } from '@/hooks/use-api';
import { PageLoading, PageError, EmptyState } from '@/components/layout/app-layout';
import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboards, isLoading, error, refetch } = useDashboards();

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} retry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your data today.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboards/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Dashboard
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Dashboards
              </p>
              <p className="text-2xl font-bold text-foreground">
                {dashboards?.dashboards?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-success/10 rounded-lg flex items-center justify-center">
                <span className="text-success font-semibold">E</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Active Entities
              </p>
              <p className="text-2xl font-bold text-foreground">
                -
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-warning/10 rounded-lg flex items-center justify-center">
                <span className="text-warning font-semibold">R</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Records
              </p>
              <p className="text-2xl font-bold text-foreground">
                -
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                <span className="text-destructive font-semibold">W</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Webhooks Today
              </p>
              <p className="text-2xl font-bold text-foreground">
                -
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Dashboards
        </h2>
        
        {!dashboards?.dashboards || dashboards.dashboards.length === 0 ? (
          <EmptyState
            icon={
              <ChartBarIcon className="h-12 w-12" />
            }
            title="No dashboards yet"
            description="Create your first dashboard to start visualizing your data."
            action={
              <button
                onClick={() => router.push('/dashboards/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Dashboard
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.dashboards.map((dashboard: any) => (
              <div
                key={dashboard.id}
                className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboards/${dashboard.slug}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {dashboard.name}
                  </h3>
                  {dashboard.is_public && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Public
                    </span>
                  )}
                </div>
                
                {dashboard.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {dashboard.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {dashboard.widgets?.length || 0} widgets
                  </span>
                  <span>
                    Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  );
}
