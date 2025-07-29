/**
 * Dynamic Field Renderer for SynkBoard
 * Renders entity fields dynamically based on field type and mode
 */

import React from 'react';
import {
  Input,
  Textarea,
  Select,
  DatePicker,
  Badge,
} from '@/components/ui';
import {
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import type { EntityField, FieldType } from '@synkboard/types';

export type FieldRenderMode = 'edit' | 'view' | 'create';

export interface DynamicFieldRendererProps {
  field: EntityField;
  value: any;
  onChange?: (value: any) => void;
  mode?: FieldRenderMode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  mode = 'edit',
  className,
  placeholder,
  disabled = false,
  error,
}: DynamicFieldRendererProps) {
  const isReadOnly = mode === 'view';
  const fieldPlaceholder = placeholder || `Enter ${field.name.toLowerCase()}`;

  // Handle null/undefined values
  const displayValue = value ?? '';

  // Common field props
  const fieldProps = {
    value: displayValue,
    onChange: onChange || (() => {}),
    disabled: disabled || isReadOnly,
    className,
    placeholder: fieldPlaceholder,
  };

  // Render based on field type
  switch (field.type as FieldType) {
    case 'text':
      if (isReadOnly) {
        return (
          <div className="text-sm text-foreground">
            {displayValue || <span className="text-muted-foreground">—</span>}
          </div>
        );
      }
      return (
        <Input
          {...fieldProps}
          type="text"
        />
      );

    case 'number':
      if (isReadOnly) {
        return (
          <div className="text-sm font-mono text-foreground">
            {typeof displayValue === 'number' 
              ? displayValue.toLocaleString() 
              : displayValue || <span className="text-muted-foreground">—</span>
            }
          </div>
        );
      }
      return (
        <Input
          {...fieldProps}
          type="number"
        />
      );

    case 'boolean':
      if (isReadOnly) {
        return (
          <Badge variant={displayValue ? 'success' : 'secondary'}>
            {displayValue ? 'Yes' : 'No'}
          </Badge>
        );
      }
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.key}
            checked={!!displayValue}
            onChange={(e) => fieldProps.onChange(e.target.checked)}
            disabled={fieldProps.disabled}
            className="rounded border-border"
          />
          <label htmlFor={field.key} className="text-sm text-foreground">
            {field.name}
          </label>
        </div>
      );

    case 'date':
      if (isReadOnly) {
        return displayValue ? (
          <div className="flex items-center space-x-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(displayValue, 'long')}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      return (
        <DatePicker
          value={displayValue}
          onChange={fieldProps.onChange}
          placeholder={`Select ${field.name.toLowerCase()}`}
          disabled={fieldProps.disabled}
        />
      );

    case 'select':
      if (isReadOnly) {
        return displayValue ? (
          <Badge variant="outline">{displayValue}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      return (
        <Select
          options={field.options?.map((opt: string) => ({ value: opt, label: opt })) || []}
          value={displayValue}
          onChange={fieldProps.onChange}
          placeholder={`Select ${field.name.toLowerCase()}`}
          disabled={fieldProps.disabled}
        />
      );

    case 'multiselect':
      if (isReadOnly) {
        if (Array.isArray(displayValue) && displayValue.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {displayValue.map((val, idx) => (
                <Badge key={idx} variant="outline" size="sm">
                  {val}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <Select
          options={field.options?.map((opt: string) => ({ value: opt, label: opt })) || []}
          value={displayValue}
          onChange={fieldProps.onChange}
          placeholder={`Select ${field.name.toLowerCase()}`}
          multiple
          disabled={fieldProps.disabled}
        />
      );

    case 'rating':
      if (isReadOnly) {
        return (
          <div className="flex items-center space-x-2">
            <div className="flex text-yellow-400">
              {'★'.repeat(displayValue || 0)}{'☆'.repeat(5 - (displayValue || 0))}
            </div>
            <span className="text-sm text-muted-foreground">
              {displayValue || 0}/5
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => fieldProps.onChange(rating)}
              disabled={fieldProps.disabled}
              className={`text-2xl ${
                rating <= (displayValue || 0) ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors disabled:cursor-not-allowed`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {displayValue || 0}/5
          </span>
        </div>
      );

    case 'user':
      if (isReadOnly) {
        return displayValue ? (
          <div className="flex items-center space-x-2 text-sm">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span>{displayValue}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      return (
        <Input
          {...fieldProps}
          type="text"
          placeholder="Enter user name or ID"
        />
      );

    case 'json':
      if (isReadOnly) {
        return displayValue ? (
          <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto max-w-full">
            {JSON.stringify(displayValue, null, 2)}
          </pre>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      return (
        <Textarea
          value={typeof displayValue === 'string' ? displayValue : JSON.stringify(displayValue, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              fieldProps.onChange(parsed);
            } catch {
              fieldProps.onChange(e.target.value);
            }
          }}
          placeholder={`Enter JSON data for ${field.name.toLowerCase()}`}
          rows={4}
          disabled={fieldProps.disabled}
          className={className}
        />
      );

    default:
      // Fallback to textarea for unknown types
      if (isReadOnly) {
        return (
          <div className="text-sm text-foreground whitespace-pre-wrap break-words">
            {displayValue || <span className="text-muted-foreground">—</span>}
          </div>
        );
      }
      return (
        <Textarea
          value={displayValue}
          onChange={(e) => fieldProps.onChange(e.target.value)}
          placeholder={fieldPlaceholder}
          rows={3}
          disabled={fieldProps.disabled}
          className={className}
        />
      );
  }
}

// Helper function to get field type icon
export function getFieldTypeIcon(fieldType: FieldType): React.ReactNode {
  switch (fieldType) {
    case 'text':
      return '📝';
    case 'number':
      return '🔢';
    case 'boolean':
      return '☑️';
    case 'date':
      return '📅';
    case 'select':
      return '📋';
    case 'multiselect':
      return '📋';
    case 'rating':
      return '⭐';
    case 'user':
      return '👤';
    case 'json':
      return '🔧';
    default:
      return '📄';
  }
}

// Helper function to get field type description
export function getFieldTypeDescription(fieldType: FieldType): string {
  switch (fieldType) {
    case 'text':
      return 'Single line text input';
    case 'number':
      return 'Numeric values';
    case 'boolean':
      return 'True/false checkbox';
    case 'date':
      return 'Date picker';
    case 'select':
      return 'Single choice dropdown';
    case 'multiselect':
      return 'Multiple choice selection';
    case 'rating':
      return '1-5 star rating';
    case 'user':
      return 'User reference';
    case 'json':
      return 'Structured data';
    default:
      return 'Text area input';
  }
}
