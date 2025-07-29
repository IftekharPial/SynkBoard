/**
 * Badge component for SynkBoard
 * Status indicators, labels, and notification badges
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        success: 'border-transparent bg-success text-success-foreground hover:bg-success/80',
        warning: 'border-transparent bg-warning text-warning-foreground hover:bg-warning/80',
        outline: 'text-foreground border-border',
        ghost: 'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, dot, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
        )}
        {icon && (
          <span className="mr-1 h-3 w-3">
            {icon}
          </span>
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge Component
export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning';
  text?: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  text, 
  className 
}) => {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      text: text || 'Active',
      dot: true,
    },
    inactive: {
      variant: 'secondary' as const,
      text: text || 'Inactive',
      dot: true,
    },
    pending: {
      variant: 'warning' as const,
      text: text || 'Pending',
      dot: true,
    },
    error: {
      variant: 'destructive' as const,
      text: text || 'Error',
      dot: true,
    },
    success: {
      variant: 'success' as const,
      text: text || 'Success',
      dot: true,
    },
    warning: {
      variant: 'warning' as const,
      text: text || 'Warning',
      dot: true,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      className={className}
    >
      {config.text}
    </Badge>
  );
};

// Role Badge Component
export interface RoleBadgeProps {
  role: 'superadmin' | 'admin' | 'editor' | 'analyst' | 'viewer' | 'integration';
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const roleConfig = {
    superadmin: {
      variant: 'destructive' as const,
      text: 'Super Admin',
    },
    admin: {
      variant: 'default' as const,
      text: 'Admin',
    },
    editor: {
      variant: 'success' as const,
      text: 'Editor',
    },
    analyst: {
      variant: 'secondary' as const,
      text: 'Analyst',
    },
    viewer: {
      variant: 'outline' as const,
      text: 'Viewer',
    },
    integration: {
      variant: 'ghost' as const,
      text: 'Integration',
    },
  };

  const config = roleConfig[role];

  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  );
};

// Priority Badge Component
export interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const priorityConfig = {
    low: {
      variant: 'secondary' as const,
      text: 'Low',
    },
    medium: {
      variant: 'warning' as const,
      text: 'Medium',
    },
    high: {
      variant: 'default' as const,
      text: 'High',
    },
    critical: {
      variant: 'destructive' as const,
      text: 'Critical',
    },
  };

  const config = priorityConfig[priority];

  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  );
};

// Count Badge Component
export interface CountBadgeProps {
  count: number;
  max?: number;
  showZero?: boolean;
  className?: string;
}

const CountBadge: React.FC<CountBadgeProps> = ({ 
  count, 
  max = 99, 
  showZero = false, 
  className 
}) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="destructive"
      size="sm"
      className={cn('min-w-[1.25rem] justify-center px-1', className)}
    >
      {displayCount}
    </Badge>
  );
};

// Notification Badge Component
export interface NotificationBadgeProps {
  children: React.ReactNode;
  count?: number;
  dot?: boolean;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  children,
  count,
  dot = false,
  className,
}) => {
  const showBadge = dot || (count !== undefined && count > 0);

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      {showBadge && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
          {dot ? (
            <span className="h-2 w-2 rounded-full bg-destructive" />
          ) : (
            <CountBadge count={count!} className="h-4 min-w-[1rem] text-[10px]" />
          )}
        </span>
      )}
    </div>
  );
};

// Tag Badge Component (for categories, labels, etc.)
export interface TagBadgeProps {
  label: string;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const TagBadge: React.FC<TagBadgeProps> = ({
  label,
  color,
  removable = false,
  onRemove,
  className,
}) => {
  const style = color ? { backgroundColor: color, color: 'white' } : undefined;

  return (
    <Badge
      variant={color ? undefined : 'secondary'}
      className={cn('gap-1', className)}
      style={style}
    >
      {label}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-black/20 p-0.5"
        >
          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </Badge>
  );
};

export {
  Badge,
  StatusBadge,
  RoleBadge,
  PriorityBadge,
  CountBadge,
  NotificationBadge,
  TagBadge,
  badgeVariants,
};
