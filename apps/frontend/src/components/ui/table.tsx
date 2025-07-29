/**
 * Table component for SynkBoard
 * Feature-rich table with sorting, filtering, and pagination
 */

import React from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { Skeleton } from './loading';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    onChange: (page: number, pageSize: number) => void;
  };
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  rowKey?: keyof T | ((record: T) => string);
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  emptyText?: string;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  sortable = true,
  filterable = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  rowKey = 'id',
  onRow,
  className,
  size = 'default',
  bordered = false,
  striped = false,
  hoverable = true,
  emptyText = 'No data',
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = React.useState('');

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  // Get row key
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey] || index);
  };

  // Size classes
  const sizeClasses = {
    default: 'text-sm',
    sm: 'text-xs',
    lg: 'text-base',
  };

  const cellPaddingClasses = {
    default: 'px-4 py-3',
    sm: 'px-3 py-2',
    lg: 'px-6 py-4',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="flex-1 max-w-sm">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
          )}
          
          {filterable && (
            <div className="flex items-center gap-2">
              {columns
                .filter(col => col.filterable)
                .map(column => (
                  <Select
                    key={column.key}
                    options={[
                      { value: '', label: `All ${column.title}` },
                      // Add filter options based on unique values
                    ]}
                    value={filters[column.key] || ''}
                    onChange={(value) => 
                      setFilters(prev => ({ ...prev, [column.key]: value as string }))
                    }
                    placeholder={`Filter ${column.title}`}
                    className="w-40"
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      cellPaddingClasses[size],
                      sizeClasses[size],
                      'font-medium text-left text-muted-foreground',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && sortable && 'cursor-pointer hover:text-foreground',
                      bordered && 'border-r border-border last:border-r-0',
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.title}</span>
                      {column.sortable && sortable && (
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            className={cn(
                              'h-3 w-3',
                              sortConfig?.key === column.key && sortConfig.direction === 'asc'
                                ? 'text-primary'
                                : 'text-muted-foreground/50'
                            )}
                          />
                          <ChevronDownIcon 
                            className={cn(
                              'h-3 w-3 -mt-1',
                              sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                ? 'text-primary'
                                : 'text-muted-foreground/50'
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: pagination?.pageSize || 5 }).map((_, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          cellPaddingClasses[size],
                          bordered && 'border-r border-border last:border-r-0'
                        )}
                      >
                        <Skeleton variant="text" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length}
                    className={cn(
                      cellPaddingClasses[size],
                      'text-center text-muted-foreground'
                    )}
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                // Data rows
                data.map((record, index) => {
                  const rowProps = onRow?.(record, index) || {};
                  
                  return (
                    <tr
                      key={getRowKey(record, index)}
                      className={cn(
                        'border-t border-border',
                        striped && index % 2 === 1 && 'bg-muted/25',
                        hoverable && 'hover:bg-muted/50',
                        rowProps.className
                      )}
                      {...rowProps}
                    >
                      {columns.map((column) => {
                        const value = column.dataIndex ? record[column.dataIndex] : record[column.key];
                        const content = column.render 
                          ? column.render(value, record, index)
                          : value;

                        return (
                          <td
                            key={column.key}
                            className={cn(
                              cellPaddingClasses[size],
                              sizeClasses[size],
                              'text-foreground',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right',
                              bordered && 'border-r border-border last:border-r-0',
                              column.className
                            )}
                            style={{ width: column.width }}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <TablePagination {...pagination} />
      )}
    </div>
  );
};

// Pagination Component
interface TablePaginationProps {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onChange: (page: number, pageSize: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  current,
  pageSize,
  total,
  showSizeChanger = true,
  pageSizeOptions = [10, 20, 50, 100],
  onChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange(page, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    onChange(1, parseInt(newPageSize));
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} entries
      </div>
      
      <div className="flex items-center gap-4">
        {showSizeChanger && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              options={pageSizeOptions.map(size => ({
                value: size.toString(),
                label: size.toString(),
              }))}
              value={pageSize.toString()}
              onChange={handlePageSizeChange}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current - 1)}
            disabled={current <= 1}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm">
            {current} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current + 1)}
            disabled={current >= totalPages}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { Table, TablePagination };
