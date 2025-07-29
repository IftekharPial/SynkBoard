/**
 * Form components for SynkBoard
 * Form fields with validation and error handling
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  horizontal?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  description,
  error,
  required = false,
  children,
  className,
  labelClassName,
  horizontal = false,
}) => {
  return (
    <div className={cn('space-y-2', horizontal && 'flex items-start space-y-0 space-x-4', className)}>
      {label && (
        <div className={cn(horizontal && 'w-1/3 pt-2')}>
          <label className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            labelClassName
          )}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(horizontal && 'flex-1')}>
        {children}
        {error && (
          <p className="text-xs text-destructive mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

// Form Group Component
export interface FormGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium leading-6 text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form Actions Component
export interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'right',
  className,
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn(
      'flex items-center space-x-2 pt-6 border-t border-border',
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

// Form Root Component
export interface FormProps {
  onSubmit?: (event: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
  noValidate?: boolean;
}

const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  className,
  noValidate = true,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      noValidate={noValidate}
      className={cn('space-y-6', className)}
    >
      {children}
    </form>
  );
};

// Field Array Component for dynamic fields
export interface FieldArrayProps {
  children: (props: {
    fields: any[];
    append: (value: any) => void;
    remove: (index: number) => void;
    move: (from: number, to: number) => void;
  }) => React.ReactNode;
  value: any[];
  onChange: (value: any[]) => void;
}

const FieldArray: React.FC<FieldArrayProps> = ({
  children,
  value = [],
  onChange,
}) => {
  const append = (newValue: any) => {
    onChange([...value, newValue]);
  };

  const remove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const move = (from: number, to: number) => {
    const newValue = [...value];
    const [removed] = newValue.splice(from, 1);
    newValue.splice(to, 0, removed);
    onChange(newValue);
  };

  return (
    <>
      {children({
        fields: value,
        append,
        remove,
        move,
      })}
    </>
  );
};

// Form validation hook
export interface ValidationRule {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: any) => string | boolean;
}

export interface FormState {
  [key: string]: {
    value: any;
    error?: string;
    touched: boolean;
  };
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, ValidationRule>>
) {
  const [formState, setFormState] = React.useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        touched: false,
      };
    });
    return state;
  });

  const validateField = (name: keyof T, value: any): string | undefined => {
    const rules = validationRules?.[name];
    if (!rules) return undefined;

    // Required validation
    if (rules.required) {
      const isEmpty = value === undefined || value === null || value === '';
      if (isEmpty) {
        return typeof rules.required === 'string' 
          ? rules.required 
          : `${String(name)} is required`;
      }
    }

    // Skip other validations if empty and not required
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    // Min length validation
    if (rules.minLength) {
      const minLength = typeof rules.minLength === 'number' 
        ? rules.minLength 
        : rules.minLength.value;
      const message = typeof rules.minLength === 'object' 
        ? rules.minLength.message 
        : `${String(name)} must be at least ${minLength} characters`;
      
      if (String(value).length < minLength) {
        return message;
      }
    }

    // Max length validation
    if (rules.maxLength) {
      const maxLength = typeof rules.maxLength === 'number' 
        ? rules.maxLength 
        : rules.maxLength.value;
      const message = typeof rules.maxLength === 'object' 
        ? rules.maxLength.message 
        : `${String(name)} must be no more than ${maxLength} characters`;
      
      if (String(value).length > maxLength) {
        return message;
      }
    }

    // Pattern validation
    if (rules.pattern) {
      const pattern = typeof rules.pattern === 'object' && 'value' in rules.pattern
        ? rules.pattern.value 
        : rules.pattern as RegExp;
      const message = typeof rules.pattern === 'object' && 'message' in rules.pattern
        ? rules.pattern.message 
        : `${String(name)} format is invalid`;
      
      if (!pattern.test(String(value))) {
        return message;
      }
    }

    // Custom validation
    if (rules.validate) {
      const result = rules.validate(value);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return `${String(name)} is invalid`;
      }
    }

    return undefined;
  };

  const setValue = (name: keyof T, value: any, shouldValidate = true) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: shouldValidate ? validateField(name, value) : prev[name]?.error,
        touched: true,
      },
    }));
  };

  const setError = (name: keyof T, error: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  };

  const clearError = (name: keyof T) => {
    setFormState(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error: undefined,
      },
    }));
  };

  const validateAll = (): boolean => {
    let isValid = true;
    const newState = { ...formState };

    Object.keys(formState).forEach(key => {
      const error = validateField(key as keyof T, formState[key].value);
      newState[key] = {
        ...newState[key],
        error,
        touched: true,
      };
      if (error) {
        isValid = false;
      }
    });

    setFormState(newState);
    return isValid;
  };

  const reset = (newValues?: Partial<T>) => {
    const resetValues = newValues || initialValues;
    const newState: FormState = {};
    
    Object.keys(formState).forEach(key => {
      newState[key] = {
        value: resetValues[key as keyof T] ?? initialValues[key as keyof T],
        touched: false,
        error: undefined,
      };
    });
    
    setFormState(newState);
  };

  const getValues = (): T => {
    const values = {} as T;
    Object.keys(formState).forEach(key => {
      values[key as keyof T] = formState[key].value;
    });
    return values;
  };

  const getFieldProps = (name: keyof T) => ({
    value: formState[name]?.value ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      setValue(name, e.target.value),
    error: formState[name]?.error,
    onBlur: () => {
      if (!formState[name]?.touched) {
        setFormState(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            touched: true,
            error: validateField(name, prev[name]?.value),
          },
        }));
      }
    },
  });

  const hasErrors = Object.values(formState).some(field => field.error);
  const isDirty = Object.values(formState).some(field => field.touched);

  return {
    formState,
    setValue,
    setError,
    clearError,
    validateAll,
    reset,
    getValues,
    getFieldProps,
    hasErrors,
    isDirty,
  };
}

export {
  Form,
  FormField,
  FormGroup,
  FormActions,
  FieldArray,
};
