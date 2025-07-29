/**
 * Rule Condition Builder Component for SynkBoard
 * Visual builder for creating rule conditions with field selection and operators
 */

import React from 'react';
import {
  Button,
  FormField,
  Input,
  Select,
  DatePicker,
} from '@/components/ui';
import {
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { EntityWithFields, RuleCondition } from '@synkboard/types';

type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'is_null' | 'is_not_null';

export interface RuleConditionBuilderProps {
  entity?: EntityWithFields;
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
  disabled?: boolean;
}

const OPERATORS: { value: FilterOperator; label: string; types: string[] }[] = [
  { value: 'eq', label: 'equals', types: ['text', 'number', 'boolean', 'date', 'select', 'user'] },
  { value: 'ne', label: 'not equals', types: ['text', 'number', 'boolean', 'date', 'select', 'user'] },
  { value: 'gt', label: 'greater than', types: ['number', 'date', 'rating'] },
  { value: 'gte', label: 'greater than or equal', types: ['number', 'date', 'rating'] },
  { value: 'lt', label: 'less than', types: ['number', 'date', 'rating'] },
  { value: 'lte', label: 'less than or equal', types: ['number', 'date', 'rating'] },
  { value: 'contains', label: 'contains', types: ['text', 'json'] },
  { value: 'not_contains', label: 'does not contain', types: ['text', 'json'] },
  { value: 'starts_with', label: 'starts with', types: ['text'] },
  { value: 'ends_with', label: 'ends with', types: ['text'] },
  { value: 'in', label: 'is one of', types: ['text', 'number', 'select', 'multiselect'] },
  { value: 'not_in', label: 'is not one of', types: ['text', 'number', 'select', 'multiselect'] },
  { value: 'is_null', label: 'is empty', types: ['text', 'number', 'date', 'select', 'user', 'json'] },
  { value: 'is_not_null', label: 'is not empty', types: ['text', 'number', 'date', 'select', 'user', 'json'] },
];

export function RuleConditionBuilder({
  entity,
  conditions,
  onChange,
  disabled = false,
}: RuleConditionBuilderProps) {
  const addCondition = () => {
    const newCondition: RuleCondition = {
      field: '',
      operator: 'eq',
      value: '',
    };
    onChange([...conditions, newCondition]);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(newConditions);
  };

  const getFieldOptions = () => {
    if (!entity?.fields) return [];
    
    return entity.fields.map(field => ({
      value: field.key,
      label: `${field.name} (${field.type})`,
      type: field.type,
    }));
  };

  const getOperatorOptions = (fieldType?: string) => {
    if (!fieldType) return OPERATORS.map(op => ({ value: op.value, label: op.label }));
    
    return OPERATORS
      .filter(op => op.types.includes(fieldType))
      .map(op => ({ value: op.value, label: op.label }));
  };

  const getSelectedField = (fieldKey: string) => {
    return entity?.fields?.find(field => field.key === fieldKey);
  };

  const renderValueInput = (condition: RuleCondition, index: number) => {
    const field = getSelectedField(condition.field);
    
    // No value input needed for null checks
    if (condition.operator === 'is_null' || condition.operator === 'is_not_null') {
      return null;
    }

    if (!field) {
      return (
        <Input
          value={condition.value || ''}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
          placeholder="Enter value"
          disabled={disabled}
        />
      );
    }

    switch (field.type) {
      case 'number':
      case 'rating':
        return (
          <Input
            type="number"
            value={condition.value || ''}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            placeholder="Enter number"
            disabled={disabled}
          />
        );

      case 'boolean':
        return (
          <Select
            options={[
              { value: 'true', label: 'True' },
              { value: 'false', label: 'False' },
            ]}
            value={String(condition.value)}
            onChange={(value) => updateCondition(index, { value: value === 'true' })}
            placeholder="Select value"
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <DatePicker
            value={condition.value}
            onChange={(value) => updateCondition(index, { value })}
            placeholder="Select date"
            disabled={disabled}
          />
        );

      case 'select':
        if (field.options) {
          return (
            <Select
              options={field.options.map(opt => ({ value: opt, label: opt }))}
              value={condition.value}
              onChange={(value) => updateCondition(index, { value })}
              placeholder="Select value"
              disabled={disabled}
            />
          );
        }
        break;

      case 'multiselect':
        if (field.options && (condition.operator === 'in' || condition.operator === 'not_in')) {
          return (
            <Select
              options={field.options.map(opt => ({ value: opt, label: opt }))}
              value={condition.value}
              onChange={(value) => updateCondition(index, { value })}
              placeholder="Select values"
              multiple
              disabled={disabled}
            />
          );
        }
        break;
    }

    // Default text input
    return (
      <Input
        value={condition.value || ''}
        onChange={(e) => updateCondition(index, { value: e.target.value })}
        placeholder="Enter value"
        disabled={disabled}
      />
    );
  };

  const fieldOptions = getFieldOptions();

  return (
    <div className="space-y-4">
      {conditions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No conditions defined yet.</p>
          <p className="text-sm">Add conditions to specify when this rule should trigger.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conditions.map((condition, index) => {
            const selectedField = getSelectedField(condition.field);
            const operatorOptions = getOperatorOptions(selectedField?.type);

            return (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">
                    Condition {index + 1}
                    {index > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">AND</span>
                    )}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    disabled={disabled}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Field" required>
                    <Select
                      options={fieldOptions}
                      value={condition.field}
                      onChange={(value) => {
                        // Reset operator and value when field changes
                        updateCondition(index, { 
                          field: value, 
                          operator: 'eq',
                          value: '',
                        });
                      }}
                      placeholder="Select field"
                      disabled={disabled}
                    />
                  </FormField>

                  <FormField label="Operator" required>
                    <Select
                      options={operatorOptions}
                      value={condition.operator}
                      onChange={(value) => updateCondition(index, { 
                        operator: value as FilterOperator,
                        value: '', // Reset value when operator changes
                      })}
                      placeholder="Select operator"
                      disabled={disabled || !condition.field}
                    />
                  </FormField>

                  <FormField label="Value">
                    {renderValueInput(condition, index)}
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addCondition}
          disabled={disabled || !entity}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Add Condition
        </Button>
      </div>

      {conditions.length > 1 && (
        <div className="text-sm text-muted-foreground text-center">
          All conditions must be met for the rule to trigger (AND logic)
        </div>
      )}
    </div>
  );
}
