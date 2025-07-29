/**
 * KPI Widget Component for SynkBoard
 * Displays key performance indicators with trend information
 */

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { formatNumber } from '@/lib/utils';
import type { WidgetWithEntity, KpiData } from '@synkboard/types';

export interface KpiWidgetProps {
  widget: WidgetWithEntity;
  data?: KpiData;
}

export function KpiWidget({ widget, data }: KpiWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground">
        <div className="text-center">
          <div className="text-2xl font-bold">—</div>
          <div className="text-xs">No data</div>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!data.trend) return null;

    switch (data.trend.direction) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 text-success" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 text-destructive" />;
      case 'neutral':
        return <MinusIcon className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!data.trend) return 'text-muted-foreground';

    switch (data.trend.direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      case 'neutral':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTrendPercentage = (percentage: number) => {
    const abs = Math.abs(percentage);
    const sign = percentage >= 0 ? '+' : '-';
    return `${sign}${abs.toFixed(1)}%`;
  };

  return (
    <div className="flex flex-col justify-center h-full">
      {/* Main KPI Value */}
      <div className="text-center mb-2">
        <div className="text-3xl font-bold text-foreground mb-1">
          {formatNumber(data.value)}
        </div>
        
        {/* Metric Type Label */}
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {widget.config?.metric_type || 'Count'}
          {widget.config?.target_field && ` of ${widget.config.target_field}`}
        </div>
      </div>

      {/* Trend Information */}
      {data.trend && (
        <div className="flex items-center justify-center space-x-2">
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {formatTrendPercentage(data.trend.percentage)}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            vs {widget.config?.trend_period_days || 7} days ago
          </div>
        </div>
      )}

      {/* Additional Context */}
      {widget.config?.show_trend && data.trend && (
        <div className="mt-2 text-center">
          <div className="text-xs text-muted-foreground">
            {data.trend.direction === 'up' && data.trend.value > 0 && (
              <>Increased by {formatNumber(data.trend.value)}</>
            )}
            {data.trend.direction === 'down' && data.trend.value < 0 && (
              <>Decreased by {formatNumber(Math.abs(data.trend.value))}</>
            )}
            {data.trend.direction === 'neutral' && (
              <>No significant change</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
