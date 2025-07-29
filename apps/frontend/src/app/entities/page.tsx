/**
 * Entity listing page for SynkBoard
 * Displays all entities for the current tenant with management actions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEntities, useDeleteEntity } from '@/hooks/use-api';
import { useAuth, usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  Badge,
  StatusBadge,
  DropdownButton,
  ConfirmDialog,
  PageLoading,
  PageError,
  EmptyState,
  Breadcrumb,
} from '@/components/ui';
import {
  PlusIcon,
  TableCellsIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatNumber } from '@/lib/utils';
import type { EntityWithFields } from '@synkboard/types';

export default function EntitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { data, isLoading, error, refetch } = useEntities();
  const deleteEntity = useDeleteEntity();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [entityToDelete, setEntityToDelete] = React.useState<EntityWithFields | null>(null);

  const canCreateEntity = hasPermission('entity:editSchema');
  const canEditEntity = hasPermission('entity:editSchema');
  const canDeleteEntity = hasPermission('entity:editSchema');
  const canViewRecords = hasPermission('entity:view');

  const handleDeleteEntity = async () => {
    if (!entityToDelete) return;

    try {
      await deleteEntity.mutateAsync(entityToDelete.slug);
      setDeleteDialogOpen(false);
      setEntityToDelete(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const getEntityActions = (entity: EntityWithFields) => {
    const actions = [];

    if (canViewRecords) {
      actions.push({
        key: 'view-records',
        label: 'View Records',
        icon: <EyeIcon className="h-4 w-4" />,
        onClick: () => router.push(`/entities/${entity.slug}/records`),
      });
    }

    if (canEditEntity) {
      actions.push({
        key: 'edit',
        label: 'Edit Entity',
        icon: <PencilIcon className="h-4 w-4" />,
        onClick: () => router.push(`/entities/${entity.slug}/edit`),
      });
    }

    if (canDeleteEntity && entity._count?.records === 0) {
      actions.push({
        key: 'separator',
        separator: true,
      });
      actions.push({
        key: 'delete',
        label: 'Delete Entity',
        icon: <TrashIcon className="h-4 w-4" />,
        destructive: true,
        onClick: () => {
          setEntityToDelete(entity);
          setDeleteDialogOpen(true);
        },
      });
    }

    return actions;
  };

  const tableColumns = [
    {
      key: 'name',
      title: 'Entity Name',
      sortable: true,
      render: (value: string, entity: EntityWithFields) => (
        <div className="flex items-center space-x-3">
          {entity.icon && (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: entity.color || '#6366f1' }}
            >
              {entity.icon}
            </div>
          )}
          <div>
            <div className="font-medium text-foreground">{entity.name}</div>
            <div className="text-sm text-muted-foreground">/{entity.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'fields',
      title: 'Fields',
      render: (value: any, entity: EntityWithFields) => (
        <Badge variant="secondary">
          {entity.fields?.length || 0} fields
        </Badge>
      ),
    },
    {
      key: 'records',
      title: 'Records',
      render: (value: any, entity: EntityWithFields) => (
        <div className="text-sm">
          {formatNumber(entity._count?.records || 0)} records
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, entity: EntityWithFields) => (
        <StatusBadge status={entity.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(value, 'short')}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, entity: EntityWithFields) => {
        const actions = getEntityActions(entity);
        if (actions.length === 0) return null;

        return (
          <DropdownButton
            items={actions}
            variant="ghost"
            size="sm"
          >
            Actions
          </DropdownButton>
        );
      },
    },
  ];

  const breadcrumbItems = [
    { label: 'Entities', current: true },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} retry={refetch} />;
  }

  const entities = data?.data?.entities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Entities</h1>
            <p className="text-muted-foreground">
              Manage your data structures and field definitions
            </p>
          </div>
          {canCreateEntity && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => router.push('/entities/new')}
            >
              Create Entity
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TableCellsIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Entities
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {entities.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Entities
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {entities.filter(e => e.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <span className="text-warning font-semibold text-sm">R</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(
                    entities.reduce((sum, entity) => sum + (entity._count?.records || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Entities</CardTitle>
        </CardHeader>
        <CardContent>
          {entities.length === 0 ? (
            <EmptyState
              icon={<TableCellsIcon className="h-12 w-12" />}
              title="No entities yet"
              description="Create your first entity to start organizing your data."
              action={
                canCreateEntity ? (
                  <Button
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    onClick={() => router.push('/entities/new')}
                  >
                    Create Entity
                  </Button>
                ) : null
              }
            />
          ) : (
            <Table
              columns={tableColumns}
              data={entities}
              searchable
              searchPlaceholder="Search entities..."
              pagination={{
                current: 1,
                pageSize: 10,
                total: entities.length,
                onChange: () => {},
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Entity"
        description={
          entityToDelete
            ? `Are you sure you want to delete "${entityToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteEntity}
        loading={deleteEntity.isPending}
      />
    </div>
  );
}
