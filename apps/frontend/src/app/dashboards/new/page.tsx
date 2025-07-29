/**
 * Dashboard creation page for SynkBoard
 * Create new dashboards with proper form validation and RBAC
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDashboard } from '@/hooks/use-api';
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
  Textarea,
  Breadcrumb,
  useForm,
} from '@/components/ui';
import {
  ArrowLeftIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { generateSlug } from '@/lib/utils';
import type { CreateDashboard } from '@synkboard/types';

interface DashboardFormData {
  name: string;
  slug: string;
  description: string;
  is_public: boolean;
}

export default function DashboardCreatePage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const createDashboard = useCreateDashboard();

  // Check permissions and redirect if needed
  useEffect(() => {
    if (!hasPermission('dashboard:create')) {
      router.push('/dashboard');
    }
  }, [hasPermission, router]);

  // Don't render if no permission
  if (!hasPermission('dashboard:create')) {
    return null;
  }

  const form = useForm<DashboardFormData>({
    name: '',
    slug: '',
    description: '',
    is_public: false,
  });

  const formValues = form.getValues();

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
    
    try {
      const dashboardData: CreateDashboard = {
        name: values.name,
        slug: values.slug,
        is_public: values.is_public,
      };

      const result = await createDashboard.mutateAsync(dashboardData);
      router.push(`/dashboards/${result.data.dashboard.slug}`);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Create Dashboard', current: true },
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
            <h1 className="text-2xl font-bold text-foreground">Create Dashboard</h1>
            <p className="text-muted-foreground">
              Create a new dashboard to visualize your data
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Form */}
      <Form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PlusIcon className="h-5 w-5" />
                  <span>Dashboard Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormGroup>
                  <FormField
                    label="Dashboard Name"
                    required
                    error={form.formState.name?.error}
                  >
                    <Input
                      value={formValues.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Sales Analytics, Support Metrics"
                      error={!!form.formState.name?.error}
                    />
                  </FormField>

                  <FormField
                    label="URL Slug"
                    required
                    description="Used in the dashboard URL. Must be unique."
                    error={form.formState.slug?.error}
                  >
                    <Input
                      value={formValues.slug}
                      onChange={(e) => form.setValue('slug', e.target.value)}
                      placeholder="e.g., sales-analytics, support-metrics"
                      error={!!form.formState.slug?.error}
                    />
                  </FormField>

                  <FormField
                    label="Description"
                    description="Optional description of what this dashboard shows"
                  >
                    <Textarea
                      value={formValues.description}
                      onChange={(e) => form.setValue('description', e.target.value)}
                      placeholder="Describe what this dashboard is for..."
                      rows={3}
                    />
                  </FormField>

                  <FormField label="Visibility">
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="visibility"
                          checked={!formValues.is_public}
                          onChange={() => form.setValue('is_public', false)}
                          className="h-4 w-4 text-primary focus:ring-primary border-border"
                        />
                        <div>
                          <div className="text-sm font-medium text-foreground">Private</div>
                          <div className="text-xs text-muted-foreground">
                            Only you and users with access can view this dashboard
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="visibility"
                          checked={formValues.is_public}
                          onChange={() => form.setValue('is_public', true)}
                          className="h-4 w-4 text-primary focus:ring-primary border-border"
                        />
                        <div>
                          <div className="text-sm font-medium text-foreground">Public</div>
                          <div className="text-xs text-muted-foreground">
                            Anyone with the link can view this dashboard
                          </div>
                        </div>
                      </label>
                    </div>
                  </FormField>
                </FormGroup>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-medium">Create Dashboard</div>
                      <div className="text-muted-foreground">Set up basic dashboard information</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Add Widgets</div>
                      <div className="text-muted-foreground">Create charts, KPIs, and tables</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Arrange Layout</div>
                      <div className="text-muted-foreground">Drag and drop to organize</div>
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
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createDashboard.isPending}
            disabled={!formValues.name || !formValues.slug}
          >
            Create Dashboard
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}
