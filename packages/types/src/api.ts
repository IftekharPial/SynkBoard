/**
 * API types and schemas for SynkBoard
 * Following api-contracts.md rules
 */

import { z } from 'zod';
import { UuidSchema } from './common';

// Request headers schema
export const ApiHeadersSchema = z.object({
  authorization: z.string().regex(/^Bearer .+/),
  'x-tenant-id': UuidSchema.optional(),
  'content-type': z.string().default('application/json'),
  'user-agent': z.string().optional(),
});

export type ApiHeaders = z.infer<typeof ApiHeadersSchema>;

// API request context
export interface ApiRequestContext {
  tenantId: string;
  userId?: string;
  role: string;
  requestId: string;
  sourceIp: string;
  userAgent?: string;
  apiKeyId?: string;
}

// Audit action types following api-contracts.md
export const AuditActionSchema = z.enum([
  'entity_created',
  'entity_updated', 
  'entity_deleted',
  'field_added',
  'field_updated',
  'field_removed',
  'record_created',
  'record_updated',
  'record_deleted',
  'dashboard_created',
  'dashboard_updated',
  'dashboard_deleted',
  'widget_created',
  'widget_updated',
  'widget_deleted',
  'rule_created',
  'rule_updated',
  'rule_deleted',
  'user_created',
  'user_updated',
  'user_role_changed',
]);

export type AuditAction = z.infer<typeof AuditActionSchema>;

// Audit log schema
export const AuditLogSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  user_id: UuidSchema.optional(),
  action: AuditActionSchema,
  resource_type: z.string(),
  resource_id: UuidSchema,
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// API logging schema following api-contracts.md
export const ApiLogSchema = z.object({
  timestamp: z.string().datetime(),
  route: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  tenant_id: UuidSchema,
  user_id: UuidSchema.optional(),
  role: z.string(),
  status_code: z.number(),
  duration_ms: z.number(),
  error_code: z.string().optional(),
  source_ip: z.string(),
  request_id: UuidSchema,
  user_agent: z.string().optional(),
});

export type ApiLog = z.infer<typeof ApiLogSchema>;

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

// Default rate limits by role
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  superadmin: {
    windowMs: 60000, // 1 minute
    maxRequests: 1000,
  },
  admin: {
    windowMs: 60000,
    maxRequests: 500,
  },
  editor: {
    windowMs: 60000,
    maxRequests: 200,
  },
  analyst: {
    windowMs: 60000,
    maxRequests: 100,
  },
  viewer: {
    windowMs: 60000,
    maxRequests: 50,
  },
  integration: {
    windowMs: 60000,
    maxRequests: 60, // 1 per second as per webhook-behavior.md
  },
};

// API endpoint definitions
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  requiredRole: string;
  rateLimit?: RateLimitConfig;
  description: string;
}

// Core API endpoints following api-contracts.md
export const API_ENDPOINTS: ApiEndpoint[] = [
  // Authentication
  { path: '/api/v1/auth/login', method: 'POST', requiredRole: 'public', description: 'User login' },
  { path: '/api/v1/auth/refresh', method: 'POST', requiredRole: 'public', description: 'Refresh token' },
  { path: '/api/v1/auth/me', method: 'GET', requiredRole: 'viewer', description: 'Get current user' },
  
  // Entities
  { path: '/api/v1/entities', method: 'GET', requiredRole: 'viewer', description: 'List entities' },
  { path: '/api/v1/entities', method: 'POST', requiredRole: 'admin', description: 'Create entity' },
  { path: '/api/v1/entities/:slug', method: 'GET', requiredRole: 'viewer', description: 'Get entity' },
  { path: '/api/v1/entities/:slug', method: 'PUT', requiredRole: 'admin', description: 'Update entity' },
  { path: '/api/v1/entities/:slug', method: 'DELETE', requiredRole: 'admin', description: 'Delete entity' },
  
  // Entity Fields
  { path: '/api/v1/entities/:slug/fields', method: 'GET', requiredRole: 'viewer', description: 'List entity fields' },
  { path: '/api/v1/entities/:slug/fields', method: 'POST', requiredRole: 'admin', description: 'Add entity field' },
  { path: '/api/v1/entities/:slug/fields/:fieldId', method: 'PUT', requiredRole: 'admin', description: 'Update entity field' },
  { path: '/api/v1/entities/:slug/fields/:fieldId', method: 'DELETE', requiredRole: 'admin', description: 'Delete entity field' },
  
  // Records
  { path: '/api/v1/entities/:slug/records', method: 'GET', requiredRole: 'viewer', description: 'List records' },
  { path: '/api/v1/entities/:slug/records', method: 'POST', requiredRole: 'editor', description: 'Create record' },
  { path: '/api/v1/entities/:slug/records/:id', method: 'GET', requiredRole: 'viewer', description: 'Get record' },
  { path: '/api/v1/entities/:slug/records/:id', method: 'PUT', requiredRole: 'editor', description: 'Update record' },
  { path: '/api/v1/entities/:slug/records/:id', method: 'DELETE', requiredRole: 'admin', description: 'Delete record' },
  
  // Dashboards
  { path: '/api/v1/dashboards', method: 'GET', requiredRole: 'viewer', description: 'List dashboards' },
  { path: '/api/v1/dashboards', method: 'POST', requiredRole: 'editor', description: 'Create dashboard' },
  { path: '/api/v1/dashboards/:slug', method: 'GET', requiredRole: 'viewer', description: 'Get dashboard' },
  { path: '/api/v1/dashboards/:slug', method: 'PUT', requiredRole: 'editor', description: 'Update dashboard' },
  { path: '/api/v1/dashboards/:slug', method: 'DELETE', requiredRole: 'admin', description: 'Delete dashboard' },
  
  // Widgets
  { path: '/api/v1/widgets', method: 'GET', requiredRole: 'viewer', description: 'List widgets' },
  { path: '/api/v1/widgets', method: 'POST', requiredRole: 'editor', description: 'Create widget' },
  { path: '/api/v1/widgets/:id', method: 'GET', requiredRole: 'viewer', description: 'Get widget' },
  { path: '/api/v1/widgets/:id', method: 'PUT', requiredRole: 'editor', description: 'Update widget' },
  { path: '/api/v1/widgets/:id', method: 'DELETE', requiredRole: 'editor', description: 'Delete widget' },
  { path: '/api/v1/widgets/:id/data', method: 'GET', requiredRole: 'viewer', description: 'Get widget data' },
  
  // Rules
  { path: '/api/v1/rules', method: 'GET', requiredRole: 'analyst', description: 'List rules' },
  { path: '/api/v1/rules', method: 'POST', requiredRole: 'admin', description: 'Create rule' },
  { path: '/api/v1/rules/:id', method: 'GET', requiredRole: 'analyst', description: 'Get rule' },
  { path: '/api/v1/rules/:id', method: 'PUT', requiredRole: 'admin', description: 'Update rule' },
  { path: '/api/v1/rules/:id', method: 'DELETE', requiredRole: 'admin', description: 'Delete rule' },
  { path: '/api/v1/rules/test', method: 'POST', requiredRole: 'admin', description: 'Test rule' },
  { path: '/api/v1/rules/logs', method: 'GET', requiredRole: 'admin', description: 'Get rule logs' },
  
  // Webhooks
  { path: '/api/v1/ingest', method: 'POST', requiredRole: 'integration', description: 'Webhook ingestion' },
  { path: '/api/v1/webhooks/logs', method: 'GET', requiredRole: 'admin', description: 'Get webhook logs' },
  
  // Users (Admin only)
  { path: '/api/v1/users', method: 'GET', requiredRole: 'admin', description: 'List users' },
  { path: '/api/v1/users', method: 'POST', requiredRole: 'admin', description: 'Create user' },
  { path: '/api/v1/users/:id', method: 'GET', requiredRole: 'admin', description: 'Get user' },
  { path: '/api/v1/users/:id', method: 'PUT', requiredRole: 'admin', description: 'Update user' },
  { path: '/api/v1/users/:id', method: 'DELETE', requiredRole: 'admin', description: 'Delete user' },
  
  // API Keys
  { path: '/api/v1/api-keys', method: 'GET', requiredRole: 'admin', description: 'List API keys' },
  { path: '/api/v1/api-keys', method: 'POST', requiredRole: 'admin', description: 'Create API key' },
  { path: '/api/v1/api-keys/:id', method: 'DELETE', requiredRole: 'admin', description: 'Delete API key' },
  
  // Audit Logs
  { path: '/api/v1/audit-logs', method: 'GET', requiredRole: 'admin', description: 'Get audit logs' },
];

// API response helpers
export function createSuccessResponse<T>(data: T, meta?: Record<string, any>) {
  return {
    success: true as const,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function createErrorResponse(code: string, message: string) {
  return {
    success: false as const,
    error: {
      code,
      message,
    },
  };
}

// Middleware types
export interface AuthMiddleware {
  (req: any, res: any, next: any): void;
}

export interface RoleMiddleware {
  (requiredRole: string): (req: any, res: any, next: any) => void;
}

export interface TenantScopeMiddleware {
  (req: any, res: any, next: any): void;
}

export interface RateLimitMiddleware {
  (config: RateLimitConfig): (req: any, res: any, next: any) => void;
}

// API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  tenantId?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// API client response type
export interface ApiClientResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  success: boolean;
}

// Error handling types
export interface ApiError extends Error {
  code: string;
  status: number;
  details?: any;
}

export class ApiValidationError extends Error implements ApiError {
  code = 'VALIDATION_ERROR';
  status = 422;
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

export class ApiAuthenticationError extends Error implements ApiError {
  code = 'UNAUTHORIZED';
  status = 401;

  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class ApiAuthorizationError extends Error implements ApiError {
  code = 'FORBIDDEN';
  status = 403;

  constructor(message = 'Insufficient permissions') {
    super(message);
  }
}

export class ApiNotFoundError extends Error implements ApiError {
  code = 'RESOURCE_NOT_FOUND';
  status = 404;

  constructor(message = 'Resource not found') {
    super(message);
  }
}
