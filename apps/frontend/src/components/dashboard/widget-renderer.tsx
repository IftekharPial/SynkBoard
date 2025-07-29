/**
 * Widget Renderer Component for SynkBoard
 * Renders different widget types with data fetching and error handling
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  DropdownButton,
  Badge,
} from '@/components/ui';
import { useWidgetData } from '@/hooks/use-api';
import {
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { KpiWidget } from './widgets/kpi-widget';
import { BarChartWidget } from './widgets/bar-chart-widget';
import { LineChartWidget } from './widgets/line-chart-widget';
import { PieChartWidget } from './widgets/pie-chart-widget';
import { TableWidget } from './widgets/table-widget';
import { ListWidget } from './widgets/list-widget';
import type { WidgetWithEntity } from '@synkboard/types';

export interface WidgetRendererProps {
  widget: WidgetWithEntity;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function WidgetRenderer({
  widget,
  isEditing,
  onEdit,
  onDelete,
}: WidgetRendererProps) {
  const { data: widgetData, isLoading, error, refetch } = useWidgetData(widget.id);

  const getWidgetActions = () => {
    const actions = [];

    actions.push({
      key: 'refresh',
      label: 'Refresh Data',
      icon: <ArrowPathIcon className="h-4 w-4" />,
      onClick: () => refetch(),
    });

    if (isEditing) {
      actions.push({
        key: 'separator',
        separator: true,
      });
      actions.push({
        key: 'edit',
        label: 'Edit Widget',
        icon: <PencilIcon className="h-4 w-4" />,
        onClick: onEdit,
      });
      actions.push({
        key: 'delete',
        label: 'Delete Widget',
        icon: <TrashIcon className="h-4 w-4" />,
        destructive: true,
        onClick: onDelete,
      });
    }

    return actions;
  };

  const renderWidgetContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <div className="text-destructive text-sm mb-2">
            Failed to load widget data
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
      );
    }

    const data = widgetData?.data;

    switch (widget.type) {
      case 'kpi':
        return <KpiWidget widget={widget} data={data} />;
      case 'bar':
        return <BarChartWidget widget={widget} data={data} />;
      case 'line':
        return <LineChartWidget widget={widget} data={data} />;
      case 'pie':
        return <PieChartWidget widget={widget} data={data} />;
      case 'table':
        return <TableWidget widget={widget} data={data} />;
      case 'list':
        return <ListWidget widget={widget} data={data} />;
      default:
        return (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <div className="text-sm">Unknown widget type</div>
              <div className="text-xs">{widget.type}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className={`h-full ${isEditing ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-sm font-medium truncate">
              {widget.title}
            </CardTitle>
            {widget.is_public && (
              <Badge variant="outline" size="sm">
                Public
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {widget.refresh_rate && (
              <Badge variant="secondary" size="sm">
                {widget.refresh_rate}s
              </Badge>
            )}
            
            <DropdownButton
              items={getWidgetActions()}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
            </DropdownButton>
          </div>
        </div>
        
        {widget.entity && (
          <div className="text-xs text-muted-foreground">
            {widget.entity.name}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {renderWidgetContent()}
      </CardContent>
      
      {/* Editing Overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                leftIcon={<PencilIcon className="h-3 w-3" />}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                leftIcon={<TrashIcon className="h-3 w-3" />}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Widget type icons for display
export function getWidgetTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'kpi':
      return '📊';
    case 'bar':
      return '📊';
    case 'line':
      return '📈';
    case 'pie':
      return '🥧';
    case 'table':
      return '📋';
    case 'list':
      return '📝';
    default:
      return '📊';
  }
}

// Widget type descriptions
export function getWidgetTypeDescription(type: string): string {
  switch (type) {
    case 'kpi':
      return 'Key Performance Indicator with trend';
    case 'bar':
      return 'Bar chart for comparing categories';
    case 'line':
      return 'Line chart for showing trends over time';
    case 'pie':
      return 'Pie chart for showing proportions';
    case 'table':
      return 'Data table with sorting and filtering';
    case 'list':
      return 'Simple list of items';
    default:
      return 'Data visualization widget';
  }
}
