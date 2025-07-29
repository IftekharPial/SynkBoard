/**
 * Entity records listing page for SynkBoard
 * Display and manage records for a specific entity
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEntity, useRecords, useDeleteRecord } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  PageLoading,
  PageError,
  EmptyState,
  Breadcrumb,
} from '@/components/ui';
import { DynamicEntityTable, generateEntityStats } from '@/components/entity';
import {
  PlusIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { formatNumber } from '@/lib/utils';
import type { EntityWithFields, EntityRecord } from '@synkboard/types';

interface EntityRecordsPageProps {
  params: {
    slug: string;
  };
}

export default function EntityRecordsPage({ params }: EntityRecordsPageProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data: entityData, isLoading: entityLoading, error: entityError } = useEntity(params.slug);
  const { data: recordsData, isLoading: recordsLoading, error: recordsError, refetch } = useRecords(params.slug);
  const deleteRecord = useDeleteRecord(params.slug);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [recordToDelete, setRecordToDelete] = React.useState<EntityRecord | null>(null);

  const canViewRecords = hasPermission('entity:view');
  const canCreateRecords = hasPermission('record:create');
  const canEditRecords = hasPermission('record:update');
  const canDeleteRecords = hasPermission('record:delete');

  // Check permissions
  if (!canViewRecords) {
    router.push('/entities');
    return null;
  }

  if (entityLoading || recordsLoading) {
    return <PageLoading />;
  }

  if (entityError) {
    return <PageError error={entityError} retry={() => {}} />;
  }

  if (recordsError) {
    return <PageError error={recordsError} retry={refetch} />;
  }

  const entity = entityData?.data?.entity as EntityWithFields;
  const records = recordsData?.data?.records || [];

  if (!entity) {
    return <PageError error={new Error('Entity not found')} retry={() => {}} />;
  }

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;

    try {
      await deleteRecord.mutateAsync(recordToDelete.id);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const getRecordActions = () => {
    const actions = [];

    actions.push({
      key: 'view',
      label: 'View Record',
      icon: <EyeIcon className="h-4 w-4" />,
      onClick: (record: EntityRecord) => router.push(`/entities/${params.slug}/records/${record.id}`),
    });

    if (canEditRecords) {
      actions.push({
        key: 'edit',
        label: 'Edit Record',
        icon: <PencilIcon className="h-4 w-4" />,
        onClick: (record: EntityRecord) => router.push(`/entities/${params.slug}/records/${record.id}/edit`),
      });
    }

    if (canDeleteRecords) {
      actions.push({
        key: 'separator',
        separator: true,
      });
      actions.push({
        key: 'delete',
        label: 'Delete Record',
        icon: <TrashIcon className="h-4 w-4" />,
        destructive: true,
        onClick: (record: EntityRecord) => {
          setRecordToDelete(record);
          setDeleteDialogOpen(true);
        },
      });
    }

    return actions;
  };

  const recordActions = getRecordActions();
  const entityStats = generateEntityStats(entity, records);

  const breadcrumbItems = [
    { label: 'Entities', href: '/entities' },
    { label: entity.name, href: `/entities/${entity.slug}` },
    { label: 'Records', current: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={() => router.push('/entities')}
            >
              Back
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: entity.color || '#6366f1' }}
                >
                  {entity.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{entity.name} Records</h1>
                  <p className="text-muted-foreground">
                    Manage data records for this entity
                  </p>
                </div>
              </div>
            </div>
          </div>
          {canCreateRecords && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => router.push(`/entities/${params.slug}/records/new`)}
            >
              Add Record
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {entityStats.slice(0, 3).map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records Table */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12" />}
              title="No records yet"
              description={`Start adding data to your ${entity.name} entity.`}
              action={
                canCreateRecords ? (
                  <Button
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    onClick={() => router.push(`/entities/${params.slug}/records/new`)}
                  >
                    Add First Record
                  </Button>
                ) : null
              }
            />
          </CardContent>
        </Card>
      ) : (
        <DynamicEntityTable
          entity={entity}
          records={records}
          actions={recordActions}
          searchPlaceholder={`Search ${entity.name.toLowerCase()}...`}
          pagination={{
            current: 1,
            pageSize: 10,
            total: records.length,
            onChange: () => {},
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Record"
        description={
          recordToDelete
            ? `Are you sure you want to delete this record? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteRecord}
        loading={deleteRecord.isPending}
      />
    </div>
  );
}
