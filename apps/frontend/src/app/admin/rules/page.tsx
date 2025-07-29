/**
 * Rule Management Page for SynkBoard
 * Admin interface for managing automation rules and viewing execution logs
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRules, useDeleteRule } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  DropdownButton,
  ConfirmDialog,
  PageLoading,
  PageError,
  Breadcrumb,
} from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import type { Rule } from '@synkboard/types';

export default function RuleManagementPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  // Check permissions
  if (!hasPermission('rule:edit')) {
    router.push('/dashboard');
    return null;
  }

  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: rules, isLoading, error, refetch } = useRules();
  const deleteRule = useDeleteRule();

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;

    try {
      await deleteRule.mutateAsync(ruleToDelete.id);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const getRuleActions = (rule: Rule) => {
    const actions = [];

    actions.push({
      key: 'view',
      label: 'View Rule',
      icon: <EyeIcon className="h-4 w-4" />,
      onClick: () => router.push(`/admin/rules/${rule.id}`),
    });

    actions.push({
      key: 'edit',
      label: 'Edit Rule',
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: () => router.push(`/admin/rules/${rule.id}/edit`),
    });

    actions.push({
      key: 'logs',
      label: 'View Logs',
      icon: <ChartBarIcon className="h-4 w-4" />,
      onClick: () => router.push(`/admin/rules/logs?rule_id=${rule.id}`),
    });

    actions.push({
      key: 'separator',
      separator: true,
    });

    actions.push({
      key: 'delete',
      label: 'Delete Rule',
      icon: <TrashIcon className="h-4 w-4" />,
      destructive: true,
      onClick: () => {
        setRuleToDelete(rule);
        setDeleteDialogOpen(true);
      },
    });

    return actions;
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} retry={refetch} />;
  }

  const rulesList = rules?.data?.rules || [];

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin', href: '/admin' },
    { label: 'Rules', current: true },
  ];

  const getStatusBadge = (rule: Rule) => {
    if (rule.is_active) {
      return (
        <Badge variant="success" size="sm">
          <PlayIcon className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" size="sm">
          <PauseIcon className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    }
  };

  const getRunOnBadge = (runOn: string) => {
    const variants = {
      create: 'success',
      update: 'warning',
      both: 'primary',
    } as const;

    return (
      <Badge variant={variants[runOn as keyof typeof variants] || 'secondary'} size="sm">
        {runOn === 'both' ? 'Create & Update' : runOn.charAt(0).toUpperCase() + runOn.slice(1)}
      </Badge>
    );
  };

  const generateTableColumns = () => [
    {
      key: 'name',
      title: 'Rule Name',
      render: (value: string, record: Rule) => (
        <div>
          <div className="font-medium text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">
            {record.entity?.name || 'Unknown Entity'}
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (value: boolean, record: Rule) => getStatusBadge(record),
    },
    {
      key: 'run_on',
      title: 'Trigger',
      render: (value: string) => getRunOnBadge(value),
    },
    {
      key: 'conditions',
      title: 'Conditions',
      render: (value: any[]) => (
        <Badge variant="outline" size="sm">
          {value?.length || 0} conditions
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any[]) => (
        <Badge variant="outline" size="sm">
          {value?.length || 0} actions
        </Badge>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (value: string) => (
        <div className="text-sm">
          <div>{formatDate(value, 'short')}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'actions_menu',
      title: 'Actions',
      render: (value: any, record: Rule) => (
        <DropdownButton
          items={getRuleActions(record)}
          variant="ghost"
          size="sm"
        >
          Actions
        </DropdownButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rule Management</h1>
          <p className="text-muted-foreground">
            Create and manage automation rules for your entities
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/rules/logs')}
            leftIcon={<ChartBarIcon className="h-4 w-4" />}
          >
            View Logs
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => router.push('/admin/rules/new')}
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            Create Rule
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-8 w-8 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Rules
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {rulesList.filter(r => r.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PauseIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Inactive Rules
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {rulesList.filter(r => !r.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Rules
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {rulesList.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-8 w-8 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Auto-trigger
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {rulesList.filter(r => r.run_on === 'both').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rulesList.length === 0 ? (
            <div className="text-center py-12">
              <PlayIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No rules created yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating your first automation rule.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push('/admin/rules/new')}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Create First Rule
                </Button>
              </div>
            </div>
          ) : (
            <Table
              columns={generateTableColumns()}
              data={rulesList}
              searchable
              searchPlaceholder="Search rules..."
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteRule}
        title="Delete Rule"
        description={`Are you sure you want to delete "${ruleToDelete?.name}"? This action cannot be undone and will stop all automation for this rule.`}
        confirmText="Delete Rule"
        destructive
      />
    </div>
  );
}
