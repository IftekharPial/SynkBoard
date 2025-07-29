/**
 * Dashboard and widget types for SynkBoard
 * Following dashboard-widgets.md rules
 */

import { z } from 'zod';
import { UuidSchema, SlugSchema } from './common';

// Widget type definitions following dashboard-widgets.md
export const WidgetTypeSchema = z.enum([
  'kpi',
  'bar',
  'line',
  'table',
  'pie',
  'list',
]);

export type WidgetType = z.infer<typeof WidgetTypeSchema>;

// Metric type for aggregations
export const MetricTypeSchema = z.enum([
  'count',
  'sum',
  'avg',
  'min',
  'max',
]);

export type MetricType = z.infer<typeof MetricTypeSchema>;

// Dashboard schemas
export const DashboardSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  is_public: z.boolean(),
  layout: z.any().optional(), // Grid layout configuration
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: UuidSchema,
});

export const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  is_public: z.boolean().default(false),
  layout: z.any().optional(),
});

export const UpdateDashboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_public: z.boolean().optional(),
  layout: z.any().optional(),
});

export type Dashboard = z.infer<typeof DashboardSchema>;
export type CreateDashboard = z.infer<typeof CreateDashboardSchema>;
export type UpdateDashboard = z.infer<typeof UpdateDashboardSchema>;

// Widget configuration schemas
export const BaseWidgetConfigSchema = z.object({
  entity_slug: z.string(),
  metric_type: MetricTypeSchema,
  target_field: z.string().optional(),
  filters: z.record(z.any()).optional(),
  group_by: z.string().optional(),
});

export const KpiWidgetConfigSchema = BaseWidgetConfigSchema.extend({
  show_trend: z.boolean().default(false),
  trend_period_days: z.number().min(1).max(365).default(7),
});

export const ChartWidgetConfigSchema = BaseWidgetConfigSchema.extend({
  group_by: z.string(), // Required for charts
  limit: z.number().min(1).max(50).default(10),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const TableWidgetConfigSchema = BaseWidgetConfigSchema.extend({
  columns: z.array(z.string()),
  show_pagination: z.boolean().default(true),
  page_size: z.number().min(5).max(100).default(20),
});

export const ListWidgetConfigSchema = BaseWidgetConfigSchema.extend({
  title_field: z.string(),
  subtitle_field: z.string().optional(),
  limit: z.number().min(1).max(20).default(10),
});

// Widget schemas
export const WidgetSchema = z.object({
  id: UuidSchema,
  dashboard_id: UuidSchema,
  entity_id: UuidSchema,
  type: WidgetTypeSchema,
  title: z.string().min(1).max(100),
  config: z.any(), // Widget-specific configuration
  filters: z.record(z.any()).optional(),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  refresh_rate: z.number().min(5).max(3600).optional(), // 5 seconds to 1 hour
  is_public: z.boolean(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateWidgetSchema = z.object({
  entity_id: UuidSchema,
  type: WidgetTypeSchema,
  title: z.string().min(1).max(100),
  config: z.any(),
  filters: z.record(z.any()).optional(),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  refresh_rate: z.number().min(5).max(3600).optional(),
  is_public: z.boolean().default(false),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
});

export const UpdateWidgetSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  config: z.any().optional(),
  filters: z.record(z.any()).optional(),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  refresh_rate: z.number().min(5).max(3600).optional(),
  is_public: z.boolean().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
});

export type Widget = z.infer<typeof WidgetSchema>;
export type CreateWidget = z.infer<typeof CreateWidgetSchema>;
export type UpdateWidget = z.infer<typeof UpdateWidgetSchema>;

// Widget with entity info
export const WidgetWithEntitySchema = WidgetSchema.extend({
  entity: z.object({
    id: UuidSchema,
    name: z.string(),
    slug: z.string(),
  }),
});

export type WidgetWithEntity = z.infer<typeof WidgetWithEntitySchema>;

// Dashboard with widgets
export const DashboardWithWidgetsSchema = DashboardSchema.extend({
  widgets: z.array(WidgetWithEntitySchema),
  user: z.object({
    id: UuidSchema,
    name: z.string(),
    email: z.string().email(),
  }),
});

export type DashboardWithWidgets = z.infer<typeof DashboardWithWidgetsSchema>;

// Widget data response types
export interface KpiData {
  value: number;
  trend?: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartData {
  data: ChartDataPoint[];
  total: number;
}

export interface TableData {
  columns: Array<{
    key: string;
    label: string;
    type: string;
  }>;
  rows: Array<Record<string, any>>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ListData {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    metadata?: Record<string, any>;
  }>;
  total: number;
}

export type WidgetData = KpiData | ChartData | TableData | ListData;

// Widget query parameters
export const WidgetQueryParamsSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  filters: z.record(z.any()).optional(),
});

export type WidgetQueryParams = z.infer<typeof WidgetQueryParamsSchema>;

// Widget validation functions
export function validateWidgetConfig(type: WidgetType, config: any): boolean {
  try {
    switch (type) {
      case 'kpi':
        KpiWidgetConfigSchema.parse(config);
        break;
      case 'bar':
      case 'line':
      case 'pie':
        ChartWidgetConfigSchema.parse(config);
        break;
      case 'table':
        TableWidgetConfigSchema.parse(config);
        break;
      case 'list':
        ListWidgetConfigSchema.parse(config);
        break;
      default:
        return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Dashboard API response types
export interface DashboardsListResponse {
  dashboards: DashboardWithWidgets[];
}

export interface DashboardDetailResponse {
  dashboard: DashboardWithWidgets;
}

export interface WidgetsListResponse {
  widgets: WidgetWithEntity[];
}

export interface WidgetDetailResponse {
  widget: WidgetWithEntity;
}

export interface WidgetDataResponse {
  data: WidgetData;
  generated_at: string;
  cache_expires_at?: string;
}
