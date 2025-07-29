/**
 * Input components for SynkBoard
 * Includes text, email, password, number inputs with validation states
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visible:ring-success',
      },
      size: {
        default: 'h-10',
        sm: 'h-9 px-2 text-xs',
        lg: 'h-11 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  success?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type = 'text',
    leftIcon,
    rightIcon,
    error,
    success,
    helperText,
    ...props 
  }, ref) => {
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const finalVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

    const inputElement = (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: finalVariant, size }),
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (leftIcon || rightIcon || error || success || helperText) {
      return (
        <div className="space-y-1">
          <div className="relative">
            {leftIcon && (
              <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                {leftIcon}
              </div>
            )}
            {inputElement}
            {rightIcon && (
              <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                {rightIcon}
              </div>
            )}
          </div>
          {(error || success || helperText) && (
            <p className={cn(
              'text-xs',
              hasError && 'text-destructive',
              hasSuccess && 'text-success',
              !hasError && !hasSuccess && 'text-muted-foreground'
            )}>
              {error || success || helperText}
            </p>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

// Password Input Component
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const toggleIcon = showPassword ? EyeSlashIcon : EyeIcon;

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground"
            >
              {React.createElement(toggleIcon, { className: 'h-4 w-4' })}
            </button>
          ) : undefined
        }
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// Textarea Component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  error?: string;
  success?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size,
    error,
    success,
    helperText,
    ...props 
  }, ref) => {
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const finalVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

    const textareaElement = (
      <textarea
        className={cn(
          inputVariants({ variant: finalVariant, size }),
          'min-h-[80px] resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (error || success || helperText) {
      return (
        <div className="space-y-1">
          {textareaElement}
          <p className={cn(
            'text-xs',
            hasError && 'text-destructive',
            hasSuccess && 'text-success',
            !hasError && !hasSuccess && 'text-muted-foreground'
          )}>
            {error || success || helperText}
          </p>
        </div>
      );
    }

    return textareaElement;
  }
);

Textarea.displayName = 'Textarea';

export { Input, PasswordInput, Textarea, inputVariants };
