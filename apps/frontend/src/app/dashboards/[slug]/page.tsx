/**
 * Dashboard view/edit page for SynkBoard
 * Display dashboard with widgets and drag-and-drop editing
 */

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboard, useUpdateDashboard } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DropdownButton,
  ConfirmDialog,
  PageLoading,
  PageError,
  Breadcrumb,
} from '@/components/ui';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { WidgetRenderer } from '@/components/dashboard/widget-renderer';
import { AddWidgetDialog } from '@/components/dashboard/add-widget-dialog';
import {
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import type { DashboardWithWidgets, UpdateDashboard } from '@synkboard/types';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const slug = params.slug as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: dashboard, isLoading, error, refetch } = useDashboard(slug);
  const updateDashboard = useUpdateDashboard(slug);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} retry={refetch} />;
  }

  if (!dashboard?.dashboard) {
    return <PageError error={new Error('Dashboard not found')} />;
  }

  const dashboardData = dashboard.dashboard as DashboardWithWidgets;

  const canEdit = hasPermission('dashboard:update');
  const canDelete = hasPermission('dashboard:delete');

  const handleLayoutChange = async (layout: any) => {
    if (!canEdit) return;

    try {
      await updateDashboard.mutateAsync({
        layout,
      });
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleDeleteDashboard = async () => {
    if (!canDelete) return;

    try {
      // TODO: Implement delete dashboard API call
      router.push('/dashboard');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const getDashboardActions = () => {
    const actions = [];

    if (canEdit) {
      actions.push({
        key: 'edit',
        label: isEditing ? 'Exit Edit Mode' : 'Edit Dashboard',
        icon: isEditing ? <EyeIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />,
        onClick: () => setIsEditing(!isEditing),
      });

      if (isEditing) {
        actions.push({
          key: 'add-widget',
          label: 'Add Widget',
          icon: <PlusIcon className="h-4 w-4" />,
          onClick: () => setShowAddWidget(true),
        });
      }

      actions.push({
        key: 'settings',
        label: 'Dashboard Settings',
        icon: <Cog6ToothIcon className="h-4 w-4" />,
        onClick: () => router.push(`/dashboards/${slug}/settings`),
      });
    }

    actions.push({
      key: 'share',
      label: 'Share Dashboard',
      icon: <ShareIcon className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implement share functionality
      },
    });

    if (canDelete) {
      actions.push({
        key: 'separator',
        separator: true,
      });
      actions.push({
        key: 'delete',
        label: 'Delete Dashboard',
        icon: <TrashIcon className="h-4 w-4" />,
        destructive: true,
        onClick: () => setDeleteDialogOpen(true),
      });
    }

    return actions;
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: dashboardData.name, current: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-foreground">
                {dashboardData.name}
              </h1>
              {dashboardData.is_public && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Public
                </span>
              )}
              {isEditing && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                  Editing
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {dashboardData.widgets.length} widgets • Last updated {new Date(dashboardData.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <DropdownButton
          items={getDashboardActions()}
          variant="outline"
        >
          Actions
        </DropdownButton>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Dashboard Content */}
      {dashboardData.widgets.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <PlusIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No widgets yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by adding your first widget to this dashboard.
              </p>
              {canEdit && (
                <div className="mt-6">
                  <Button
                    onClick={() => setShowAddWidget(true)}
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                  >
                    Add Widget
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <DashboardGrid
          dashboard={dashboardData}
          isEditing={isEditing}
          onLayoutChange={handleLayoutChange}
          onAddWidget={() => setShowAddWidget(true)}
        >
          {dashboardData.widgets.map((widget) => (
            <div key={widget.id} data-widget-id={widget.id}>
              <WidgetRenderer
                widget={widget}
                isEditing={isEditing}
                onEdit={() => {
                  // TODO: Open widget edit dialog
                }}
                onDelete={() => {
                  // TODO: Delete widget
                }}
              />
            </div>
          ))}
        </DashboardGrid>
      )}

      {/* Add Widget Dialog */}
      {showAddWidget && (
        <AddWidgetDialog
          dashboardId={dashboardData.id}
          onClose={() => setShowAddWidget(false)}
          onSuccess={() => {
            setShowAddWidget(false);
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDashboard}
        title="Delete Dashboard"
        description={`Are you sure you want to delete "${dashboardData.name}"? This action cannot be undone and will remove all widgets.`}
        confirmText="Delete Dashboard"
        destructive
      />
    </div>
  );
}
