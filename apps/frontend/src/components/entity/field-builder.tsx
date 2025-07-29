/**
 * Field Builder for SynkBoard
 * Component for creating and editing entity field definitions
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  FormGroup,
  Badge,
} from '@/components/ui';
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { generateSlug } from '@/lib/utils';
import { getFieldTypeIcon, getFieldTypeDescription } from './dynamic-field-renderer';
import type { CreateEntityField, FieldType } from '@synkboard/types';

export interface FieldBuilderProps {
  fields: CreateEntityField[];
  onChange: (fields: CreateEntityField[]) => void;
  disabled?: boolean;
  maxFields?: number;
  className?: string;
}

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Single line text input' },
  { value: 'number', label: 'Number', description: 'Numeric values' },
  { value: 'boolean', label: 'Boolean', description: 'True/false checkbox' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'select', label: 'Select', description: 'Single choice dropdown' },
  { value: 'multiselect', label: 'Multi-select', description: 'Multiple choice selection' },
  { value: 'rating', label: 'Rating', description: '1-5 star rating' },
  { value: 'user', label: 'User', description: 'User reference' },
  { value: 'json', label: 'JSON', description: 'Structured data' },
];

export function FieldBuilder({
  fields,
  onChange,
  disabled = false,
  maxFields = 20,
  className,
}: FieldBuilderProps) {
  const addField = () => {
    if (fields.length >= maxFields) return;
    
    const newField: CreateEntityField = {
      name: '',
      key: '',
      type: 'text',
      is_required: false,
      is_filterable: true,
      is_sortable: true,
    };
    
    onChange([...fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const updateField = (index: number, updates: Partial<CreateEntityField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    
    // Auto-generate key from name if name changed
    if (updates.name && !updates.key) {
      newFields[index].key = generateSlug(updates.name).replace(/-/g, '_');
    }
    
    onChange(newFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fields ({fields.length}/{maxFields})</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={addField}
            disabled={disabled || fields.length >= maxFields}
          >
            Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No fields defined yet.</p>
            <p className="text-sm">Click "Add Field" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <FieldEditor
                key={index}
                field={field}
                index={index}
                onUpdate={(updates) => updateField(index, updates)}
                onRemove={() => removeField(index)}
                onMove={(direction) => moveField(index, direction)}
                canMoveUp={index > 0}
                canMoveDown={index < fields.length - 1}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FieldEditorProps {
  field: CreateEntityField;
  index: number;
  onUpdate: (updates: Partial<CreateEntityField>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
}

function FieldEditor({
  field,
  index,
  onUpdate,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
  disabled = false,
}: FieldEditorProps) {
  const fieldType = FIELD_TYPES.find(t => t.value === field.type);
  const needsOptions = field.type === 'select' || field.type === 'multiselect';

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
          <h4 className="font-medium text-foreground">
            Field {index + 1}
            {field.name && ` - ${field.name}`}
          </h4>
          {field.is_required && (
            <Badge variant="secondary" size="sm">Required</Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMove('up')}
            disabled={disabled || !canMoveUp}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMove('down')}
            disabled={disabled || !canMoveDown}
          >
            <ArrowDownIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Field Name" required>
            <Input
              value={field.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="e.g., Full Name, Email, Age"
              disabled={disabled}
            />
          </FormField>

          <FormField label="Field Key" required>
            <Input
              value={field.key}
              onChange={(e) => onUpdate({ key: e.target.value })}
              placeholder="e.g., full_name, email, age"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used in API and database
            </p>
          </FormField>
        </div>

        <FormField label="Field Type" required>
          <Select
            options={FIELD_TYPES.map(type => ({ 
              value: type.value, 
              label: `${getFieldTypeIcon(type.value)} ${type.label} - ${type.description}` 
            }))}
            value={field.type}
            onChange={(value) => onUpdate({ type: value as FieldType })}
            disabled={disabled}
          />
        </FormField>

        {field.description !== undefined && (
          <FormField label="Description">
            <Input
              value={field.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Optional field description"
              disabled={disabled}
            />
          </FormField>
        )}

        {needsOptions && (
          <FormField label="Options" required>
            <Textarea
              value={field.options?.join('\n') || ''}
              onChange={(e) => onUpdate({ 
                options: e.target.value.split('\n').filter(opt => opt.trim()) 
              })}
              placeholder="Enter each option on a new line"
              rows={3}
              disabled={disabled}
            />
          </FormField>
        )}

        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={field.is_required}
              onChange={(e) => onUpdate({ is_required: e.target.checked })}
              disabled={disabled}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Required</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={field.is_filterable}
              onChange={(e) => onUpdate({ is_filterable: e.target.checked })}
              disabled={disabled}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Filterable</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={field.is_sortable}
              onChange={(e) => onUpdate({ is_sortable: e.target.checked })}
              disabled={disabled}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Sortable</span>
          </label>
        </div>
      </FormGroup>
    </div>
  );
}

// Helper function to validate field definitions
export function validateFields(fields: CreateEntityField[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const usedKeys = new Set<string>();
  const usedNames = new Set<string>();

  fields.forEach((field, index) => {
    const fieldLabel = `Field ${index + 1}`;

    // Check required properties
    if (!field.name?.trim()) {
      errors.push(`${fieldLabel}: Name is required`);
    }
    if (!field.key?.trim()) {
      errors.push(`${fieldLabel}: Key is required`);
    }

    // Check for duplicates
    if (field.key && usedKeys.has(field.key)) {
      errors.push(`${fieldLabel}: Key "${field.key}" is already used`);
    }
    if (field.name && usedNames.has(field.name.toLowerCase())) {
      errors.push(`${fieldLabel}: Name "${field.name}" is already used`);
    }

    // Add to sets for duplicate checking
    if (field.key) usedKeys.add(field.key);
    if (field.name) usedNames.add(field.name.toLowerCase());

    // Check key format
    if (field.key && !/^[a-z][a-z0-9_]*$/.test(field.key)) {
      errors.push(`${fieldLabel}: Key must start with a letter and contain only lowercase letters, numbers, and underscores`);
    }

    // Check options for select fields
    if ((field.type === 'select' || field.type === 'multiselect') && 
        (!field.options || field.options.length === 0)) {
      errors.push(`${fieldLabel}: Options are required for ${field.type} fields`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
