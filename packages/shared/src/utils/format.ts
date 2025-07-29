/**
 * Formatting utilities for SynkBoard
 * Pure functions for data formatting and display
 */

/**
 * Format numbers for display in widgets
 */
export function formatNumber(value: number, options?: {
  decimals?: number;
  compact?: boolean;
  currency?: string;
  percentage?: boolean;
}): string {
  const { decimals = 0, compact = false, currency, percentage = false } = options || {};

  if (percentage) {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format dates for display
 */
export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    return formatRelativeTime(dateObj);
  }

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  };

  const options = optionsMap[format];

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, 'short');
  }
}

/**
 * Format field values based on field type
 */
export function formatFieldValue(value: any, fieldType: string): string {
  if (value === null || value === undefined) {
    return '-';
  }

  switch (fieldType) {
    case 'number':
      return formatNumber(Number(value));
    
    case 'boolean':
      return value ? 'Yes' : 'No';
    
    case 'date':
      return formatDate(value);
    
    case 'rating':
      return `${value}/5 ⭐`;
    
    case 'multiselect':
      return Array.isArray(value) ? value.join(', ') : String(value);
    
    case 'text':
    case 'select':
    case 'user':
    case 'json':
    default:
      return String(value);
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate color for chart data points
 */
export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): {
  value: number;
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
} {
  const difference = current - previous;
  const percentage = previous === 0 ? 0 : (difference / previous) * 100;
  
  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (difference > 0) direction = 'up';
  else if (difference < 0) direction = 'down';

  return {
    value: difference,
    percentage: Math.round(percentage * 100) / 100,
    direction,
  };
}

/**
 * Format trend indicator
 */
export function formatTrend(trend: {
  value: number;
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
}): string {
  const { value, percentage, direction } = trend;
  const arrow = direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→';
  const sign = value >= 0 ? '+' : '';
  
  return `${arrow} ${sign}${formatNumber(value)} (${sign}${percentage}%)`;
}

/**
 * Sanitize string for use as CSS class or ID
 */
export function sanitizeForCSS(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// getInitials function moved to string.ts to avoid duplication

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}
