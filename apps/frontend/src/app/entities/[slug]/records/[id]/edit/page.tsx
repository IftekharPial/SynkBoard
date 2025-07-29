/**
 * Record edit page for SynkBoard
 * Form to edit existing records for a specific entity
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEntity, useRecord, useUpdateRecord } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Form,
  FormActions,
  Breadcrumb,
  PageLoading,
  PageError,
  useForm,
} from '@/components/ui';
import {
  DynamicEntityForm,
  validateDynamicForm,
  prepareFormValuesForSubmission,
} from '@/components/entity';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import type { EntityWithFields, EntityRecord, UpdateRecord } from '@synkboard/types';

interface RecordFormData {
  [key: string]: any;
}

interface RecordEditPageProps {
  params: {
    slug: string;
    id: string;
  };
}

export default function RecordEditPage({ params }: RecordEditPageProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data: entityData, isLoading: entityLoading, error: entityError } = useEntity(params.slug);
  const { data: recordData, isLoading: recordLoading, error: recordError, refetch } = useRecord(params.slug, params.id);
  const updateRecord = useUpdateRecord(params.slug, params.id);

  // Check permissions
  if (!hasPermission('record:update')) {
    router.push(`/entities/${params.slug}/records/${params.id}`);
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

  // Initialize form with current record values
  const initialValues: RecordFormData = { ...record.fields };

  const form = useForm<RecordFormData>(initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const values = form.getValues();

    // Validate form using dynamic validation
    const validation = validateDynamicForm(entity, values);
    if (!validation.isValid) {
      // TODO: Show validation errors
      return;
    }

    try {
      const preparedValues = prepareFormValuesForSubmission(entity, values);
      const recordData: UpdateRecord = {
        fields: preparedValues,
      };

      await updateRecord.mutateAsync(recordData);
      router.push(`/entities/${params.slug}/records/${record.id}`);
    } catch (error) {
      // Error handled by mutation hook
    }
  };



  const breadcrumbItems = [
    { label: 'Entities', href: '/entities' },
    { label: entity.name, href: `/entities/${entity.slug}` },
    { label: 'Records', href: `/entities/${entity.slug}/records` },
    { label: 'View Record', href: `/entities/${entity.slug}/records/${record.id}` },
    { label: 'Edit', current: true },
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
              onClick={() => router.push(`/entities/${params.slug}/records/${record.id}`)}
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
                    Edit {entity.name} Record
                  </h1>
                  <p className="text-muted-foreground">
                    Modify record details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <DynamicEntityForm
              entity={entity}
              values={form.getValues()}
              onChange={(key, value) => form.setValue(key, value)}
              mode="edit"
              icon={<PencilSquareIcon className="h-5 w-5" />}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Record Info */}
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

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: entity.color || '#6366f1' }}
                    >
                      {entity.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {entity.name} Record
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Updated record
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {entity.fields?.slice(0, 5).map((field) => {
                      const value = form.getValues()[field.key];
                      let displayValue = '—';
                      
                      if (value !== null && value !== undefined && value !== '') {
                        switch (field.type) {
                          case 'boolean':
                            displayValue = value ? 'Yes' : 'No';
                            break;
                          case 'rating':
                            displayValue = `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`;
                            break;
                          case 'multiselect':
                            displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                            break;
                          default:
                            displayValue = String(value).length > 30 
                              ? String(value).substring(0, 30) + '...'
                              : String(value);
                        }
                      }

                      return (
                        <div key={field.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{field.name}:</span>
                          <span className="text-foreground font-medium">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                    {entity.fields && entity.fields.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{entity.fields.length - 5} more fields
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/entities/${params.slug}/records/${record.id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={updateRecord.isPending}
          >
            Save Changes
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}
