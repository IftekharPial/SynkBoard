/**
 * Webhook types for SynkBoard
 * Following webhook-behavior.md rules
 */

import { z } from 'zod';
import { UuidSchema } from './common';

// Webhook ingestion request schema
export const WebhookIngestRequestSchema = z.object({
  entity: z.string().min(1),
  fields: z.record(z.any()),
});

export type WebhookIngestRequest = z.infer<typeof WebhookIngestRequestSchema>;

// Webhook ingestion response schema
export const WebhookIngestResponseSchema = z.object({
  success: z.literal(true),
  record_id: UuidSchema,
  triggered_rules: z.number(),
});

export type WebhookIngestResponse = z.infer<typeof WebhookIngestResponseSchema>;

// Webhook status enum
export const WebhookStatusSchema = z.enum([
  'success',
  'failed',
]);

export type WebhookStatus = z.infer<typeof WebhookStatusSchema>;

// Webhook log schema
export const WebhookLogSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  api_key_id: UuidSchema.optional(),
  entity: z.string(),
  source_ip: z.string().optional(),
  status: WebhookStatusSchema,
  duration_ms: z.number(),
  error_code: z.string().optional(),
  schema_version: z.string().optional(),
  deprecated_keys: z.array(z.string()).optional(),
  created_at: z.string().datetime(),
});

export type WebhookLog = z.infer<typeof WebhookLogSchema>;

// Webhook validation error details
export interface WebhookValidationError {
  field: string;
  message: string;
  received_value?: any;
  expected_type?: string;
}

// Webhook error response schema
export const WebhookErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({
      field: z.string(),
      message: z.string(),
      received_value: z.any().optional(),
      expected_type: z.string().optional(),
    })).optional(),
  }),
});

export type WebhookErrorResponse = z.infer<typeof WebhookErrorResponseSchema>;

// Webhook response union
export const WebhookResponseSchema = z.union([
  WebhookIngestResponseSchema,
  WebhookErrorResponseSchema,
]);

export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;

// Webhook rate limiting configuration
export interface WebhookRateLimit {
  requests_per_minute: number;
  burst_limit: number;
  tenant_id: string;
  api_key_id?: string;
}

// Webhook security configuration
export interface WebhookSecurityConfig {
  require_api_key: boolean;
  allowed_ips?: string[];
  rate_limit: WebhookRateLimit;
  signature_verification?: {
    enabled: boolean;
    secret: string;
    header_name: string;
  };
}

// Webhook event types for audit logging
export const WebhookEventTypeSchema = z.enum([
  'webhook_ingested',
  'webhook_rejected',
  'webhook_rate_limited',
  'webhook_abuse_flagged',
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

// Webhook audit event
export const WebhookAuditEventSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  event_type: WebhookEventTypeSchema,
  entity: z.string().optional(),
  api_key_id: UuidSchema.optional(),
  source_ip: z.string(),
  user_agent: z.string().optional(),
  payload_size: z.number().optional(),
  processing_time_ms: z.number().optional(),
  error_details: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
});

export type WebhookAuditEvent = z.infer<typeof WebhookAuditEventSchema>;

// Webhook processing context
export interface WebhookProcessingContext {
  tenant_id: string;
  api_key_id?: string;
  source_ip: string;
  user_agent?: string;
  request_id: string;
  received_at: Date;
}

// Webhook field mapping for complex transformations
export interface WebhookFieldMapping {
  source_path: string; // JSONPath to source field
  target_field: string; // Target entity field key
  transform?: 'lowercase' | 'uppercase' | 'trim' | 'parse_date' | 'parse_number';
  default_value?: any;
  required?: boolean;
}

// Webhook configuration for entity
export const WebhookConfigSchema = z.object({
  entity_id: UuidSchema,
  enabled: z.boolean().default(true),
  field_mappings: z.array(z.object({
    source_path: z.string(),
    target_field: z.string(),
    transform: z.enum(['lowercase', 'uppercase', 'trim', 'parse_date', 'parse_number']).optional(),
    default_value: z.any().optional(),
    required: z.boolean().default(false),
  })).optional(),
  validation_rules: z.array(z.object({
    field: z.string(),
    rule: z.string(),
    message: z.string(),
  })).optional(),
  auto_create_fields: z.boolean().default(false),
  rate_limit_override: z.object({
    requests_per_minute: z.number(),
    burst_limit: z.number(),
  }).optional(),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

// Webhook processing result
export interface WebhookProcessingResult {
  success: boolean;
  record_id?: string;
  triggered_rules: number;
  processing_time_ms: number;
  warnings: string[];
  errors: WebhookValidationError[];
  deprecated_fields_used: string[];
}

// Webhook retry configuration
export interface WebhookRetryConfig {
  max_attempts: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  retry_on_status_codes: number[];
}

// Webhook delivery attempt
export const WebhookDeliveryAttemptSchema = z.object({
  id: UuidSchema,
  webhook_log_id: UuidSchema,
  attempt_number: z.number(),
  status_code: z.number().optional(),
  response_body: z.string().optional(),
  error_message: z.string().optional(),
  duration_ms: z.number(),
  created_at: z.string().datetime(),
});

export type WebhookDeliveryAttempt = z.infer<typeof WebhookDeliveryAttemptSchema>;

// Webhook statistics
export interface WebhookStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_processing_time_ms: number;
  requests_by_entity: Record<string, number>;
  error_codes: Record<string, number>;
  rate_limited_requests: number;
  period_start: string;
  period_end: string;
}

// Webhook logs query parameters
export const WebhookLogsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  entity: z.string().optional(),
  status: WebhookStatusSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  api_key_id: UuidSchema.optional(),
});

export type WebhookLogsQuery = z.infer<typeof WebhookLogsQuerySchema>;

// Webhook API response types
export interface WebhookLogsResponse {
  logs: WebhookLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WebhookStatsResponse {
  stats: WebhookStats;
}

export interface WebhookConfigResponse {
  config: WebhookConfig;
}

// Webhook validation utilities
export function validateWebhookPayload(
  payload: any,
  entityFields: Array<{ key: string; type: string; is_required: boolean }>
): WebhookValidationError[] {
  const errors: WebhookValidationError[] = [];
  
  if (!payload || typeof payload !== 'object') {
    errors.push({
      field: 'root',
      message: 'Payload must be a valid JSON object',
    });
    return errors;
  }

  if (!payload.entity || typeof payload.entity !== 'string') {
    errors.push({
      field: 'entity',
      message: 'Entity field is required and must be a string',
      received_value: payload.entity,
    });
  }

  if (!payload.fields || typeof payload.fields !== 'object') {
    errors.push({
      field: 'fields',
      message: 'Fields must be a valid object',
      received_value: payload.fields,
    });
    return errors;
  }

  // Validate required fields
  const fieldMap = new Map(entityFields.map(f => [f.key, f]));
  
  for (const field of entityFields) {
    if (field.is_required && !(field.key in payload.fields)) {
      errors.push({
        field: field.key,
        message: `Required field '${field.key}' is missing`,
        expected_type: field.type,
      });
    }
  }

  // Validate unknown fields
  for (const key of Object.keys(payload.fields)) {
    if (!fieldMap.has(key)) {
      errors.push({
        field: key,
        message: `Unknown field '${key}'`,
        received_value: payload.fields[key],
      });
    }
  }

  return errors;
}
