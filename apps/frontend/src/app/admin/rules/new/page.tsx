/**
 * Rule Creation Page for SynkBoard
 * Create new automation rules with condition builder and action configuration
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEntities, useCreateRule } from '@/hooks/use-api';
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
  Textarea,
  Breadcrumb,
  PageLoading,
  PageError,
  useForm,
} from '@/components/ui';
import { RuleConditionBuilder } from '@/components/admin/rule-condition-builder';
import { RuleActionBuilder } from '@/components/admin/rule-action-builder';
import { RuleTestDialog } from '@/components/admin/rule-test-dialog';
import {
  ArrowLeftIcon,
  PlusIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import type { CreateRule, RuleCondition, RuleAction } from '@synkboard/types';

interface RuleFormData {
  name: string;
  entity_id: string;
  run_on: 'create' | 'update' | 'both';
  is_active: boolean;
}

export default function RuleCreatePage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  // Check permissions
  if (!hasPermission('rule:edit')) {
    router.push('/admin/rules');
    return null;
  }

  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const { data: entities, isLoading: entitiesLoading, error: entitiesError } = useEntities();
  const createRule = useCreateRule();

  const form = useForm<RuleFormData>({
    name: '',
    entity_id: '',
    run_on: 'both',
    is_active: true,
  });

  const formValues = form.getValues();

  if (entitiesLoading) {
    return <PageLoading />;
  }

  if (entitiesError) {
    return <PageError error={entitiesError} />;
  }

  const entityOptions = entities?.data?.entities?.map(entity => ({
    value: entity.id,
    label: entity.name,
  })) || [];

  const selectedEntity = entities?.data?.entities?.find(e => e.id === formValues.entity_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.validateAll()) {
      return;
    }

    if (conditions.length === 0) {
      // TODO: Show error toast
      return;
    }

    if (actions.length === 0) {
      // TODO: Show error toast
      return;
    }

    const values = form.getValues();
    
    try {
      const ruleData: CreateRule = {
        name: values.name,
        entity_id: values.entity_id,
        conditions,
        actions,
        run_on: values.run_on,
        is_active: values.is_active,
      };

      await createRule.mutateAsync(ruleData);
      router.push('/admin/rules');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleTest = () => {
    if (conditions.length === 0 || actions.length === 0) {
      // TODO: Show error toast
      return;
    }
    setShowTestDialog(true);
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin', href: '/admin' },
    { label: 'Rules', href: '/admin/rules' },
    { label: 'Create Rule', current: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/rules')}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Rule</h1>
            <p className="text-muted-foreground">
              Create a new automation rule for your entities
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleTest}
          disabled={conditions.length === 0 || actions.length === 0}
          leftIcon={<BeakerIcon className="h-4 w-4" />}
        >
          Test Rule
        </Button>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Form */}
      <Form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PlusIcon className="h-5 w-5" />
                  <span>Rule Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormGroup>
                  <FormField
                    label="Rule Name"
                    required
                    error={form.formState.name?.error}
                  >
                    <Input
                      value={formValues.name}
                      onChange={(e) => form.setValue('name', e.target.value)}
                      placeholder="e.g., High Priority Alert, Auto-tag VIP Customers"
                      error={!!form.formState.name?.error}
                    />
                  </FormField>

                  <FormField
                    label="Target Entity"
                    required
                    error={form.formState.entity_id?.error}
                  >
                    <Select
                      options={entityOptions}
                      value={formValues.entity_id}
                      onChange={(value) => form.setValue('entity_id', value)}
                      placeholder="Select an entity"
                      error={!!form.formState.entity_id?.error}
                    />
                  </FormField>

                  <FormField
                    label="Run On"
                    description="When should this rule be triggered?"
                  >
                    <Select
                      options={[
                        { value: 'create', label: 'Record Creation' },
                        { value: 'update', label: 'Record Update' },
                        { value: 'both', label: 'Both Create & Update' },
                      ]}
                      value={formValues.run_on}
                      onChange={(value) => form.setValue('run_on', value as any)}
                    />
                  </FormField>

                  <FormField label="Status">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="is_active"
                          checked={formValues.is_active === true}
                          onChange={() => form.setValue('is_active', true)}
                          className="h-4 w-4 text-primary focus:ring-primary border-border"
                        />
                        <span className="text-sm">Active</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="is_active"
                          checked={formValues.is_active === false}
                          onChange={() => form.setValue('is_active', false)}
                          className="h-4 w-4 text-primary focus:ring-primary border-border"
                        />
                        <span className="text-sm">Inactive</span>
                      </label>
                    </div>
                  </FormField>
                </FormGroup>
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <RuleConditionBuilder
                  entity={selectedEntity}
                  conditions={conditions}
                  onChange={setConditions}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <RuleActionBuilder
                  entity={selectedEntity}
                  actions={actions}
                  onChange={setActions}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      formValues.name && formValues.entity_id 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      1
                    </div>
                    <div className={formValues.name && formValues.entity_id ? 'text-foreground' : 'text-muted-foreground'}>
                      Basic Details
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      conditions.length > 0 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      2
                    </div>
                    <div className={conditions.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                      Conditions ({conditions.length})
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      actions.length > 0 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      3
                    </div>
                    <div className={actions.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                      Actions ({actions.length})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Entity Fields Reference */}
            {selectedEntity && (
              <Card>
                <CardHeader>
                  <CardTitle>Entity Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedEntity.fields?.map(field => (
                      <div key={field.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs bg-muted px-1 rounded">
                            {field.type}
                          </span>
                          <span>{field.name}</span>
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          {field.key}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/rules')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createRule.isPending}
            disabled={!formValues.name || !formValues.entity_id || conditions.length === 0 || actions.length === 0}
          >
            Create Rule
          </Button>
        </FormActions>
      </Form>

      {/* Test Dialog */}
      {showTestDialog && selectedEntity && (
        <RuleTestDialog
          entity={selectedEntity}
          conditions={conditions}
          actions={actions}
          onClose={() => setShowTestDialog(false)}
        />
      )}
    </div>
  );
}
