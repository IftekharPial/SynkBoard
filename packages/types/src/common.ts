/**
 * Common types and schemas for SynkBoard
 * Following naming-conventions.md and api-contracts.md
 */

import { z } from 'zod';

// Base response schemas following api-contracts.md
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  meta: z.object({
    timestamp: z.string().datetime(),
  }),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const ApiResponseSchema = z.union([
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
]);

export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  meta: {
    timestamp: string;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination schemas
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  pages: z.number(),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export interface PaginatedResponse<T> {
  records: T[];
  pagination: PaginationMeta;
}

// Common field validation
export const SlugSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Must be lowercase letters, numbers, and hyphens only');

export const ColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color');

export const EmailSchema = z.string().email();

export const UuidSchema = z.string().uuid();

// Sort and filter schemas
export const SortOrderSchema = z.enum(['asc', 'desc']);

export const FilterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'gt',
  'lt',
  'gte',
  'lte',
  'contains',
  'not_contains',
  'in',
  'not_in',
  'is_empty',
  'is_not_empty',
  'changed',
]);

export type SortOrder = z.infer<typeof SortOrderSchema>;
export type FilterOperator = z.infer<typeof FilterOperatorSchema>;

// Error codes following api-contracts.md
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DASHBOARD_NOT_FOUND: 'DASHBOARD_NOT_FOUND',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FIELD_VALIDATION_FAILED: 'FIELD_VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FIELD_TYPE: 'INVALID_FIELD_TYPE',
  
  // Dynamic Entity Errors
  SCHEMA_UNKNOWN_ENTITY: 'SCHEMA_UNKNOWN_ENTITY',
  DYNAMIC_FIELD_TYPE_UNSUPPORTED: 'DYNAMIC_FIELD_TYPE_UNSUPPORTED',
  ENTITY_SCHEMA_CHANGED: 'ENTITY_SCHEMA_CHANGED',
  
  // Webhook Errors
  WEBHOOK_PAYLOAD_INVALID: 'WEBHOOK_PAYLOAD_INVALID',
  WEBHOOK_ENTITY_UNKNOWN: 'WEBHOOK_ENTITY_UNKNOWN',
  WEBHOOK_REJECTED: 'WEBHOOK_REJECTED',
  WEBHOOK_RATE_LIMITED: 'WEBHOOK_RATE_LIMITED',
  WEBHOOK_ABUSE_FLAGGED: 'WEBHOOK_ABUSE_FLAGGED',
  
  // Rule Engine Errors
  RULE_CONDITION_INVALID: 'RULE_CONDITION_INVALID',
  ACTION_EXECUTION_FAILED: 'ACTION_EXECUTION_FAILED',
  RULE_TRIGGERED: 'RULE_TRIGGERED',
  UNSUPPORTED_AGGREGATION: 'UNSUPPORTED_AGGREGATION',
  
  // Widget Errors
  WIDGET_CONFIG_INVALID: 'WIDGET_CONFIG_INVALID',
  
  // RBAC Errors
  RBAC_UNDEFINED_ACTION: 'RBAC_UNDEFINED_ACTION',
  RBAC_BLOCKED: 'RBAC_BLOCKED',
  
  // System Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // File Structure Errors
  FILE_STRUCTURE_UNDEFINED: 'FILE_STRUCTURE_UNDEFINED',
  API_ROUTE_UNDEFINED: 'API_ROUTE_UNDEFINED',
  NAMING_CONVENTION_VIOLATION: 'NAMING_CONVENTION_VIOLATION',
  
  // Contract Gaps
  CONTRACT_GAP: 'CONTRACT_GAP',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// HTTP Status Code mapping
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Request context type for middleware
export interface RequestContext {
  tenantId: string;
  userId?: string;
  role: string;
  requestId: string;
  sourceIp: string;
}
