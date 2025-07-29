/**
 * Dropdown menu component for SynkBoard
 * Accessible dropdown with keyboard navigation and positioning
 */

import React from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  onClick?: () => void;
  href?: string;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  contentClassName?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'start',
  side = 'bottom',
  className,
  contentClassName,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Filter out separator-only items for keyboard navigation
  const navigableItems = items.filter(item => !item.separator);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < navigableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : navigableItems.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0) {
          const item = navigableItems[focusedIndex];
          if (!item.disabled) {
            item.onClick?.();
            setIsOpen(false);
            setFocusedIndex(-1);
          }
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    item.onClick?.();
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="focus:outline-none"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
            alignmentClasses[align],
            sideClasses[side],
            contentClassName
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            if (item.separator) {
              return (
                <div
                  key={item.key}
                  className="my-1 h-px bg-border"
                  role="separator"
                />
              );
            }

            const navigableIndex = navigableItems.findIndex(navItem => navItem.key === item.key);
            const isFocused = navigableIndex === focusedIndex;

            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  item.disabled
                    ? 'pointer-events-none opacity-50'
                    : 'focus:bg-accent focus:text-accent-foreground',
                  item.destructive && !item.disabled && 'text-destructive focus:bg-destructive/10',
                  isFocused && 'bg-accent text-accent-foreground'
                )}
                role="menuitem"
                tabIndex={-1}
              >
                {item.icon && (
                  <span className="mr-2 h-4 w-4">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Dropdown Button Component
export interface DropdownButtonProps extends DropdownProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

const DropdownButton: React.FC<DropdownButtonProps> = ({
  children,
  variant = 'outline',
  size = 'default',
  disabled = false,
  ...dropdownProps
}) => {
  const trigger = (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      rightIcon={<ChevronDownIcon className="h-4 w-4" />}
    >
      {children}
    </Button>
  );

  return <Dropdown {...dropdownProps} trigger={trigger} />;
};

// Context Menu Component
export interface ContextMenuProps {
  children: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} className={className}>
        {children}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          style={{
            left: position.x,
            top: position.y,
          }}
          role="menu"
        >
          {items.map((item) => {
            if (item.separator) {
              return (
                <div
                  key={item.key}
                  className="my-1 h-px bg-border"
                  role="separator"
                />
              );
            }

            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  item.disabled
                    ? 'pointer-events-none opacity-50'
                    : 'hover:bg-accent hover:text-accent-foreground',
                  item.destructive && !item.disabled && 'text-destructive hover:bg-destructive/10'
                )}
                role="menuitem"
              >
                {item.icon && (
                  <span className="mr-2 h-4 w-4">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export { Dropdown, DropdownButton, ContextMenu };
