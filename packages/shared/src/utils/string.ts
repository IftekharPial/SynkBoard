/**
 * String utilities for SynkBoard
 * Pure string manipulation functions
 */

/**
 * Convert string to kebab-case (lowercase with hyphens)
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[a-z]/, char => char.toUpperCase());
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Convert string to Title Case
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate a slug from a string
 */
export function generateSlug(str: string): string {
  return toKebabCase(str);
}

/**
 * Pluralize a word based on count
 */
export function pluralize(word: string, count: number): string {
  if (count === 1) {
    return word;
  }

  // Simple pluralization rules
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es';
  }
  return word + 's';
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 8, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Check if string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Extract words from string
 */
export function extractWords(str: string): string[] {
  return str.match(/\b\w+\b/g) || [];
}

/**
 * Count words in string
 */
export function countWords(str: string): number {
  return extractWords(str).length;
}

/**
 * Highlight search terms in text
 */
export function highlightText(text: string, searchTerm: string, highlightClass: string = 'highlight'): string {
  if (!searchTerm) {
    return text;
  }
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
}

/**
 * Escape special regex characters
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert bytes to human readable string
 */
export function bytesToString(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Parse template string with variables
 */
export function parseTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const value = variables[trimmedKey];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Generate initials from full name
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Mask sensitive information (e.g., email, phone)
 */
export function maskString(str: string, visibleStart: number = 2, visibleEnd: number = 2, maskChar: string = '*'): string {
  if (str.length <= visibleStart + visibleEnd) {
    return str;
  }
  
  const start = str.substring(0, visibleStart);
  const end = str.substring(str.length - visibleEnd);
  const maskLength = str.length - visibleStart - visibleEnd;
  const mask = maskChar.repeat(maskLength);
  
  return start + mask + end;
}

/**
 * Convert string to boolean
 */
export function stringToBoolean(str: string): boolean {
  const truthyValues = ['true', '1', 'yes', 'on', 'enabled'];
  return truthyValues.includes(str.toLowerCase());
}

/**
 * Format string as currency
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Remove accents from string
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Check if string is empty or whitespace only
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Pad string to specified length
 */
export function padString(str: string, length: number, padChar: string = ' ', padLeft: boolean = false): string {
  if (str.length >= length) {
    return str;
  }
  
  const padding = padChar.repeat(length - str.length);
  return padLeft ? padding + str : str + padding;
}
