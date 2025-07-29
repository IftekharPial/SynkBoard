/**
 * Pie Chart Widget Component for SynkBoard
 * Displays data as a pie chart using SVG
 */

import React from 'react';
import { formatNumber } from '@/lib/utils';
import type { WidgetWithEntity, ChartData } from '@synkboard/types';

export interface PieChartWidgetProps {
  widget: WidgetWithEntity;
  data?: ChartData;
}

interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

export function PieChartWidget({ widget, data }: PieChartWidgetProps) {
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
  const total = data.total || chartData.reduce((sum, d) => sum + d.value, 0);

  // Color palette for slices
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

  // Calculate pie slices
  const slices: PieSlice[] = [];
  let currentAngle = -90; // Start from top

  chartData.forEach((dataPoint, index) => {
    const percentage = (dataPoint.value / total) * 100;
    const sliceAngle = (dataPoint.value / total) * 360;
    const color = dataPoint.color || defaultColors[index % defaultColors.length];

    slices.push({
      label: dataPoint.label,
      value: dataPoint.value,
      percentage,
      color,
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
    });

    currentAngle += sliceAngle;
  });

  // Chart dimensions
  const size = 160;
  const radius = 60;
  const centerX = size / 2;
  const centerY = size / 2;

  // Helper function to create SVG path for pie slice
  const createArcPath = (slice: PieSlice) => {
    const startAngleRad = (slice.startAngle * Math.PI) / 180;
    const endAngleRad = (slice.endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = slice.endAngle - slice.startAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chart Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-6">
          {/* Pie Chart */}
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {slices.map((slice, index) => (
                <g key={index}>
                  <path
                    d={createArcPath(slice)}
                    fill={slice.color}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                </g>
              ))}
            </svg>

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatNumber(total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 max-w-32">
            {slices.map((slice, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-foreground" title={slice.label}>
                    {slice.label}
                  </div>
                  <div className="text-muted-foreground">
                    {formatNumber(slice.value)} ({slice.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-2 px-4 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{slices.length} categories</span>
          <span>
            Largest: {slices.length > 0 ? slices.reduce((max, slice) => 
              slice.percentage > max.percentage ? slice : max
            ).label : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
