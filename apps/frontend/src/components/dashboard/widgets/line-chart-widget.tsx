/**
 * Line Chart Widget Component for SynkBoard
 * Displays data as a line chart using SVG
 */

import React from 'react';
import { formatNumber } from '@/lib/utils';
import type { WidgetWithEntity, ChartData } from '@synkboard/types';

export interface LineChartWidgetProps {
  widget: WidgetWithEntity;
  data?: ChartData;
}

export function LineChartWidget({ widget, data }: LineChartWidgetProps) {
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
  const chartWidth = 300;
  const chartHeight = 160;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const getX = (index: number) => {
    return padding.left + (index / (chartData.length - 1)) * (chartWidth - padding.left - padding.right);
  };

  const getY = (value: number) => {
    if (range === 0) return chartHeight / 2;
    const normalizedValue = (value - minValue) / range;
    return chartHeight - padding.bottom - (normalizedValue * (chartHeight - padding.top - padding.bottom));
  };

  // Generate path for the line
  const generatePath = () => {
    if (chartData.length === 0) return '';

    let path = `M ${getX(0)} ${getY(chartData[0].value)}`;
    
    for (let i = 1; i < chartData.length; i++) {
      path += ` L ${getX(i)} ${getY(chartData[i].value)}`;
    }
    
    return path;
  };

  // Generate area path (for fill under line)
  const generateAreaPath = () => {
    if (chartData.length === 0) return '';

    let path = `M ${getX(0)} ${chartHeight - padding.bottom}`;
    path += ` L ${getX(0)} ${getY(chartData[0].value)}`;
    
    for (let i = 1; i < chartData.length; i++) {
      path += ` L ${getX(i)} ${getY(chartData[i].value)}`;
    }
    
    path += ` L ${getX(chartData.length - 1)} ${chartHeight - padding.bottom}`;
    path += ' Z';
    
    return path;
  };

  const linePath = generatePath();
  const areaPath = generateAreaPath();

  return (
    <div className="h-full flex flex-col">
      {/* Chart Container */}
      <div className="flex-1 flex items-center justify-center p-2">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 32"
                fill="none"
                stroke="rgb(var(--border))"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth - padding.left - padding.right}
            height={chartHeight - padding.top - padding.bottom}
            fill="url(#grid)"
          />

          {/* Area under line */}
          <path
            d={areaPath}
            fill="rgb(59, 130, 246)"
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((dataPoint, index) => (
            <g key={index}>
              <circle
                cx={getX(index)}
                cy={getY(dataPoint.value)}
                r="4"
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer"
              />
              
              {/* Tooltip on hover */}
              <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={getX(index) - 30}
                  y={getY(dataPoint.value) - 35}
                  width="60"
                  height="25"
                  fill="rgb(var(--background))"
                  stroke="rgb(var(--border))"
                  rx="4"
                />
                <text
                  x={getX(index)}
                  y={getY(dataPoint.value) - 20}
                  textAnchor="middle"
                  className="text-xs fill-current text-foreground"
                >
                  {formatNumber(dataPoint.value)}
                </text>
              </g>
            </g>
          ))}

          {/* Y-axis labels */}
          <text
            x={padding.left - 10}
            y={padding.top}
            textAnchor="end"
            className="text-xs fill-current text-muted-foreground"
          >
            {formatNumber(maxValue)}
          </text>
          
          {range > 0 && (
            <text
              x={padding.left - 10}
              y={chartHeight / 2}
              textAnchor="end"
              className="text-xs fill-current text-muted-foreground"
            >
              {formatNumber(minValue + range / 2)}
            </text>
          )}
          
          <text
            x={padding.left - 10}
            y={chartHeight - padding.bottom}
            textAnchor="end"
            className="text-xs fill-current text-muted-foreground"
          >
            {formatNumber(minValue)}
          </text>

          {/* X-axis labels */}
          {chartData.map((dataPoint, index) => {
            // Show every nth label to avoid crowding
            const showLabel = chartData.length <= 6 || index % Math.ceil(chartData.length / 6) === 0;
            
            if (!showLabel) return null;

            return (
              <text
                key={index}
                x={getX(index)}
                y={chartHeight - padding.bottom + 15}
                textAnchor="middle"
                className="text-xs fill-current text-muted-foreground"
              >
                {dataPoint.label.length > 8 
                  ? `${dataPoint.label.substring(0, 8)}...` 
                  : dataPoint.label
                }
              </text>
            );
          })}
        </svg>
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-2 px-4 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{chartData.length} data points</span>
          <span>Total: {formatNumber(data.total)}</span>
        </div>
      </div>
    </div>
  );
}
