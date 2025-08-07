/**
 * Dynamic query engine for SynkBoard widgets
 * Following dashboard-widgets.md rules
 */

import { prisma } from '@synkboard/database';
import { 
  WidgetType, 
  MetricType,
  KpiData,
  ChartData,
  TableData,
  ListData,
  WidgetData,
} from '@synkboard/types';
import { logger, createTimer } from '../utils/logger';

export interface QueryOptions {
  tenantId: string;
  entityId: string;
  widgetType: WidgetType;
  config: any;
  filters?: Record<string, any>;
  startDate?: string;
  endDate?: string;
}

/**
 * Execute widget query and return formatted data
 */
export async function executeWidgetQuery(options: QueryOptions): Promise<WidgetData> {
  const timer = createTimer();
  
  try {
    switch (options.widgetType) {
      case 'kpi':
        return await executeKpiQuery(options);
      case 'bar':
      case 'line':
      case 'pie':
        return await executeChartQuery(options);
      case 'table':
        return await executeTableQuery(options);
      case 'list':
        return await executeListQuery(options);
      default:
        throw new Error(`Unsupported widget type: ${options.widgetType}`);
    }
  } finally {
    const duration = timer.end();
    logger.debug('Widget query executed', {
      tenant_id: options.tenantId,
      entity_id: options.entityId,
      widget_type: options.widgetType,
      duration_ms: duration,
    });
  }
}

/**
 * Execute KPI widget query
 */
async function executeKpiQuery(options: QueryOptions): Promise<KpiData> {
  const { tenantId, entityId, config, filters } = options;
  const { metric_type, target_field, show_trend, trend_period_days } = config;

  // Build base where clause
  const where = buildWhereClause(tenantId, entityId, filters, options.startDate, options.endDate);

  let value: number;

  switch (metric_type) {
    case 'count':
      value = await prisma.entityRecord.count({ where });
      break;
    
    case 'sum':
    case 'avg':
    case 'min':
    case 'max':
      if (!target_field) {
        throw new Error(`${metric_type} requires target_field`);
      }
      value = await executeAggregateQuery(where, metric_type, target_field);
      break;
    
    default:
      throw new Error(`Unsupported metric type: ${metric_type}`);
  }

  const result: KpiData = { value };

  // Calculate trend if requested
  if (show_trend && trend_period_days) {
    const trendValue = await calculateTrend(
      tenantId,
      entityId,
      metric_type,
      target_field,
      trend_period_days,
      filters
    );
    result.trend = trendValue;
  }

  return result;
}

/**
 * Execute chart widget query (bar, line, pie)
 */
async function executeChartQuery(options: QueryOptions): Promise<ChartData> {
  const { tenantId, entityId, config, filters } = options;
  const { metric_type, target_field, group_by, limit = 10, sort_order = 'desc' } = config;

  if (!group_by) {
    throw new Error('Chart widgets require group_by field');
  }

  // Build base where clause
  const where = buildWhereClause(tenantId, entityId, filters, options.startDate, options.endDate);

  // Execute grouped aggregation query
  const results = await executeGroupedQuery(
    where,
    group_by,
    metric_type,
    target_field,
    limit,
    sort_order
  );

  const total = results.reduce((sum, item) => sum + item.value, 0);

  return {
    data: results,
    total,
  };
}

/**
 * Execute table widget query
 */
async function executeTableQuery(options: QueryOptions): Promise<TableData> {
  const { tenantId, entityId, config, filters } = options;
  const { columns, show_pagination = true, page_size = 20 } = config;

  // Get entity fields for column definitions
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    include: { fields: true },
  });

  if (!entity) {
    throw new Error('Entity not found');
  }

  // Build column definitions
  const columnDefs = columns.map((colKey: string) => {
    const field = entity.fields.find(f => f.key === colKey);
    return {
      key: colKey,
      label: field?.name || colKey,
      type: field?.type || 'text',
    };
  });

  // Build where clause
  const where = buildWhereClause(tenantId, entityId, filters, options.startDate, options.endDate);

  // Get records
  const records = await prisma.entityRecord.findMany({
    where,
    take: show_pagination ? page_size : undefined,
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Format rows
  const rows = records.map(record => {
    const row: Record<string, any> = {};
    
    // Add system fields
    row.id = record.id;
    row.created_at = record.created_at;
    row.created_by = record.user.name;
    
    // Add requested columns
    columns.forEach((colKey: string) => {
      row[colKey] = record.fields[colKey] || null;
    });
    
    return row;
  });

  // Get total count for pagination
  const total = await prisma.entityRecord.count({ where });

  return {
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'created_by', label: 'Created By', type: 'text' },
      ...columnDefs,
    ],
    rows,
    pagination: {
      page: 1,
      limit: page_size,
      total,
      pages: Math.ceil(total / page_size),
    },
  };
}

/**
 * Execute list widget query
 */
async function executeListQuery(options: QueryOptions): Promise<ListData> {
  const { tenantId, entityId, config, filters } = options;
  const { title_field, subtitle_field, limit = 10 } = config;

  // Build where clause
  const where = buildWhereClause(tenantId, entityId, filters, options.startDate, options.endDate);

  // Get records
  const records = await prisma.entityRecord.findMany({
    where,
    take: limit,
    orderBy: { created_at: 'desc' },
  });

  // Format items
  const items = records.map(record => ({
    id: record.id,
    title: record.fields[title_field] || 'Untitled',
    subtitle: subtitle_field ? record.fields[subtitle_field] : undefined,
    metadata: {
      created_at: record.created_at,
      ...record.fields,
    },
  }));

  const total = await prisma.entityRecord.count({ where });

  return {
    items,
    total,
  };
}

/**
 * Build Prisma where clause for entity records
 */
function buildWhereClause(
  tenantId: string,
  entityId: string,
  filters?: Record<string, any>,
  startDate?: string,
  endDate?: string
): any {
  const where: any = {
    tenant_id: tenantId,
    entity_id: entityId,
  };

  // Add date range filter
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = new Date(startDate);
    }
    if (endDate) {
      where.created_at.lte = new Date(endDate);
    }
  }

  // Add field filters using JSONB path queries
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Use JSONB path query for dynamic fields
        where.fields = {
          ...where.fields,
          path: [key],
          equals: value,
        };
      }
    });
  }

  return where;
}

/**
 * Execute aggregate query for numeric metrics
 */
async function executeAggregateQuery(
  where: any,
  metricType: MetricType,
  targetField: string
): Promise<number> {
  // Use raw SQL for JSONB aggregations
  const aggregateMap = {
    sum: 'SUM',
    avg: 'AVG',
    min: 'MIN',
    max: 'MAX',
  };

  const aggregateFunc = aggregateMap[metricType];
  if (!aggregateFunc) {
    throw new Error(`Unsupported aggregate function: ${metricType}`);
  }

  // Build SQL query for JSON field aggregation (SQLite)
  const result = await prisma.$queryRaw`
    SELECT ${aggregateFunc}(CAST(json_extract(fields, ${`$.${targetField}`}) AS NUMERIC)) as value
    FROM entity_records
    WHERE tenant_id = ${where.tenant_id}
      AND entity_id = ${where.entity_id}
      AND json_extract(fields, ${`$.${targetField}`}) IS NOT NULL
      AND json_extract(fields, ${`$.${targetField}`}) != 'null'
  `;

  return Number(result[0]?.value || 0);
}

/**
 * Execute grouped aggregation query
 */
async function executeGroupedQuery(
  where: any,
  groupBy: string,
  metricType: MetricType,
  targetField?: string,
  limit: number = 10,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<Array<{ label: string; value: number }>> {
  let query: string;
  let params: any[] = [where.tenant_id, where.entity_id, limit];

  if (metricType === 'count') {
    query = `
      SELECT
        json_extract(fields, '$.${groupBy}') as label,
        COUNT(*) as value
      FROM entity_records
      WHERE tenant_id = ?
        AND entity_id = ?
        AND json_extract(fields, '$.${groupBy}') IS NOT NULL
      GROUP BY json_extract(fields, '$.${groupBy}')
      ORDER BY value ${sortOrder.toUpperCase()}
      LIMIT ?
    `;
  } else {
    if (!targetField) {
      throw new Error(`${metricType} requires target_field`);
    }

    const aggregateMap = {
      sum: 'SUM',
      avg: 'AVG',
      min: 'MIN',
      max: 'MAX',
    };

    const aggregateFunc = aggregateMap[metricType];
    query = `
      SELECT
        json_extract(fields, '$.${groupBy}') as label,
        ${aggregateFunc}(CAST(json_extract(fields, '$.${targetField}') AS NUMERIC)) as value
      FROM entity_records
      WHERE tenant_id = ?
        AND entity_id = ?
        AND json_extract(fields, '$.${groupBy}') IS NOT NULL
        AND json_extract(fields, '$.${targetField}') IS NOT NULL
        AND json_extract(fields, '$.${targetField}') != 'null'
      GROUP BY json_extract(fields, '$.${groupBy}')
      ORDER BY value ${sortOrder.toUpperCase()}
      LIMIT ?
    `;
  }

  const results = await prisma.$queryRawUnsafe(query, ...params);
  
  return (results as any[]).map(row => ({
    label: String(row.label || 'Unknown'),
    value: Number(row.value || 0),
  }));
}

/**
 * Calculate trend for KPI widgets
 */
async function calculateTrend(
  tenantId: string,
  entityId: string,
  metricType: MetricType,
  targetField?: string,
  periodDays: number = 7,
  filters?: Record<string, any>
): Promise<{ value: number; percentage: number; direction: 'up' | 'down' | 'neutral' }> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
  const previousPeriodStart = new Date(periodStart.getTime() - (periodDays * 24 * 60 * 60 * 1000));

  // Current period value
  const currentWhere = buildWhereClause(tenantId, entityId, filters, periodStart.toISOString(), now.toISOString());
  const currentValue = metricType === 'count' 
    ? await prisma.entityRecord.count({ where: currentWhere })
    : await executeAggregateQuery(currentWhere, metricType, targetField!);

  // Previous period value
  const previousWhere = buildWhereClause(tenantId, entityId, filters, previousPeriodStart.toISOString(), periodStart.toISOString());
  const previousValue = metricType === 'count'
    ? await prisma.entityRecord.count({ where: previousWhere })
    : await executeAggregateQuery(previousWhere, metricType, targetField!);

  // Calculate trend
  const difference = currentValue - previousValue;
  const percentage = previousValue === 0 ? 0 : (difference / previousValue) * 100;
  
  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (difference > 0) direction = 'up';
  else if (difference < 0) direction = 'down';

  return {
    value: difference,
    percentage: Math.round(percentage * 100) / 100,
    direction,
  };
}
