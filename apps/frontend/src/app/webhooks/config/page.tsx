/**
 * Webhook Configuration Page for SynkBoard
 * Configure webhook endpoints and field mappings per entity
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEntities } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormField,
  FormGroup,
  Input,
  Select,
  Textarea,
  Badge,
  PageLoading,
  PageError,
  Breadcrumb,
} from '@/components/ui';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { EntityWithFields, WebhookConfig } from '@synkboard/types';

export default function WebhookConfigPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  // Check permissions
  if (!hasPermission('admin:manage')) {
    router.push('/admin/webhooks');
    return null;
  }

  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [config, setConfig] = useState<Partial<WebhookConfig>>({
    enabled: true,
    field_mappings: [],
    validation_rules: [],
    auto_create_fields: false,
  });

  const { data: entities, isLoading, error } = useEntities();

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  const entityOptions = entities?.data?.entities?.map(entity => ({
    value: entity.id,
    label: entity.name,
  })) || [];

  const selectedEntityData = entities?.data?.entities?.find(
    (e: EntityWithFields) => e.id === selectedEntity
  );

  const addFieldMapping = () => {
    setConfig(prev => ({
      ...prev,
      field_mappings: [
        ...(prev.field_mappings || []),
        {
          source_path: '',
          target_field: '',
          required: false,
        },
      ],
    }));
  };

  const updateFieldMapping = (index: number, updates: any) => {
    setConfig(prev => ({
      ...prev,
      field_mappings: prev.field_mappings?.map((mapping, i) =>
        i === index ? { ...mapping, ...updates } : mapping
      ) || [],
    }));
  };

  const removeFieldMapping = (index: number) => {
    setConfig(prev => ({
      ...prev,
      field_mappings: prev.field_mappings?.filter((_, i) => i !== index) || [],
    }));
  };

  const addValidationRule = () => {
    setConfig(prev => ({
      ...prev,
      validation_rules: [
        ...(prev.validation_rules || []),
        {
          field: '',
          rule: '',
          message: '',
        },
      ],
    }));
  };

  const updateValidationRule = (index: number, updates: any) => {
    setConfig(prev => ({
      ...prev,
      validation_rules: prev.validation_rules?.map((rule, i) =>
        i === index ? { ...rule, ...updates } : rule
      ) || [],
    }));
  };

  const removeValidationRule = (index: number) => {
    setConfig(prev => ({
      ...prev,
      validation_rules: prev.validation_rules?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSave = async () => {
    if (!selectedEntity) return;

    try {
      // TODO: Implement save webhook config API call
      console.log('Saving webhook config:', { entity_id: selectedEntity, ...config });
      // await api.webhooks.saveConfig({ entity_id: selectedEntity, ...config });
      router.push('/admin/webhooks');
    } catch (error) {
      console.error('Failed to save webhook config:', error);
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin', href: '/admin' },
    { label: 'Webhooks', href: '/admin/webhooks' },
    { label: 'Configuration', current: true },
  ];

  const transformOptions = [
    { value: 'lowercase', label: 'Lowercase' },
    { value: 'uppercase', label: 'Uppercase' },
    { value: 'trim', label: 'Trim whitespace' },
    { value: 'parse_date', label: 'Parse as date' },
    { value: 'parse_number', label: 'Parse as number' },
  ];

  const fieldOptions = selectedEntityData?.fields?.map(field => ({
    value: field.key,
    label: `${field.name} (${field.type})`,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/webhooks')}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Webhook Configuration</h1>
            <p className="text-muted-foreground">
              Configure webhook field mappings and validation rules
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!selectedEntity}
          leftIcon={<Cog6ToothIcon className="h-4 w-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <FormGroup>
                <FormField label="Target Entity" required>
                  <Select
                    options={entityOptions}
                    value={selectedEntity}
                    onChange={setSelectedEntity}
                    placeholder="Select an entity"
                  />
                </FormField>

                <FormField label="Webhook Status">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="enabled"
                        checked={config.enabled === true}
                        onChange={() => setConfig(prev => ({ ...prev, enabled: true }))}
                        className="h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <span className="text-sm">Enabled</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="enabled"
                        checked={config.enabled === false}
                        onChange={() => setConfig(prev => ({ ...prev, enabled: false }))}
                        className="h-4 w-4 text-primary focus:ring-primary border-border"
                      />
                      <span className="text-sm">Disabled</span>
                    </label>
                  </div>
                </FormField>

                <FormField label="Auto-create Fields">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.auto_create_fields}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        auto_create_fields: e.target.checked 
                      }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm">
                      Automatically create new fields from webhook payload
                    </span>
                  </label>
                </FormField>
              </FormGroup>
            </CardContent>
          </Card>

          {/* Field Mappings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Field Mappings</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFieldMapping}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Add Mapping
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {config.field_mappings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No field mappings configured.</p>
                  <p className="text-sm">Add mappings to transform webhook data.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {config.field_mappings?.map((mapping, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Mapping {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFieldMapping(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Source Path" required>
                          <Input
                            value={mapping.source_path}
                            onChange={(e) => updateFieldMapping(index, { 
                              source_path: e.target.value 
                            })}
                            placeholder="e.g., data.user.name"
                          />
                        </FormField>

                        <FormField label="Target Field" required>
                          <Select
                            options={fieldOptions}
                            value={mapping.target_field}
                            onChange={(value) => updateFieldMapping(index, { 
                              target_field: value 
                            })}
                            placeholder="Select field"
                          />
                        </FormField>

                        <FormField label="Transform">
                          <Select
                            options={transformOptions}
                            value={mapping.transform || ''}
                            onChange={(value) => updateFieldMapping(index, { 
                              transform: value || undefined 
                            })}
                            placeholder="No transform"
                          />
                        </FormField>

                        <FormField label="Default Value">
                          <Input
                            value={mapping.default_value || ''}
                            onChange={(e) => updateFieldMapping(index, { 
                              default_value: e.target.value || undefined 
                            })}
                            placeholder="Optional default"
                          />
                        </FormField>
                      </div>

                      <div className="mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={mapping.required}
                            onChange={(e) => updateFieldMapping(index, { 
                              required: e.target.checked 
                            })}
                            className="rounded border-border"
                          />
                          <span className="text-sm">Required field</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Entity Fields Reference */}
          {selectedEntityData && (
            <Card>
              <CardHeader>
                <CardTitle>Entity Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedEntityData.fields?.map(field => (
                    <div key={field.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" size="sm">
                          {field.type}
                        </Badge>
                        <span className="font-mono">{field.key}</span>
                      </div>
                      {field.is_required && (
                        <Badge variant="destructive" size="sm">Required</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-foreground">URL:</div>
                  <div className="font-mono bg-muted p-2 rounded text-xs break-all">
                    POST /api/v1/webhooks/ingest
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-foreground">Headers:</div>
                  <div className="font-mono bg-muted p-2 rounded text-xs">
                    Authorization: Bearer YOUR_API_KEY<br />
                    Content-Type: application/json
                  </div>
                </div>

                <div>
                  <div className="font-medium text-foreground">Payload:</div>
                  <div className="font-mono bg-muted p-2 rounded text-xs">
                    {`{
  "entity": "entity-slug",
  "fields": {
    "field1": "value1",
    "field2": "value2"
  }
}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
