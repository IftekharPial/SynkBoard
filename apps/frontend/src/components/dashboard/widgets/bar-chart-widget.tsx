/**
 * Bar Chart Widget Component for SynkBoard
 * Displays data as a bar chart using a simple SVG implementation
 */

import React from 'react';
import { formatNumber } from '@/lib/utils';
import type { WidgetWithEntity, ChartData } from '@synkboard/types';

export interface BarChartWidgetProps {
  widget: WidgetWithEntity;
  data?: ChartData;
}

export function BarChartWidget({ widget, data }: BarChartWidgetProps) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <div className="text-center">
          <div className="text-sm">No data available</div>
          <div className="text-xs">Check your filters and data source</div>
        </div>
      </div>
    );
  }

  const chartData = data.data;
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const range = maxValue - minValue;

  // Chart dimensions
  const chartWidth = 100; // percentage
  const chartHeight = 200;
  const barSpacing = 4;
  const barWidth = Math.max(20, (chartWidth - (chartData.length - 1) * barSpacing) / chartData.length);

  // Color palette for bars
  const defaultColors = [
    'rgb(59, 130, 246)', // blue
    'rgb(16, 185, 129)', // green
    'rgb(245, 158, 11)', // yellow
    'rgb(239, 68, 68)', // red
    'rgb(139, 92, 246)', // purple
    'rgb(236, 72, 153)', // pink
    'rgb(6, 182, 212)', // cyan
    'rgb(34, 197, 94)', // emerald
  ];

  const getBarColor = (index: number, dataPoint: any) => {
    if (dataPoint.color) return dataPoint.color;
    return defaultColors[index % defaultColors.length];
  };

  const getBarHeight = (value: number) => {
    if (range === 0) return 50; // Default height when all values are the same
    return Math.max(4, ((value - minValue) / range) * (chartHeight - 40));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chart Container */}
      <div className="flex-1 flex items-end justify-center p-4">
        <div className="relative w-full" style={{ height: chartHeight }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
            <span>{formatNumber(maxValue)}</span>
            {range > 0 && (
              <span>{formatNumber(minValue + range / 2)}</span>
            )}
            <span>{formatNumber(minValue)}</span>
          </div>

          {/* Bars */}
          <div className="ml-12 h-full flex items-end justify-center space-x-1">
            {chartData.map((dataPoint, index) => {
              const barHeight = getBarHeight(dataPoint.value);
              const color = getBarColor(index, dataPoint);

              return (
                <div
                  key={index}
                  className="flex flex-col items-center group"
                  style={{ minWidth: `${Math.max(40, 100 / chartData.length - 2)}px` }}
                >
                  {/* Value label on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-xs font-medium text-foreground bg-background border border-border rounded px-2 py-1 shadow-sm">
                    {formatNumber(dataPoint.value)}
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-200 hover:opacity-80 cursor-pointer"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: color,
                      minHeight: '4px',
                    }}
                  />

                  {/* Label */}
                  <div className="mt-2 text-xs text-muted-foreground text-center max-w-full">
                    <div className="truncate" title={dataPoint.label}>
                      {dataPoint.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-2 px-4 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{chartData.length} categories</span>
          <span>Total: {formatNumber(data.total)}</span>
        </div>
      </div>
    </div>
  );
}
