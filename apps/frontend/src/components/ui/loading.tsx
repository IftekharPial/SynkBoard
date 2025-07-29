/**
 * Loading and skeleton components for SynkBoard
 * Various loading states and skeleton placeholders
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Spinner Component
const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-primary',
        muted: 'text-muted-foreground',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        {...props}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

// Loading Component
export interface LoadingProps {
  size?: 'sm' | 'default' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'default', 
  text = 'Loading...', 
  className 
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <Spinner size={size} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

// Skeleton Component
const skeletonVariants = cva(
  'animate-pulse rounded-md bg-muted',
  {
    variants: {
      variant: {
        default: '',
        text: 'h-4',
        heading: 'h-6',
        button: 'h-10',
        avatar: 'rounded-full',
        card: 'h-32',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, style, ...props }, ref) => {
    const skeletonStyle = {
      ...style,
      ...(width && { width }),
      ...(height && { height }),
    };

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        style={skeletonStyle}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Skeleton patterns for common layouts
const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3', className)}>
    <Skeleton variant="heading" />
    <SkeletonText lines={2} />
    <div className="flex space-x-2">
      <Skeleton variant="button" width={80} />
      <Skeleton variant="button" width={80} />
    </div>
  </div>
);

const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string; 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${100 / columns}%`} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={colIndex} 
            variant="text" 
            width={`${100 / columns}%`}
            className="h-8"
          />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonAvatar: React.FC<{ 
  size?: 'sm' | 'default' | 'lg'; 
  className?: string; 
}> = ({ 
  size = 'default', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton
      variant="avatar"
      className={cn(sizeClasses[size], className)}
    />
  );
};

// Page Loading Component
const PageLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
    <Loading size="lg" text="Loading..." />
  </div>
);

// Inline Loading Component
const InlineLoading: React.FC<{ 
  text?: string; 
  className?: string; 
}> = ({ 
  text = 'Loading...', 
  className 
}) => (
  <div className={cn('flex items-center space-x-2', className)}>
    <Spinner size="sm" />
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

// Button Loading State
const ButtonLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center space-x-2', className)}>
    <Spinner size="sm" variant="white" />
    <span>Loading...</span>
  </div>
);

// Full Page Loading Overlay
const LoadingOverlay: React.FC<{ 
  visible: boolean; 
  text?: string; 
  className?: string; 
}> = ({ 
  visible, 
  text = 'Loading...', 
  className 
}) => {
  if (!visible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
      className
    )}>
      <Loading size="xl" text={text} />
    </div>
  );
};

export {
  Spinner,
  Loading,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  PageLoading,
  InlineLoading,
  ButtonLoading,
  LoadingOverlay,
  spinnerVariants,
  skeletonVariants,
};
