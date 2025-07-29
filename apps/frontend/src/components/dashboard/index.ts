/**
 * Dashboard Components for SynkBoard
 * Centralized exports for all dashboard-related UI components
 */

// Main Dashboard Components
export { DashboardGrid } from './dashboard-grid';
export type { DashboardGridProps } from './dashboard-grid';

export { WidgetRenderer, getWidgetTypeIcon, getWidgetTypeDescription } from './widget-renderer';
export type { WidgetRendererProps } from './widget-renderer';

export { AddWidgetDialog } from './add-widget-dialog';
export type { AddWidgetDialogProps } from './add-widget-dialog';

// Widget Components
export { KpiWidget } from './widgets/kpi-widget';
export type { KpiWidgetProps } from './widgets/kpi-widget';

export { BarChartWidget } from './widgets/bar-chart-widget';
export type { BarChartWidgetProps } from './widgets/bar-chart-widget';

export { LineChartWidget } from './widgets/line-chart-widget';
export type { LineChartWidgetProps } from './widgets/line-chart-widget';

export { PieChartWidget } from './widgets/pie-chart-widget';
export type { PieChartWidgetProps } from './widgets/pie-chart-widget';

export { TableWidget } from './widgets/table-widget';
export type { TableWidgetProps } from './widgets/table-widget';

export { ListWidget } from './widgets/list-widget';
export type { ListWidgetProps } from './widgets/list-widget';
