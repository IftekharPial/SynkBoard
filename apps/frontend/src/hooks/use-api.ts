/**
 * API hooks for SynkBoard frontend
 * Provides React Query integration with API service
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

// Query keys factory
export const queryKeys = {
  // Auth
  me: ['auth', 'me'] as const,
  
  // Entities
  entities: ['entities'] as const,
  entity: (slug: string) => ['entities', slug] as const,
  entityFields: (slug: string) => ['entities', slug, 'fields'] as const,
  
  // Records
  records: (entitySlug: string, params?: any) => ['records', entitySlug, params] as const,
  record: (entitySlug: string, id: string) => ['records', entitySlug, id] as const,
  
  // Dashboards
  dashboards: (params?: any) => ['dashboards', params] as const,
  dashboard: (slug: string, isPublic?: boolean) => ['dashboards', slug, { public: isPublic }] as const,
  
  // Widgets
  widgets: (params?: any) => ['widgets', params] as const,
  widget: (id: string) => ['widgets', id] as const,
  widgetData: (id: string, params?: any) => ['widgets', id, 'data', params] as const,
  
  // Rules
  rules: ['rules'] as const,
  rule: (id: string) => ['rules', id] as const,
  ruleLogs: (params?: any) => ['rules', 'logs', params] as const,
  
  // Webhooks
  webhookLogs: (params?: any) => ['webhooks', 'logs', params] as const,
  webhookStats: ['webhooks', 'stats'] as const,

  // Rules
  rules: ['rules'] as const,
  rule: (id: string) => ['rules', id] as const,
  ruleLogs: (params?: any) => ['rules', 'logs', params] as const,
};

// Generic API hook with error handling
function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && (options?.enabled ?? true),
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onError: (error) => {
      // Show error toast
      toast.error(error.message || 'An error occurred');
      options?.onError?.(error, {} as TVariables, undefined);
    },
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

// Entity hooks
export function useEntities() {
  return useApiQuery(
    queryKeys.entities,
    () => api.entities.list()
  );
}

export function useEntity(slug: string) {
  return useApiQuery(
    queryKeys.entity(slug),
    () => api.entities.get(slug),
    { enabled: !!slug }
  );
}

export function useEntityFields(slug: string) {
  return useApiQuery(
    queryKeys.entityFields(slug),
    () => api.entities.getFields(slug),
    { enabled: !!slug }
  );
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: any) => api.entities.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entities });
        toast.success('Entity created successfully');
      },
    }
  );
}

export function useUpdateEntity(slug: string) {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: any) => api.entities.update(slug, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entities });
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(slug) });
        toast.success('Entity updated successfully');
      },
    }
  );
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (slug: string) => api.entities.delete(slug),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entities });
        toast.success('Entity deleted successfully');
      },
    }
  );
}

// Record hooks
export function useRecords(entitySlug: string, params?: any) {
  return useApiQuery(
    queryKeys.records(entitySlug, params),
    () => api.records.list(entitySlug, params),
    { enabled: !!entitySlug }
  );
}

export function useRecord(entitySlug: string, id: string) {
  return useApiQuery(
    queryKeys.record(entitySlug, id),
    () => api.records.get(entitySlug, id),
    { enabled: !!entitySlug && !!id }
  );
}

export function useCreateRecord(entitySlug: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data: any) => api.records.create(entitySlug, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.records(entitySlug) });
        queryClient.invalidateQueries({ queryKey: queryKeys.entities }); // Update entity record counts
        toast.success('Record created successfully');
      },
    }
  );
}

export function useUpdateRecord(entitySlug: string, id: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data: any) => api.records.update(entitySlug, id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.records(entitySlug) });
        queryClient.invalidateQueries({ queryKey: queryKeys.record(entitySlug, id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.entities }); // Update entity record counts
        toast.success('Record updated successfully');
      },
    }
  );
}

export function useDeleteRecord(entitySlug: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    (id: string) => api.records.delete(entitySlug, id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.records(entitySlug) });
        queryClient.invalidateQueries({ queryKey: queryKeys.entities }); // Update entity record counts
        toast.success('Record deleted successfully');
      },
    }
  );
}

// Dashboard hooks
export function useDashboards(params?: any) {
  return useApiQuery(
    queryKeys.dashboards(params),
    () => api.dashboards.list(params)
  );
}

export function useDashboard(slug: string, isPublic?: boolean) {
  return useApiQuery(
    queryKeys.dashboard(slug, isPublic),
    () => api.dashboards.get(slug, isPublic),
    { enabled: !!slug }
  );
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: any) => api.dashboards.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboards() });
        toast.success('Dashboard created successfully');
      },
    }
  );
}

export function useUpdateDashboard(slug: string) {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: any) => api.dashboards.update(slug, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboards() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(slug) });
        toast.success('Dashboard updated successfully');
      },
    }
  );
}

// Widget hooks
export function useWidgets(params?: any) {
  return useApiQuery(
    queryKeys.widgets(params),
    () => api.widgets.list(params)
  );
}

export function useWidget(id: string) {
  return useApiQuery(
    queryKeys.widget(id),
    () => api.widgets.get(id),
    { enabled: !!id }
  );
}

export function useWidgetData(id: string, params?: any) {
  return useApiQuery(
    queryKeys.widgetData(id, params),
    () => api.widgets.getData(id, params),
    { 
      enabled: !!id,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );
}

export function useCreateWidget() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: any) => api.widgets.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.widgets() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboards() });
        toast.success('Widget created successfully');
      },
    }
  );
}

export function useUpdateWidget(id: string) {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: any) => api.widgets.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.widgets() });
        queryClient.invalidateQueries({ queryKey: queryKeys.widget(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.widgetData(id) });
        toast.success('Widget updated successfully');
      },
    }
  );
}

export function useDeleteWidget() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (id: string) => api.widgets.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.widgets() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboards() });
        toast.success('Widget deleted successfully');
      },
    }
  );
}

// Webhook hooks
export function useWebhookLogs(params?: any) {
  return useApiQuery(
    queryKeys.webhookLogs(params),
    () => api.webhooks.getLogs(params)
  );
}

export function useWebhookStats() {
  return useApiQuery(
    queryKeys.webhookStats,
    () => api.webhooks.getStats()
  );
}

// Rule hooks
export function useRules() {
  return useApiQuery(
    queryKeys.rules,
    () => api.rules.list()
  );
}

export function useRule(id: string) {
  return useApiQuery(
    queryKeys.rule(id),
    () => api.rules.get(id),
    { enabled: !!id }
  );
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data: any) => api.rules.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rules });
        toast.success('Rule created successfully');
      },
    }
  );
}

export function useUpdateRule(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data: any) => api.rules.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rules });
        queryClient.invalidateQueries({ queryKey: queryKeys.rule(id) });
        toast.success('Rule updated successfully');
      },
    }
  );
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (id: string) => api.rules.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.rules });
        toast.success('Rule deleted successfully');
      },
    }
  );
}

export function useTestRule() {
  return useApiMutation(
    (data: any) => api.rules.test(data),
    {
      onSuccess: () => {
        toast.success('Rule test completed');
      },
    }
  );
}

export function useRuleLogs(params?: any) {
  return useApiQuery(
    queryKeys.ruleLogs(params),
    () => api.rules.getLogs(params)
  );
}
