/**
 * Validation utilities for SynkBoard
 * Pure validation functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate slug format (lowercase, alphanumeric, hyphens)
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 50;
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexRegex.test(color);
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate field key format (snake_case)
 */
export function isValidFieldKey(key: string): boolean {
  const keyRegex = /^[a-z_][a-z0-9_]*$/;
  return keyRegex.test(key) && key.length >= 1 && key.length <= 50;
}

/**
 * Validate JSON string
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}

/**
 * Validate widget configuration based on type
 */
export function validateWidgetConfig(type: string, config: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { isValid: false, errors };
  }

  // Common validations
  if (!config.entity_slug || typeof config.entity_slug !== 'string') {
    errors.push('entity_slug is required and must be a string');
  }

  if (!config.metric_type || !['count', 'sum', 'avg', 'min', 'max'].includes(config.metric_type)) {
    errors.push('metric_type is required and must be one of: count, sum, avg, min, max');
  }

  // Type-specific validations
  switch (type) {
    case 'kpi':
      if (config.show_trend && typeof config.show_trend !== 'boolean') {
        errors.push('show_trend must be a boolean');
      }
      if (config.trend_period_days && (!Number.isInteger(config.trend_period_days) || config.trend_period_days < 1 || config.trend_period_days > 365)) {
        errors.push('trend_period_days must be an integer between 1 and 365');
      }
      break;

    case 'bar':
    case 'line':
    case 'pie':
      if (!config.group_by || typeof config.group_by !== 'string') {
        errors.push('group_by is required for chart widgets');
      }
      if (config.limit && (!Number.isInteger(config.limit) || config.limit < 1 || config.limit > 50)) {
        errors.push('limit must be an integer between 1 and 50');
      }
      break;

    case 'table':
      if (!config.columns || !Array.isArray(config.columns) || config.columns.length === 0) {
        errors.push('columns is required and must be a non-empty array');
      }
      if (config.page_size && (!Number.isInteger(config.page_size) || config.page_size < 5 || config.page_size > 100)) {
        errors.push('page_size must be an integer between 5 and 100');
      }
      break;

    case 'list':
      if (!config.title_field || typeof config.title_field !== 'string') {
        errors.push('title_field is required for list widgets');
      }
      if (config.limit && (!Number.isInteger(config.limit) || config.limit < 1 || config.limit > 20)) {
        errors.push('limit must be an integer between 1 and 20');
      }
      break;

    default:
      errors.push(`Unsupported widget type: ${type}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate dashboard layout configuration
 */
export function validateDashboardLayout(layout: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!layout) {
    return { isValid: true, errors }; // Layout is optional
  }

  if (typeof layout !== 'object') {
    errors.push('Layout must be an object');
    return { isValid: false, errors };
  }

  // Validate grid layout if present
  if (layout.grid && Array.isArray(layout.grid)) {
    layout.grid.forEach((item: any, index: number) => {
      if (!item.i || typeof item.i !== 'string') {
        errors.push(`Grid item ${index}: 'i' (id) is required and must be a string`);
      }
      if (!Number.isInteger(item.x) || item.x < 0) {
        errors.push(`Grid item ${index}: 'x' must be a non-negative integer`);
      }
      if (!Number.isInteger(item.y) || item.y < 0) {
        errors.push(`Grid item ${index}: 'y' must be a non-negative integer`);
      }
      if (!Number.isInteger(item.w) || item.w < 1) {
        errors.push(`Grid item ${index}: 'w' (width) must be a positive integer`);
      }
      if (!Number.isInteger(item.h) || item.h < 1) {
        errors.push(`Grid item ${index}: 'h' (height) must be a positive integer`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}, options: {
  maxSize?: number;
  allowedTypes?: string[];
} = {}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options; // 10MB default

  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    errors.push('Start date is invalid');
  }

  if (isNaN(end.getTime())) {
    errors.push('End date is invalid');
  }

  if (start >= end) {
    errors.push('Start date must be before end date');
  }

  // Check if date range is reasonable (not more than 2 years)
  const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
  if (end.getTime() - start.getTime() > maxRange) {
    errors.push('Date range cannot exceed 2 years');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
