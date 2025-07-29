/**
 * Tabs component for SynkBoard
 * Accessible tab navigation with keyboard support
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tabsListVariants = cva(
  'inline-flex items-center justify-center rounded-md p-1',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        underline: 'border-b border-border',
        pills: 'bg-muted/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        underline: 'border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none',
        pills: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

export interface TabsProps extends VariantProps<typeof tabsListVariants> {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));

TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & 
  VariantProps<typeof tabsTriggerVariants> & {
    value: string;
    active?: boolean;
  }
>(({ className, variant, value, active, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    data-state={active ? 'active' : 'inactive'}
    data-value={value}
    {...props}
  />
));

TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    active?: boolean;
  }
>(({ className, value, active, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      !active && 'hidden',
      className
    )}
    data-state={active ? 'active' : 'inactive'}
    data-value={value}
    {...props}
  />
));

TabsContent.displayName = 'TabsContent';

const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  onValueChange,
  variant = 'default',
  className,
  orientation = 'horizontal',
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const currentIndex = items.findIndex(item => item.value === value);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    const nextItem = items[nextIndex];
    if (nextItem && !nextItem.disabled) {
      onValueChange(nextItem.value);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <TabsList
        variant={variant}
        className={cn(
          orientation === 'vertical' && 'flex-col h-auto w-auto',
          variant === 'underline' && 'bg-transparent p-0'
        )}
        role="tablist"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant={variant}
            active={value === item.value}
            disabled={item.disabled}
            onClick={() => !item.disabled && onValueChange(item.value)}
            className={cn(
              orientation === 'vertical' && 'w-full justify-start',
              variant === 'underline' && 'px-4 py-2'
            )}
            role="tab"
            aria-selected={value === item.value}
            aria-controls={`tabpanel-${item.value}`}
            id={`tab-${item.value}`}
          >
            {item.icon && (
              <span className="mr-2 h-4 w-4">
                {item.icon}
              </span>
            )}
            {item.label}
            {item.badge && (
              <span className="ml-2">
                {item.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};

// Controlled Tabs with Content
export interface ControlledTabsProps extends TabsProps {
  children: React.ReactNode;
}

const ControlledTabs: React.FC<ControlledTabsProps> = ({
  children,
  ...tabsProps
}) => {
  return (
    <div className="w-full">
      <Tabs {...tabsProps} />
      <div className="mt-4">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.props.value === tabsProps.value) {
            return React.cloneElement(child, { active: true });
          }
          return null;
        })}
      </div>
    </div>
  );
};

// Simple Tabs Hook
export function useTabs(defaultValue: string) {
  const [value, setValue] = React.useState(defaultValue);
  
  return {
    value,
    onValueChange: setValue,
  };
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ControlledTabs,
  tabsListVariants,
  tabsTriggerVariants,
};
