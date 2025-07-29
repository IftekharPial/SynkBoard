/**
 * Dynamic Entity Form for SynkBoard
 * Generates forms dynamically based on entity field definitions
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormField,
  FormGroup,
  Badge,
} from '@/components/ui';
import { DynamicFieldRenderer, FieldRenderMode } from './dynamic-field-renderer';
import type { EntityWithFields, EntityField } from '@synkboard/types';

export interface DynamicEntityFormProps {
  entity: EntityWithFields;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  mode?: FieldRenderMode;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  showFieldTypes?: boolean;
  fieldFilter?: (field: EntityField) => boolean;
  fieldOrder?: string[];
}

export function DynamicEntityForm({
  entity,
  values,
  onChange,
  mode = 'edit',
  errors = {},
  disabled = false,
  className,
  title,
  icon,
  showFieldTypes = false,
  fieldFilter,
  fieldOrder,
}: DynamicEntityFormProps) {
  // Filter and order fields
  let fields = entity.fields || [];
  
  if (fieldFilter) {
    fields = fields.filter(fieldFilter);
  }
  
  if (fieldOrder) {
    fields = fields.sort((a, b) => {
      const aIndex = fieldOrder.indexOf(a.key);
      const bIndex = fieldOrder.indexOf(b.key);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  const defaultTitle = mode === 'create' 
    ? `New ${entity.name} Record`
    : mode === 'edit'
    ? `Edit ${entity.name} Record`
    : `${entity.name} Details`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <span>{title || defaultTitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No fields defined for this entity.</p>
            {mode !== 'view' && (
              <p className="text-sm">
                Add fields to the entity to start {mode === 'create' ? 'creating' : 'editing'} records.
              </p>
            )}
          </div>
        ) : (
          <FormGroup>
            {fields.map((field) => (
              <FormField
                key={field.id}
                label={
                  <div className="flex items-center space-x-2">
                    <span>{field.name}</span>
                    {showFieldTypes && (
                      <Badge variant="outline" size="sm">
                        {field.type}
                      </Badge>
                    )}
                  </div>
                }
                required={field.is_required}
                description={field.description}
                error={errors[field.key]}
              >
                <DynamicFieldRenderer
                  field={field}
                  value={values[field.key]}
                  onChange={(value) => onChange(field.key, value)}
                  mode={mode}
                  disabled={disabled}
                  error={errors[field.key]}
                />
              </FormField>
            ))}
          </FormGroup>
        )}
      </CardContent>
    </Card>
  );
}

// Validation helper for dynamic forms
export function validateDynamicForm(
  entity: EntityWithFields,
  values: Record<string, any>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  entity.fields?.forEach(field => {
    const value = values[field.key];
    
    // Check required fields
    if (field.is_required) {
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        errors[field.key] = `${field.name} is required`;
      }
    }
    
    // Type-specific validation
    if (value !== null && value !== undefined && value !== '') {
      switch (field.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors[field.key] = `${field.name} must be a valid number`;
          }
          break;
          
        case 'rating':
          const rating = Number(value);
          if (isNaN(rating) || rating < 1 || rating > 5) {
            errors[field.key] = `${field.name} must be between 1 and 5`;
          }
          break;
          
        case 'select':
          if (field.options && !field.options.includes(value)) {
            errors[field.key] = `${field.name} must be one of the available options`;
          }
          break;
          
        case 'multiselect':
          if (Array.isArray(value) && field.options) {
            const invalidOptions = value.filter(v => !field.options!.includes(v));
            if (invalidOptions.length > 0) {
              errors[field.key] = `${field.name} contains invalid options: ${invalidOptions.join(', ')}`;
            }
          }
          break;
          
        case 'json':
          if (typeof value === 'string') {
            try {
              JSON.parse(value);
            } catch {
              errors[field.key] = `${field.name} must be valid JSON`;
            }
          }
          break;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Helper to get initial values for a form
export function getInitialFormValues(entity: EntityWithFields): Record<string, any> {
  const initialValues: Record<string, any> = {};
  
  entity.fields?.forEach(field => {
    switch (field.type) {
      case 'boolean':
        initialValues[field.key] = false;
        break;
      case 'number':
      case 'rating':
        initialValues[field.key] = 0;
        break;
      case 'multiselect':
        initialValues[field.key] = [];
        break;
      case 'json':
        initialValues[field.key] = {};
        break;
      default:
        initialValues[field.key] = '';
    }
  });
  
  return initialValues;
}

// Helper to prepare form values for API submission
export function prepareFormValuesForSubmission(
  entity: EntityWithFields,
  values: Record<string, any>
): Record<string, any> {
  const prepared: Record<string, any> = {};
  
  entity.fields?.forEach(field => {
    let value = values[field.key];
    
    // Handle empty values
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      value = null;
    }
    
    // Type-specific preparation
    switch (field.type) {
      case 'number':
      case 'rating':
        if (value !== null) {
          value = Number(value);
        }
        break;
        
      case 'json':
        if (typeof value === 'string' && value.trim()) {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if parsing fails
          }
        }
        break;
    }
    
    prepared[field.key] = value;
  });
  
  return prepared;
}
