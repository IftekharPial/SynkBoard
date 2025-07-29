/**
 * Entity editing page for SynkBoard
 * Modify existing entities with field management
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEntity, useUpdateEntity, useEntityFields } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Form,
  FormField,
  FormGroup,
  FormActions,
  Input,
  Select,
  Badge,
  Breadcrumb,
  PageLoading,
  PageError,
  useForm,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { EntityWithFields, UpdateEntity, CreateEntityField, FieldType } from '@synkboard/types';

interface EntityEditFormData {
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
}

const ENTITY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
];

const ENTITY_ICONS = ['📊', '👥', '📝', '🏢', '💼', '🎯', '📈', '🔧', '⚙️', '📋'];

interface EntityEditPageProps {
  params: {
    slug: string;
  };
}

export default function EntityEditPage({ params }: EntityEditPageProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data: entityData, isLoading, error, refetch } = useEntity(params.slug);
  const { data: fieldsData } = useEntityFields(params.slug);
  const updateEntity = useUpdateEntity(params.slug);

  const [warningDialogOpen, setWarningDialogOpen] = React.useState(false);
  const [pendingChanges, setPendingChanges] = React.useState<UpdateEntity | null>(null);

  // Check permissions
  if (!hasPermission('entity:editSchema')) {
    router.push('/entities');
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

  const form = useForm<EntityEditFormData>({
    name: entity.name,
    icon: entity.icon || '📊',
    color: entity.color || '#6366f1',
    is_active: entity.is_active,
  }, {
    name: { required: true, minLength: 1 },
  });

  const hasRecords = (entity._count?.records || 0) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.validateAll()) {
      return;
    }

    const values = form.getValues();
    const changes: UpdateEntity = {};

    // Only include changed fields
    if (values.name !== entity.name) changes.name = values.name;
    if (values.icon !== entity.icon) changes.icon = values.icon;
    if (values.color !== entity.color) changes.color = values.color;
    if (values.is_active !== entity.is_active) changes.is_active = values.is_active;

    // If no changes, return early
    if (Object.keys(changes).length === 0) {
      router.push('/entities');
      return;
    }

    // If entity has records and we're making significant changes, show warning
    if (hasRecords && (changes.name || changes.is_active === false)) {
      setPendingChanges(changes);
      setWarningDialogOpen(true);
      return;
    }

    try {
      await updateEntity.mutateAsync(changes);
      router.push('/entities');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleConfirmChanges = async () => {
    if (!pendingChanges) return;

    try {
      await updateEntity.mutateAsync(pendingChanges);
      setWarningDialogOpen(false);
      setPendingChanges(null);
      router.push('/entities');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const breadcrumbItems = [
    { label: 'Entities', href: '/entities' },
    { label: entity.name, href: `/entities/${entity.slug}` },
    { label: 'Edit', current: true },
  ];

  const formValues = form.getValues();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Entity</h1>
            <p className="text-muted-foreground">
              Modify entity settings and field definitions
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => router.push('/entities')}
          >
            Back to Entities
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {hasRecords && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-warning">
                  Entity Contains Data
                </h3>
                <p className="text-sm text-warning/80 mt-1">
                  This entity has {entity._count?.records} records. Some changes may affect existing data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormGroup>
                  <FormField label="Entity Name" required>
                    <Input
                      {...form.getFieldProps('name')}
                      placeholder="e.g., Customers, Products, Orders"
                    />
                  </FormField>

                  <FormField label="URL Slug" description="Cannot be changed after creation">
                    <Input
                      value={entity.slug}
                      disabled
                      className="bg-muted"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Icon">
                      <Select
                        options={ENTITY_ICONS.map(icon => ({ value: icon, label: `${icon} ${icon}` }))}
                        value={formValues.icon}
                        onChange={(value) => form.setValue('icon', value as string)}
                      />
                    </FormField>

                    <FormField label="Color">
                      <div className="flex flex-wrap gap-2">
                        {ENTITY_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => form.setValue('color', color)}
                            className={`w-8 h-8 rounded-lg border-2 ${
                              formValues.color === color ? 'border-foreground' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </FormField>
                  </div>

                  <FormField label="Status">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formValues.is_active}
                        onChange={(e) => form.setValue('is_active', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="is_active" className="text-sm text-foreground">
                        Entity is active
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inactive entities are hidden from most views but data is preserved
                    </p>
                  </FormField>
                </FormGroup>
              </CardContent>
            </Card>

            {/* Fields Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fields</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Field management is coming soon. For now, fields can only be managed during entity creation.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    disabled
                  >
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entity.fields?.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{field.type}</Badge>
                        <div>
                          <p className="font-medium text-foreground">{field.name}</p>
                          <p className="text-sm text-muted-foreground">{field.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {field.is_required && (
                          <Badge variant="secondary" size="sm">Required</Badge>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!entity.fields || entity.fields.length === 0) && (
                    <p className="text-center py-8 text-muted-foreground">
                      No fields defined for this entity.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: formValues.color }}
                    >
                      {formValues.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {formValues.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        /{entity.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={formValues.is_active ? 'default' : 'secondary'}>
                      {formValues.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {entity.fields?.length || 0} fields
                    </Badge>
                    <Badge variant="outline">
                      {entity._count?.records || 0} records
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Fields</h4>
                    <div className="space-y-1">
                      {entity.fields?.map((field) => (
                        <div key={field.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{field.name}</span>
                          <Badge variant="outline" size="sm">
                            {field.type}
                          </Badge>
                        </div>
                      ))}
                      {(!entity.fields || entity.fields.length === 0) && (
                        <p className="text-xs text-muted-foreground">No fields defined</p>
                      )}
                    </div>
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
            onClick={() => router.push('/entities')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={updateEntity.isPending}
          >
            Save Changes
          </Button>
        </FormActions>
      </Form>

      {/* Warning Dialog */}
      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning" />
              <span>Confirm Changes</span>
            </DialogTitle>
            <DialogDescription>
              This entity contains {entity._count?.records} records. The changes you're making may affect existing data:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {pendingChanges?.name && (
                  <li>Changing entity name from "{entity.name}" to "{pendingChanges.name}"</li>
                )}
                {pendingChanges?.is_active === false && (
                  <li>Deactivating entity (will hide from most views)</li>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWarningDialogOpen(false);
                setPendingChanges(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmChanges}
              loading={updateEntity.isPending}
            >
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
