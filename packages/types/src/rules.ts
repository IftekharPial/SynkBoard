/**
 * Rule engine types for SynkBoard
 * Following rule-engine.md rules
 */

import { z } from 'zod';
import { UuidSchema, FilterOperatorSchema } from './common';

// Rule run trigger definitions
export const RuleRunOnSchema = z.enum([
  'create',
  'update', 
  'both',
]);

export type RuleRunOn = z.infer<typeof RuleRunOnSchema>;

// Action type definitions
export const ActionTypeSchema = z.enum([
  'webhook',
  'notify',
  'tag',
  'rate',
  'slack',
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

// Rule condition schema
export const RuleConditionSchema = z.object({
  field: z.string(),
  operator: FilterOperatorSchema,
  value: z.any(),
});

export type RuleCondition = z.infer<typeof RuleConditionSchema>;

// Action schemas
export const WebhookActionSchema = z.object({
  type: z.literal('webhook'),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH']).default('POST'),
  headers: z.record(z.string()).optional(),
  payload: z.record(z.any()).optional(),
  timeout_ms: z.number().min(1000).max(30000).default(10000),
});

export const NotifyActionSchema = z.object({
  type: z.literal('notify'),
  message: z.string(),
  level: z.enum(['info', 'warning', 'error']).default('info'),
  channels: z.array(z.enum(['ui', 'email', 'sms'])).default(['ui']),
});

export const TagActionSchema = z.object({
  type: z.literal('tag'),
  field: z.string(),
  value: z.string(),
  operation: z.enum(['set', 'add', 'remove']).default('set'),
});

export const RateActionSchema = z.object({
  type: z.literal('rate'),
  field: z.string(),
  value: z.number().min(1).max(5),
});

export const SlackActionSchema = z.object({
  type: z.literal('slack'),
  webhook_url: z.string().url(),
  channel: z.string().optional(),
  message: z.string(),
  username: z.string().optional(),
  icon_emoji: z.string().optional(),
});

export const RuleActionSchema = z.discriminatedUnion('type', [
  WebhookActionSchema,
  NotifyActionSchema,
  TagActionSchema,
  RateActionSchema,
  SlackActionSchema,
]);

export type RuleAction = z.infer<typeof RuleActionSchema>;

// Rule schemas
export const RuleSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  entity_id: UuidSchema,
  name: z.string().min(1).max(100),
  is_active: z.boolean(),
  conditions: z.array(RuleConditionSchema),
  actions: z.array(RuleActionSchema),
  run_on: RuleRunOnSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: UuidSchema,
});

export const CreateRuleSchema = z.object({
  entity_id: UuidSchema,
  name: z.string().min(1).max(100),
  conditions: z.array(RuleConditionSchema).min(1),
  actions: z.array(RuleActionSchema).min(1),
  run_on: RuleRunOnSchema.default('both'),
  is_active: z.boolean().default(true),
});

export const UpdateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  conditions: z.array(RuleConditionSchema).min(1).optional(),
  actions: z.array(RuleActionSchema).min(1).optional(),
  run_on: RuleRunOnSchema.optional(),
  is_active: z.boolean().optional(),
});

export type Rule = z.infer<typeof RuleSchema>;
export type CreateRule = z.infer<typeof CreateRuleSchema>;
export type UpdateRule = z.infer<typeof UpdateRuleSchema>;

// Rule with entity info
export const RuleWithEntitySchema = RuleSchema.extend({
  entity: z.object({
    id: UuidSchema,
    name: z.string(),
    slug: z.string(),
  }),
  user: z.object({
    id: UuidSchema,
    name: z.string(),
    email: z.string().email(),
  }),
});

export type RuleWithEntity = z.infer<typeof RuleWithEntitySchema>;

// Rule execution log schemas
export const RuleLogStatusSchema = z.enum([
  'matched',
  'skipped',
  'failed',
]);

export type RuleLogStatus = z.infer<typeof RuleLogStatusSchema>;

export const RuleLogSchema = z.object({
  id: UuidSchema,
  tenant_id: UuidSchema,
  rule_id: UuidSchema,
  record_id: UuidSchema,
  status: RuleLogStatusSchema,
  duration_ms: z.number(),
  output: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
});

export type RuleLog = z.infer<typeof RuleLogSchema>;

// Rule evaluation context
export interface RuleEvaluationContext {
  record: {
    id: string;
    fields: Record<string, any>;
    created_at: string;
    updated_at?: string;
  };
  entity: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  rule: {
    id: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
  };
}

// Rule evaluation result
export interface RuleEvaluationResult {
  matched: boolean;
  conditions_met: number;
  total_conditions: number;
  execution_time_ms: number;
  actions_executed: number;
  actions_failed: number;
  output: Record<string, any>;
}

// Action execution result
export interface ActionExecutionResult {
  action_type: ActionType;
  success: boolean;
  duration_ms: number;
  output?: any;
  error?: string;
}

// Rule test request/response
export const TestRuleRequestSchema = z.object({
  conditions: z.array(RuleConditionSchema),
  actions: z.array(RuleActionSchema),
  test_data: z.record(z.any()), // Sample record fields
});

export const TestRuleResponseSchema = z.object({
  matched: z.boolean(),
  conditions_met: z.number(),
  total_conditions: z.number(),
  actions_would_execute: z.number(),
  evaluation_details: z.array(z.object({
    condition: RuleConditionSchema,
    matched: z.boolean(),
    reason: z.string().optional(),
  })),
});

export type TestRuleRequest = z.infer<typeof TestRuleRequestSchema>;
export type TestRuleResponse = z.infer<typeof TestRuleResponseSchema>;

// Rule validation functions
export function validateRuleConditions(
  conditions: RuleCondition[],
  entityFields: Array<{ key: string; type: string }>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fieldMap = new Map(entityFields.map(f => [f.key, f.type]));

  for (const condition of conditions) {
    const fieldType = fieldMap.get(condition.field);
    
    if (!fieldType) {
      errors.push(`Unknown field '${condition.field}'`);
      continue;
    }

    // Validate operator compatibility with field type
    const numericOperators = ['gt', 'lt', 'gte', 'lte'];
    const textOperators = ['contains', 'not_contains'];
    
    if (fieldType === 'number' && textOperators.includes(condition.operator)) {
      errors.push(`Operator '${condition.operator}' not valid for numeric field '${condition.field}'`);
    }
    
    if (fieldType === 'text' && numericOperators.includes(condition.operator)) {
      errors.push(`Operator '${condition.operator}' not valid for text field '${condition.field}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Template variable replacement for actions
export function replaceTemplateVariables(
  template: string,
  context: RuleEvaluationContext
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = context;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value !== undefined ? String(value) : match;
  });
}

// Rule API response types
export interface RulesListResponse {
  rules: RuleWithEntity[];
}

export interface RuleDetailResponse {
  rule: RuleWithEntity;
}

export interface RuleLogsResponse {
  logs: RuleLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
