/**
 * Record creation page for SynkBoard
 * Form to create new records for a specific entity
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEntity, useCreateRecord } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Form,
  FormActions,
  Breadcrumb,
  PageLoading,
  PageError,
  useForm,
} from '@/components/ui';
import {
  DynamicEntityForm,
  getInitialFormValues,
  validateDynamicForm,
  prepareFormValuesForSubmission,
} from '@/components/entity';
import {
  ArrowLeftIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import type { EntityWithFields, CreateRecord } from '@synkboard/types';

interface RecordFormData {
  [key: string]: any;
}

interface RecordCreatePageProps {
  params: {
    slug: string;
  };
}

export default function RecordCreatePage({ params }: RecordCreatePageProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data: entityData, isLoading, error, refetch } = useEntity(params.slug);
  const createRecord = useCreateRecord(params.slug);

  // Check permissions
  if (!hasPermission('record:create')) {
    router.push(`/entities/${params.slug}/records`);
    return null;
  }

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} retry={refetch} />;
  }

  const entity = entityData?.data?.entity as EntityWithFields;
  if (!entity) {
    return <PageError error={new Error('Entity not found')} retry={refetch} />;
  }

  // Initialize form with default values based on field types
  const initialValues = getInitialFormValues(entity);
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
      const recordData: CreateRecord = {
        fields: preparedValues,
      };

      await createRecord.mutateAsync(recordData);
      router.push(`/entities/${params.slug}/records`);
    } catch (error) {
      // Error handled by mutation hook
    }
  };



  const breadcrumbItems = [
    { label: 'Entities', href: '/entities' },
    { label: entity.name, href: `/entities/${entity.slug}` },
    { label: 'Records', href: `/entities/${entity.slug}/records` },
    { label: 'New Record', current: true },
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
                    New {entity.name} Record
                  </h1>
                  <p className="text-muted-foreground">
                    Add a new record to the {entity.name} entity
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
              mode="create"
              icon={<DocumentPlusIcon className="h-5 w-5" />}
            />
          </div>

          {/* Preview */}
          <div>
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
                        New record
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
            onClick={() => router.push(`/entities/${params.slug}/records`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createRecord.isPending}
            disabled={!entity.fields || entity.fields.length === 0}
          >
            Create Record
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}
