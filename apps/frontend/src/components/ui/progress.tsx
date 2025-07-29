/**
 * Progress components for SynkBoard
 * Progress bars, circular progress, and step indicators
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
  {
    variants: {
      size: {
        sm: 'h-1',
        default: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    size, 
    value, 
    max = 100, 
    showLabel = false,
    label,
    variant = 'default',
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    };

    return (
      <div className="space-y-2">
        {(showLabel || label) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {label || 'Progress'}
            </span>
            <span className="text-foreground font-medium">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          {...props}
        >
          <div
            className={cn(
              'h-full w-full flex-1 transition-all duration-300 ease-in-out',
              variantClasses[variant]
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Circular Progress Component
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  label,
  variant = 'default',
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantClasses = {
    default: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    destructive: 'stroke-destructive',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-300 ease-in-out', variantClasses[variant])}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {Math.round(percentage)}%
          </span>
          {label && (
            <span className="text-xs text-muted-foreground">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Step Progress Component
export interface StepProgressProps {
  steps: Array<{
    title: string;
    description?: string;
    status: 'pending' | 'current' | 'complete' | 'error';
  }>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  orientation = 'horizontal',
  className,
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn(
      'flex',
      isHorizontal ? 'items-center' : 'flex-col',
      className
    )}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        const statusClasses = {
          pending: 'border-muted bg-background text-muted-foreground',
          current: 'border-primary bg-primary text-primary-foreground',
          complete: 'border-success bg-success text-success-foreground',
          error: 'border-destructive bg-destructive text-destructive-foreground',
        };

        const lineClasses = {
          pending: 'bg-muted',
          current: 'bg-primary',
          complete: 'bg-success',
          error: 'bg-destructive',
        };

        return (
          <div
            key={index}
            className={cn(
              'flex items-center',
              !isHorizontal && 'w-full',
              isHorizontal && !isLast && 'flex-1'
            )}
          >
            <div className={cn(
              'flex items-center',
              isHorizontal ? 'flex-col text-center' : 'flex-row'
            )}>
              {/* Step indicator */}
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                statusClasses[step.status]
              )}>
                {step.status === 'complete' ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : step.status === 'error' ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step content */}
              <div className={cn(
                'space-y-1',
                isHorizontal ? 'mt-2' : 'ml-3 flex-1'
              )}>
                <p className={cn(
                  'text-sm font-medium',
                  step.status === 'current' ? 'text-primary' : 'text-foreground'
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={cn(
                isHorizontal
                  ? 'h-px flex-1 mx-4'
                  : 'w-px h-8 ml-4 mt-2',
                lineClasses[step.status === 'complete' ? 'complete' : 'pending']
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Multi Progress Component (for showing multiple values)
export interface MultiProgressProps {
  values: Array<{
    value: number;
    label?: string;
    color?: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  }>;
  max?: number;
  showLabels?: boolean;
  className?: string;
}

const MultiProgress: React.FC<MultiProgressProps> = ({
  values,
  max = 100,
  showLabels = false,
  className,
}) => {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const normalizedMax = Math.max(max, total);

  return (
    <div className={cn('space-y-2', className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <div className="flex space-x-4">
            {values.map((item, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">
                  {item.label || `Series ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
          <span className="text-foreground font-medium">
            {total} / {normalizedMax}
          </span>
        </div>
      )}
      
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        {values.reduce((acc, item, index) => {
          const percentage = (item.value / normalizedMax) * 100;
          const left = (acc / normalizedMax) * 100;
          
          const variantClasses = {
            default: 'bg-primary',
            success: 'bg-success',
            warning: 'bg-warning',
            destructive: 'bg-destructive',
          };

          return [
            ...acc,
            <div
              key={index}
              className={cn(
                'absolute h-full transition-all duration-300 ease-in-out',
                item.variant ? variantClasses[item.variant] : ''
              )}
              style={{
                left: `${left}%`,
                width: `${percentage}%`,
                backgroundColor: item.color,
              }}
            />,
            acc + item.value,
          ];
        }, [] as any)[0]}
      </div>
    </div>
  );
};

export {
  Progress,
  CircularProgress,
  StepProgress,
  MultiProgress,
  progressVariants,
};
