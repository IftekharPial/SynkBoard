/**
 * Select component for SynkBoard
 * Custom select with search and multi-select support
 */

import React from 'react';
import { ChevronDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { inputVariants } from './input';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  success?: string;
  helperText?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({
    options,
    value,
    onChange,
    placeholder = 'Select an option...',
    multiple = false,
    searchable = false,
    disabled = false,
    error,
    success,
    helperText,
    className,
    size = 'default',
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const selectRef = React.useRef<HTMLDivElement>(null);

    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const variant = hasError ? 'error' : hasSuccess ? 'success' : 'default';

    // Filter options based on search term
    const filteredOptions = React.useMemo(() => {
      if (!options || !Array.isArray(options)) return [];
      if (!searchTerm) return options;
      return options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm]);

    // Get selected options
    const selectedOptions = React.useMemo(() => {
      if (!value || !options || !Array.isArray(options)) return [];
      const values = Array.isArray(value) ? value : [value];
      return options.filter(option => values.includes(option.value));
    }, [options, value]);

    // Handle option selection
    const handleOptionSelect = (option: SelectOption) => {
      if (option.disabled) return;

      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.includes(option.value)
          ? currentValues.filter(v => v !== option.value)
          : [...currentValues, option.value];
        onChange(newValues);
      } else {
        onChange(option.value);
        setIsOpen(false);
      }
    };

    // Handle remove option (for multiple select)
    const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiple && Array.isArray(value)) {
        onChange(value.filter(v => v !== optionValue));
      }
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Display value
    const displayValue = React.useMemo(() => {
      if (!selectedOptions.length) return placeholder;
      
      if (multiple) {
        return `${selectedOptions.length} selected`;
      }
      
      return selectedOptions[0].label;
    }, [selectedOptions, placeholder, multiple]);

    const selectElement = (
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            inputVariants({ variant, size }),
            'justify-between cursor-pointer',
            disabled && 'cursor-not-allowed',
            className
          )}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {multiple && selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map(option => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveOption(option.value, e)}
                      className="hover:bg-primary/20 rounded-sm p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className={cn(
                'truncate',
                !selectedOptions.length && 'text-muted-foreground'
              )}>
                {displayValue}
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
            {searchable && (
              <div className="p-2 border-b border-border">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            
            <div className="max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(option.value)
                    : value === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-accent',
                        isSelected && 'bg-accent',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );

    if (error || success || helperText) {
      return (
        <div className="space-y-1" ref={ref}>
          {selectElement}
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

    return (
      <div ref={ref}>
        {selectElement}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
