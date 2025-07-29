/**
 * Table Widget Component for SynkBoard
 * Displays data in a tabular format with sorting and pagination
 */

import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { formatNumber, formatDate } from '@/lib/utils';
import type { WidgetWithEntity, TableData } from '@synkboard/types';

export interface TableWidgetProps {
  widget: WidgetWithEntity;
  data?: TableData;
}

export function TableWidget({ widget, data }: TableWidgetProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (!data || !data.columns || !data.rows || data.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="text-center">
          <div className="text-sm">No data available</div>
          <div className="text-xs">Check your filters and data source</div>
        </div>
      </div>
    );
  }

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedRows = React.useMemo(() => {
    if (!sortColumn) return data.rows;

    return [...data.rows].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data.rows, sortColumn, sortDirection]);

  const formatCellValue = (value: any, columnType: string) => {
    if (value == null) {
      return <span className="text-muted-foreground">—</span>;
    }

    switch (columnType) {
      case 'number':
        return <span className="font-mono">{formatNumber(value)}</span>;
      case 'date':
        return <span>{formatDate(value, 'short')}</span>;
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value 
              ? 'bg-success/10 text-success' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        );
      default:
        const strValue = String(value);
        return (
          <span className="truncate" title={strValue.length > 30 ? strValue : undefined}>
            {strValue.length > 30 ? `${strValue.substring(0, 30)}...` : strValue}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {data.columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span className="truncate">{column.label}</span>
                    {sortColumn === column.key && (
                      <div className="flex-shrink-0">
                        {sortDirection === 'asc' ? (
                          <ChevronUpIcon className="h-3 w-3" />
                        ) : (
                          <ChevronDownIcon className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                {data.columns.map((column) => (
                  <td key={column.key} className="px-3 py-2">
                    {formatCellValue(row[column.key], column.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination and Summary */}
      <div className="border-t border-border pt-2 px-3 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {data.rows.length} of {data.pagination?.total || data.rows.length} rows
          </span>
          
          {data.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center space-x-2">
              <span>
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              {/* TODO: Add pagination controls */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
