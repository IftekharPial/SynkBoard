/**
 * Date picker component for SynkBoard
 * Date and time selection with calendar interface
 */

import React from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  format?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  error,
  className,
  minDate,
  maxDate,
  showTime = false,
  format = showTime ? 'MMM dd, yyyy HH:mm' : 'MMM dd, yyyy',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(value || new Date());
  const [inputValue, setInputValue] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      ...(showTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }).format(date);
  };

  // Update input value when value changes
  React.useEffect(() => {
    setInputValue(value ? formatDate(value) : '');
  }, [value, showTime]);

  // Close calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    if (showTime && value) {
      // Preserve time when selecting date
      const newDate = new Date(date);
      newDate.setHours(value.getHours(), value.getMinutes());
      onChange(newDate);
    } else {
      onChange(date);
    }
    
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        rightIcon={
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        }
        onFocus={() => !disabled && setIsOpen(true)}
        readOnly
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-3">
          <Calendar
            value={value}
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            onDateSelect={handleDateSelect}
            isDateDisabled={isDateDisabled}
          />
          
          {showTime && (
            <div className="border-t border-border pt-3 mt-3">
              <TimePicker
                value={value}
                onChange={handleTimeChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Calendar Component
interface CalendarProps {
  value?: Date;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  isDateDisabled?: (date: Date) => boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  value,
  viewDate,
  onViewDateChange,
  onDateSelect,
  isDateDisabled = () => false,
}) => {
  const today = new Date();
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Generate calendar days
  const days = [];
  
  // Previous month days
  const prevMonth = new Date(currentYear, currentMonth - 1, 0);
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = prevMonth.getDate() - i;
    days.push({
      date: new Date(currentYear, currentMonth - 1, day),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(currentYear, currentMonth, day),
      isCurrentMonth: true,
    });
  }

  // Next month days
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(currentYear, currentMonth + 1, day),
      isCurrentMonth: false,
    });
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    newDate.setMonth(currentMonth + (direction === 'next' ? 1 : -1));
    onViewDateChange(newDate);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(currentYear + (direction === 'next' ? 1 : -1));
    onViewDateChange(newDate);
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  return (
    <div className="w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateYear('prev')}
          >
            <ChevronLeftIcon className="h-3 w-3" />
            <ChevronLeftIcon className="h-3 w-3 -ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-sm font-medium">
          {viewDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateYear('next')}
          >
            <ChevronRightIcon className="h-3 w-3" />
            <ChevronRightIcon className="h-3 w-3 -ml-1" />
          </Button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected = value && isSameDay(day.date, value);
          const isToday = isSameDay(day.date, today);
          const isDisabled = isDateDisabled(day.date);

          return (
            <button
              key={index}
              onClick={() => !isDisabled && onDateSelect(day.date)}
              disabled={isDisabled}
              className={cn(
                'h-8 w-8 text-xs rounded-md transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                !day.isCurrentMonth && 'text-muted-foreground/50',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                isToday && !isSelected && 'bg-accent font-medium',
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Time Picker Component
interface TimePickerProps {
  value?: Date;
  onChange: (hours: number, minutes: number) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const hours = value?.getHours() || 0;
  const minutes = value?.getMinutes() || 0;

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm text-muted-foreground">Time:</div>
      <select
        value={hours}
        onChange={(e) => onChange(parseInt(e.target.value), minutes)}
        className="px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground">:</span>
      <select
        value={minutes}
        onChange={(e) => onChange(hours, parseInt(e.target.value))}
        className="px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {Array.from({ length: 60 }, (_, i) => (
          <option key={i} value={i}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  );
};

// Date Range Picker
export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  placeholder = 'Select date range...',
  disabled = false,
  error,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectingEnd, setSelectingEnd] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const formatDateRange = (): string => {
    if (!startDate && !endDate) return '';
    if (startDate && !endDate) return `${startDate.toLocaleDateString()} - ...`;
    if (!startDate && endDate) return `... - ${endDate.toLocaleDateString()}`;
    return `${startDate!.toLocaleDateString()} - ${endDate!.toLocaleDateString()}`;
  };

  const handleDateSelect = (date: Date) => {
    if (!selectingEnd && !startDate) {
      onChange(date, endDate);
      setSelectingEnd(true);
    } else if (selectingEnd || (startDate && !endDate)) {
      if (startDate && date < startDate) {
        onChange(date, startDate);
      } else {
        onChange(startDate, date);
      }
      setSelectingEnd(false);
      setIsOpen(false);
    } else {
      onChange(date, undefined);
      setSelectingEnd(true);
    }
  };

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingEnd(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Input
        value={formatDateRange()}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        rightIcon={
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        }
        onFocus={() => !disabled && setIsOpen(true)}
        readOnly
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-3">
          <div className="mb-2 text-xs text-muted-foreground">
            {selectingEnd ? 'Select end date' : 'Select start date'}
          </div>
          <Calendar
            value={selectingEnd ? endDate : startDate}
            viewDate={startDate || new Date()}
            onViewDateChange={() => {}}
            onDateSelect={handleDateSelect}
          />
        </div>
      )}
    </div>
  );
};

export { DatePicker, DateRangePicker };
