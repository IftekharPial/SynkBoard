/**
 * Webhook Management Page for SynkBoard
 * Admin interface for managing webhook configurations and viewing logs
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWebhookLogs, useWebhookStats } from '@/hooks/use-api';
import { usePermissions } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  Input,
  Select,
  DatePicker,
  PageLoading,
  PageError,
  Breadcrumb,
} from '@/components/ui';
import { WebhookTestDialog } from '@/components/admin/webhook-test-dialog';
import {
  GlobeAltIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatNumber } from '@/lib/utils';
import type { WebhookLog } from '@synkboard/types';

export default function WebhookManagementPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  // Check permissions
  if (!hasPermission('audit:view')) {
    router.push('/dashboard');
    return null;
  }

  const [filters, setFilters] = useState({
    entity: '',
    status: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 20,
  });
  const [showTestDialog, setShowTestDialog] = useState(false);

  const { data: webhookLogs, isLoading, error, refetch } = useWebhookLogs(filters);
  const { data: webhookStats } = useWebhookStats();

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when other filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      entity: '',
      status: '',
      start_date: '',
      end_date: '',
      page: 1,
      limit: 20,
    });
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} retry={refetch} />;
  }

  const logs = webhookLogs?.data?.logs || [];
  const pagination = webhookLogs?.data?.pagination;
  const stats = webhookStats?.data?.stats;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin', href: '/admin' },
    { label: 'Webhooks', current: true },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="success" size="sm">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" size="sm">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const generateTableColumns = () => [
    {
      key: 'created_at',
      title: 'Timestamp',
      render: (value: string) => (
        <div className="text-sm">
          <div className="font-medium">{formatDate(value, 'short')}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'entity',
      title: 'Entity',
      render: (value: string) => (
        <Badge variant="outline" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'duration_ms',
      title: 'Duration',
      render: (value: number) => (
        <div className="flex items-center space-x-1 text-sm">
          <ClockIcon className="h-3 w-3 text-muted-foreground" />
          <span>{value}ms</span>
        </div>
      ),
    },
    {
      key: 'source_ip',
      title: 'Source IP',
      render: (value: string) => (
        <span className="font-mono text-sm">{value || '—'}</span>
      ),
    },
    {
      key: 'api_key',
      title: 'API Key',
      render: (value: any, record: WebhookLog) => (
        <span className="text-sm">
          {record.api_key?.name || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'error_code',
      title: 'Error',
      render: (value: string) => (
        value ? (
          <Badge variant="destructive" size="sm">
            {value}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhook Management</h1>
          <p className="text-muted-foreground">
            Monitor webhook ingestion and configure webhook endpoints
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setShowTestDialog(true)}
            leftIcon={<BeakerIcon className="h-4 w-4" />}
          >
            Test Webhook
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <GlobeAltIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(stats.total_requests)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.success_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-warning" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Duration
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.avg_duration_ms.toFixed(0)}ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-8 w-8 text-destructive" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Failed Today
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(stats.failed_today)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search entity..."
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />

            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'success', label: 'Success' },
                { value: 'failed', label: 'Failed' },
              ]}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Status"
            />

            <DatePicker
              value={filters.start_date}
              onChange={(value) => handleFilterChange('start_date', value)}
              placeholder="Start date"
            />

            <DatePicker
              value={filters.end_date}
              onChange={(value) => handleFilterChange('end_date', value)}
              placeholder="End date"
            />

            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={generateTableColumns()}
            data={logs}
            pagination={pagination ? {
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: (page, pageSize) => {
                handleFilterChange('page', page);
                handleFilterChange('limit', pageSize);
              },
            } : undefined}
          />
        </CardContent>
      </Card>

      {/* Test Dialog */}
      {showTestDialog && (
        <WebhookTestDialog
          onClose={() => setShowTestDialog(false)}
          onSuccess={() => {
            setShowTestDialog(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
