/**
 * Entity creation page for SynkBoard
 * Form to create new entities with dynamic field definitions
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCreateEntity } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Badge,
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
  Breadcrumb,
  useForm,
} from '@/components/ui';
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { FieldBuilder, validateFields } from '@/components/entity';
import { generateSlug } from '@/lib/utils';
import type { CreateEntity, CreateEntityField } from '@synkboard/types';

interface EntityFormData {
  name: string;
  slug: string;
  icon: string;
  color: string;
  fields: CreateEntityField[];
}

const ENTITY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
];

const ENTITY_ICONS = ['📊', '👥', '📝', '🏢', '💼', '🎯', '📈', '🔧', '⚙️', '📋'];

export default function NewEntityPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const createEntity = useCreateEntity();

  const form = useForm<EntityFormData>({
    name: '',
    slug: '',
    icon: '📊',
    color: '#6366f1',
    fields: [],
  }, {
    name: { required: true, minLength: 1 },
    slug: { required: true, minLength: 1, pattern: /^[a-z0-9-]+$/ },
  });

  // Check permissions
  if (!hasPermission('entity:editSchema')) {
    router.push('/entities');
    return null;
  }

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    if (!form.formState.slug?.touched) {
      form.setValue('slug', generateSlug(name), false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.validateAll()) {
      return;
    }

    const values = form.getValues();

    // Validate fields using the field builder validator
    const fieldValidation = validateFields(values.fields);
    if (!fieldValidation.isValid) {
      // TODO: Show error toast with fieldValidation.errors
      return;
    }

    if (values.fields.length === 0) {
      // TODO: Show error toast
      return;
    }

    try {
      const entityData: CreateEntity & { fields: CreateEntityField[] } = {
        name: values.name,
        slug: values.slug,
        icon: values.icon,
        color: values.color,
        fields: values.fields,
      };

      await createEntity.mutateAsync(entityData);
      router.push('/entities');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const breadcrumbItems = [
    { label: 'Entities', href: '/entities' },
    { label: 'Create Entity', current: true },
  ];

  const formValues = form.getValues();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Entity</h1>
            <p className="text-muted-foreground">
              Define a new data structure with custom fields
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
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Customers, Products, Orders"
                    />
                  </FormField>

                  <FormField label="URL Slug" required>
                    <Input
                      {...form.getFieldProps('slug')}
                      placeholder="e.g., customers, products, orders"
                      helperText="Used in URLs and API endpoints"
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
                </FormGroup>
              </CardContent>
            </Card>

            {/* Fields Definition */}
            <FieldBuilder
              fields={formValues.fields}
              onChange={(fields) => form.setValue('fields', fields)}
            />
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
                        {formValues.name || 'Entity Name'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        /{formValues.slug || 'entity-slug'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Fields</h4>
                    <div className="space-y-1">
                      {formValues.fields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">
                            {field.name || `Field ${index + 1}`}
                          </span>
                          <Badge variant="outline" size="sm">
                            {field.type}
                          </Badge>
                        </div>
                      ))}
                      {formValues.fields.length === 0 && (
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
            loading={createEntity.isPending}
            disabled={!formValues.name || !formValues.slug || formValues.fields.length === 0}
          >
            Create Entity
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}


