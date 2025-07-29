/**
 * List Widget Component for SynkBoard
 * Displays data as a simple list with titles and metadata
 */

import React from 'react';
import { formatNumber, formatDate } from '@/lib/utils';
import type { WidgetWithEntity, ListData } from '@synkboard/types';

export interface ListWidgetProps {
  widget: WidgetWithEntity;
  data?: ListData;
}

export function ListWidget({ widget, data }: ListWidgetProps) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="text-center">
          <div className="text-sm">No items available</div>
          <div className="text-xs">Check your filters and data source</div>
        </div>
      </div>
    );
  }

  const formatMetadataValue = (key: string, value: any) => {
    if (value == null) return '—';

    // Try to detect data types and format accordingly
    if (typeof value === 'number') {
      return formatNumber(value);
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Check if it looks like a date
    if (typeof value === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (dateRegex.test(value)) {
        return formatDate(value, 'short');
      }

      // Truncate long strings
      if (value.length > 50) {
        return `${value.substring(0, 50)}...`;
      }
    }

    return String(value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* List Items */}
      <div className="flex-1 overflow-auto space-y-2 p-2">
        {data.items.map((item, index) => (
          <div
            key={item.id || index}
            className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            {/* Title */}
            <div className="font-medium text-foreground mb-1 truncate" title={item.title}>
              {item.title}
            </div>

            {/* Subtitle */}
            {item.subtitle && (
              <div className="text-sm text-muted-foreground mb-2 truncate" title={item.subtitle}>
                {item.subtitle}
              </div>
            )}

            {/* Metadata */}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="space-y-1">
                {Object.entries(item.metadata).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-foreground font-medium">
                      {formatMetadataValue(key, value)}
                    </span>
                  </div>
                ))}
                
                {/* Show indicator if there are more metadata fields */}
                {Object.keys(item.metadata).length > 3 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{Object.keys(item.metadata).length - 3} more fields
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-2 px-3 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {data.items.length} items
            {data.total && data.total > data.items.length && (
              <> of {formatNumber(data.total)} total</>
            )}
          </span>
          
          {/* Show if there are more items */}
          {data.total && data.total > data.items.length && (
            <span>
              Showing first {data.items.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
