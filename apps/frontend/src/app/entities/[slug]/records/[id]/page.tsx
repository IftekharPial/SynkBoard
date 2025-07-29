/**
 * Record view page for SynkBoard
 * Read-only page for viewing individual record details
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEntity, useRecord, useDeleteRecord } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  DropdownButton,
  ConfirmDialog,
  PageLoading,
  PageError,
  Breadcrumb,
} from '@/components/ui';
import { DynamicFieldRenderer } from '@/components/entity';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import type { EntityWithFields, EntityRecord } from '@synkboard/types';

interface RecordViewPageProps {
  params: {
    slug: string;
    id: string;
  };
}

export default function RecordViewPage({ params }: RecordViewPageProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data: entityData, isLoading: entityLoading, error: entityError } = useEntity(params.slug);
  const { data: recordData, isLoading: recordLoading, error: recordError, refetch } = useRecord(params.slug, params.id);
  const deleteRecord = useDeleteRecord(params.slug);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const canEditRecords = hasPermission('record:update');
  const canDeleteRecords = hasPermission('record:delete');

  // Check permissions
  if (!hasPermission('entity:view')) {
    router.push('/entities');
    return null;
  }

  if (entityLoading || recordLoading) {
    return <PageLoading />;
  }

  if (entityError) {
    return <PageError error={entityError} retry={() => {}} />;
  }

  if (recordError) {
    return <PageError error={recordError} retry={refetch} />;
  }

  const entity = entityData?.data?.entity as EntityWithFields;
  const record = recordData?.data?.record as EntityRecord;

  if (!entity) {
    return <PageError error={new Error('Entity not found')} retry={() => {}} />;
  }

  if (!record) {
    return <PageError error={new Error('Record not found')} retry={refetch} />;
  }

  const handleDeleteRecord = async () => {
    try {
      await deleteRecord.mutateAsync(record.id);
      setDeleteDialogOpen(false);
      router.push(`/entities/${params.slug}/records`);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };



  const getRecordActions = () => {
    const actions = [];

    if (canEditRecords) {
      actions.push({
        key: 'edit',
        label: 'Edit Record',
        icon: <PencilIcon className="h-4 w-4" />,
        onClick: () => router.push(`/entities/${params.slug}/records/${record.id}/edit`),
      });
    }

    if (canDeleteRecords) {
      if (actions.length > 0) {
        actions.push({
          key: 'separator',
          separator: true,
        });
      }
      actions.push({
        key: 'delete',
        label: 'Delete Record',
        icon: <TrashIcon className="h-4 w-4" />,
        destructive: true,
        onClick: () => setDeleteDialogOpen(true),
      });
    }

    return actions;
  };

  const breadcrumbItems = [
    { label: 'Entities', href: '/entities' },
    { label: entity.name, href: `/entities/${entity.slug}` },
    { label: 'Records', href: `/entities/${entity.slug}/records` },
    { label: 'View Record', current: true },
  ];

  const recordActions = getRecordActions();

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
              onClick={() => router.push(`/entities/${params.slug}/records`)}
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
                  <h1 className="text-2xl font-bold text-foreground">
                    {entity.name} Record
                  </h1>
                  <p className="text-muted-foreground">
                    View record details
                  </p>
                </div>
              </div>
            </div>
          </div>
          {recordActions.length > 0 && (
            <DropdownButton
              items={recordActions}
              variant="outline"
            >
              Actions
            </DropdownButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Record Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5" />
                <span>Record Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {entity.fields?.map((field) => (
                  <div key={field.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-foreground">
                            {field.name}
                          </h3>
                          <Badge variant="outline" size="sm">
                            {field.type}
                          </Badge>
                          {field.is_required && (
                            <Badge variant="secondary" size="sm">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          <DynamicFieldRenderer
                            field={field}
                            value={record.fields[field.key]}
                            mode="view"
                          />
                        </div>
                        {field.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {field.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!entity.fields || entity.fields.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No fields defined for this entity.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Record Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Record ID
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {record.id}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Entity
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: entity.color || '#6366f1' }}
                    >
                      {entity.icon}
                    </div>
                    <span className="text-sm text-foreground">
                      {entity.name}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(record.created_at, 'long')}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(record.updated_at, 'long')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {recordActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {canEditRecords && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<PencilIcon className="h-4 w-4" />}
                      onClick={() => router.push(`/entities/${params.slug}/records/${record.id}/edit`)}
                      className="w-full justify-start"
                    >
                      Edit Record
                    </Button>
                  )}
                  {canDeleteRecords && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      onClick={() => setDeleteDialogOpen(true)}
                      className="w-full justify-start text-destructive hover:text-destructive"
                    >
                      Delete Record
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Record"
        description="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteRecord}
        loading={deleteRecord.isPending}
      />
    </div>
  );
}
