/**
 * Dynamic Entity Table for SynkBoard
 * Generates table columns dynamically based on entity field definitions
 */

import React from 'react';
import {
  Table,
  Badge,
  DropdownButton,
} from '@/components/ui';
import { DynamicFieldRenderer } from './dynamic-field-renderer';
import { formatDate } from '@/lib/utils';
import type { EntityWithFields, EntityRecord, EntityField } from '@synkboard/types';

export interface EntityTableAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: EntityRecord) => void;
  destructive?: boolean;
  separator?: boolean;
  visible?: (record: EntityRecord) => boolean;
}

export interface DynamicEntityTableProps {
  entity: EntityWithFields;
  records: EntityRecord[];
  actions?: EntityTableAction[];
  maxVisibleFields?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  loading?: boolean;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  selectedFields?: string[];
  showMetadata?: boolean;
  className?: string;
}

export function DynamicEntityTable({
  entity,
  records,
  actions = [],
  maxVisibleFields = 4,
  searchable = true,
  searchPlaceholder,
  pagination,
  loading = false,
  onSort,
  selectedFields,
  showMetadata = true,
  className,
}: DynamicEntityTableProps) {
  // Determine which fields to show as columns
  const getVisibleFields = (): EntityField[] => {
    let fields = entity.fields || [];
    
    // If specific fields are selected, use those
    if (selectedFields && selectedFields.length > 0) {
      fields = fields.filter(field => selectedFields.includes(field.key));
    } else {
      // Otherwise, show first N fields
      fields = fields.slice(0, maxVisibleFields);
    }
    
    return fields;
  };

  const visibleFields = getVisibleFields();

  // Generate table columns
  const generateColumns = () => {
    const columns = [];

    // Add field columns
    visibleFields.forEach(field => {
      columns.push({
        key: field.key,
        title: field.name,
        sortable: field.is_sortable && !!onSort,
        render: (value: any, record: EntityRecord) => (
          <DynamicFieldRenderer
            field={field}
            value={record.fields[field.key]}
            mode="view"
          />
        ),
      });
    });

    // Add metadata columns if requested
    if (showMetadata) {
      columns.push({
        key: 'created_at',
        title: 'Created',
        sortable: !!onSort,
        render: (value: string) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(value, 'short')}
          </span>
        ),
      });
    }

    // Add actions column if actions are provided
    if (actions.length > 0) {
      columns.push({
        key: 'actions',
        title: 'Actions',
        render: (value: any, record: EntityRecord) => {
          const visibleActions = actions.filter(action => 
            !action.visible || action.visible(record)
          );
          
          if (visibleActions.length === 0) return null;

          return (
            <DropdownButton
              items={visibleActions.map(action => ({
                key: action.key,
                label: action.label,
                icon: action.icon,
                destructive: action.destructive,
                separator: action.separator,
                onClick: () => action.onClick(record),
              }))}
              variant="ghost"
              size="sm"
            >
              Actions
            </DropdownButton>
          );
        },
      });
    }

    return columns;
  };

  const columns = generateColumns();
  const defaultSearchPlaceholder = searchPlaceholder || `Search ${entity.name.toLowerCase()}...`;

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={records}
        searchable={searchable}
        searchPlaceholder={defaultSearchPlaceholder}
        pagination={pagination}
        loading={loading}
        onSort={onSort ? (field, direction) => onSort(field, direction) : undefined}
      />
    </div>
  );
}

// Helper component for field selection
export interface FieldSelectorProps {
  entity: EntityWithFields;
  selectedFields: string[];
  onChange: (fields: string[]) => void;
  maxFields?: number;
}

export function FieldSelector({
  entity,
  selectedFields,
  onChange,
  maxFields = 6,
}: FieldSelectorProps) {
  const fields = entity.fields || [];

  const handleFieldToggle = (fieldKey: string) => {
    const isSelected = selectedFields.includes(fieldKey);
    
    if (isSelected) {
      onChange(selectedFields.filter(key => key !== fieldKey));
    } else {
      if (selectedFields.length < maxFields) {
        onChange([...selectedFields, fieldKey]);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">
        Select Fields to Display ({selectedFields.length}/{maxFields})
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(field => (
          <label
            key={field.id}
            className="flex items-center space-x-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedFields.includes(field.key)}
              onChange={() => handleFieldToggle(field.key)}
              disabled={!selectedFields.includes(field.key) && selectedFields.length >= maxFields}
              className="rounded border-border"
            />
            <span className="flex items-center space-x-1">
              <span>{field.name}</span>
              <Badge variant="outline" size="sm">
                {field.type}
              </Badge>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Helper to generate summary statistics for entity records
export function generateEntityStats(
  entity: EntityWithFields,
  records: EntityRecord[]
): Array<{ label: string; value: string | number; description?: string }> {
  const stats = [
    {
      label: 'Total Records',
      value: records.length,
      description: `Total number of ${entity.name.toLowerCase()} records`,
    },
    {
      label: 'Fields',
      value: entity.fields?.length || 0,
      description: 'Number of defined fields',
    },
  ];

  // Add field-specific stats
  entity.fields?.forEach(field => {
    if (field.type === 'boolean') {
      const trueCount = records.filter(record => 
        record.fields[field.key] === true
      ).length;
      stats.push({
        label: `${field.name} (Yes)`,
        value: trueCount,
        description: `Records with ${field.name} set to Yes`,
      });
    }
    
    if (field.type === 'rating') {
      const ratings = records
        .map(record => record.fields[field.key])
        .filter(rating => typeof rating === 'number' && rating > 0);
      
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        stats.push({
          label: `Avg ${field.name}`,
          value: avgRating.toFixed(1),
          description: `Average ${field.name} rating`,
        });
      }
    }
  });

  // Add recent records count
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentCount = records.filter(record => 
    new Date(record.created_at) > weekAgo
  ).length;
  
  stats.push({
    label: 'Recent Records',
    value: recentCount,
    description: 'Records created in the last 7 days',
  });

  return stats;
}
