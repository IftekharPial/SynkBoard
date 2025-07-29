/**
 * Rule engine service for SynkBoard
 * Following rule-engine.md rules
 */

import { 
  RuleCondition, 
  RuleAction, 
  RuleEvaluationContext, 
  RuleEvaluationResult,
  ActionExecutionResult,
  replaceTemplateVariables,
} from '@synkboard/types';
import { logger, structuredLogger, createTimer } from '../utils/logger';
import axios from 'axios';

/**
 * Evaluate a single rule condition against record data
 */
export function evaluateCondition(
  condition: RuleCondition,
  recordFields: Record<string, any>
): { matched: boolean; reason?: string } {
  const { field, operator, value } = condition;
  const fieldValue = recordFields[field];

  // Handle empty/null values
  if (fieldValue === null || fieldValue === undefined) {
    if (operator === 'is_empty') {
      return { matched: true };
    }
    if (operator === 'is_not_empty') {
      return { matched: false, reason: `Field '${field}' is empty` };
    }
    return { matched: false, reason: `Field '${field}' is null/undefined` };
  }

  switch (operator) {
    case 'equals':
      return { 
        matched: fieldValue === value,
        reason: fieldValue !== value ? `${fieldValue} !== ${value}` : undefined,
      };

    case 'not_equals':
      return { 
        matched: fieldValue !== value,
        reason: fieldValue === value ? `${fieldValue} === ${value}` : undefined,
      };

    case 'gt':
      const gtResult = Number(fieldValue) > Number(value);
      return { 
        matched: gtResult,
        reason: !gtResult ? `${fieldValue} <= ${value}` : undefined,
      };

    case 'lt':
      const ltResult = Number(fieldValue) < Number(value);
      return { 
        matched: ltResult,
        reason: !ltResult ? `${fieldValue} >= ${value}` : undefined,
      };

    case 'gte':
      const gteResult = Number(fieldValue) >= Number(value);
      return { 
        matched: gteResult,
        reason: !gteResult ? `${fieldValue} < ${value}` : undefined,
      };

    case 'lte':
      const lteResult = Number(fieldValue) <= Number(value);
      return { 
        matched: lteResult,
        reason: !lteResult ? `${fieldValue} > ${value}` : undefined,
      };

    case 'contains':
      const containsResult = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      return { 
        matched: containsResult,
        reason: !containsResult ? `'${fieldValue}' does not contain '${value}'` : undefined,
      };

    case 'not_contains':
      const notContainsResult = !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      return { 
        matched: notContainsResult,
        reason: !notContainsResult ? `'${fieldValue}' contains '${value}'` : undefined,
      };

    case 'in':
      const inArray = Array.isArray(value) ? value : [value];
      const inResult = inArray.includes(fieldValue);
      return { 
        matched: inResult,
        reason: !inResult ? `'${fieldValue}' not in [${inArray.join(', ')}]` : undefined,
      };

    case 'not_in':
      const notInArray = Array.isArray(value) ? value : [value];
      const notInResult = !notInArray.includes(fieldValue);
      return { 
        matched: notInResult,
        reason: !notInResult ? `'${fieldValue}' is in [${notInArray.join(', ')}]` : undefined,
      };

    case 'is_empty':
      const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
      return { 
        matched: isEmpty,
        reason: !isEmpty ? `Field '${field}' is not empty` : undefined,
      };

    case 'is_not_empty':
      const isNotEmpty = fieldValue && !(typeof fieldValue === 'string' && fieldValue.trim() === '');
      return { 
        matched: isNotEmpty,
        reason: !isNotEmpty ? `Field '${field}' is empty` : undefined,
      };

    case 'changed':
      // This would require previous value comparison - placeholder for now
      return { matched: true };

    default:
      return { 
        matched: false, 
        reason: `Unknown operator: ${operator}` 
      };
  }
}

/**
 * Evaluate all conditions for a rule
 */
export function evaluateRuleConditions(
  conditions: RuleCondition[],
  recordFields: Record<string, any>
): { matched: boolean; conditionsMet: number; details: Array<{ condition: RuleCondition; matched: boolean; reason?: string }> } {
  const details = conditions.map(condition => ({
    condition,
    ...evaluateCondition(condition, recordFields),
  }));

  const conditionsMet = details.filter(d => d.matched).length;
  const matched = conditionsMet === conditions.length; // All conditions must match

  return {
    matched,
    conditionsMet,
    details,
  };
}

/**
 * Execute a webhook action
 */
async function executeWebhookAction(
  action: Extract<RuleAction, { type: 'webhook' }>,
  context: RuleEvaluationContext
): Promise<ActionExecutionResult> {
  const timer = createTimer();
  
  try {
    // Replace template variables in URL and payload
    const url = replaceTemplateVariables(action.url, context);
    const payload = action.payload ? 
      JSON.parse(replaceTemplateVariables(JSON.stringify(action.payload), context)) : 
      {};

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'SynkBoard-RuleEngine/1.0',
      ...action.headers,
    };

    // Make HTTP request
    const response = await axios({
      method: action.method,
      url,
      data: payload,
      headers,
      timeout: action.timeout_ms || 10000,
    });

    return {
      action_type: 'webhook',
      success: true,
      duration_ms: timer.end(),
      output: {
        status_code: response.status,
        response_data: response.data,
      },
    };
  } catch (error: any) {
    return {
      action_type: 'webhook',
      success: false,
      duration_ms: timer.end(),
      error: error.message,
      output: {
        status_code: error.response?.status,
        error_data: error.response?.data,
      },
    };
  }
}

/**
 * Execute a notify action
 */
async function executeNotifyAction(
  action: Extract<RuleAction, { type: 'notify' }>,
  context: RuleEvaluationContext
): Promise<ActionExecutionResult> {
  const timer = createTimer();
  
  try {
    const message = replaceTemplateVariables(action.message, context);
    
    // Log the notification (in a real system, this would send to notification service)
    logger.info('Rule notification', {
      tenant_id: context.tenant.id,
      rule_id: context.rule.id,
      record_id: context.record.id,
      level: action.level,
      message,
      channels: action.channels,
    });

    return {
      action_type: 'notify',
      success: true,
      duration_ms: timer.end(),
      output: {
        message,
        level: action.level,
        channels: action.channels,
      },
    };
  } catch (error: any) {
    return {
      action_type: 'notify',
      success: false,
      duration_ms: timer.end(),
      error: error.message,
    };
  }
}

/**
 * Execute a tag action
 */
async function executeTagAction(
  action: Extract<RuleAction, { type: 'tag' }>,
  context: RuleEvaluationContext
): Promise<ActionExecutionResult> {
  const timer = createTimer();
  
  try {
    const value = replaceTemplateVariables(action.value, context);
    
    // Update the record with the tag (this would modify the record in the database)
    logger.info('Rule tag action', {
      tenant_id: context.tenant.id,
      rule_id: context.rule.id,
      record_id: context.record.id,
      field: action.field,
      value,
      operation: action.operation,
    });

    return {
      action_type: 'tag',
      success: true,
      duration_ms: timer.end(),
      output: {
        field: action.field,
        value,
        operation: action.operation,
      },
    };
  } catch (error: any) {
    return {
      action_type: 'tag',
      success: false,
      duration_ms: timer.end(),
      error: error.message,
    };
  }
}

/**
 * Execute a rate action
 */
async function executeRateAction(
  action: Extract<RuleAction, { type: 'rate' }>,
  context: RuleEvaluationContext
): Promise<ActionExecutionResult> {
  const timer = createTimer();
  
  try {
    // Update the record with the rating (this would modify the record in the database)
    logger.info('Rule rate action', {
      tenant_id: context.tenant.id,
      rule_id: context.rule.id,
      record_id: context.record.id,
      field: action.field,
      value: action.value,
    });

    return {
      action_type: 'rate',
      success: true,
      duration_ms: timer.end(),
      output: {
        field: action.field,
        value: action.value,
      },
    };
  } catch (error: any) {
    return {
      action_type: 'rate',
      success: false,
      duration_ms: timer.end(),
      error: error.message,
    };
  }
}

/**
 * Execute a Slack action
 */
async function executeSlackAction(
  action: Extract<RuleAction, { type: 'slack' }>,
  context: RuleEvaluationContext
): Promise<ActionExecutionResult> {
  const timer = createTimer();
  
  try {
    const message = replaceTemplateVariables(action.message, context);
    
    const payload = {
      text: message,
      channel: action.channel,
      username: action.username || 'SynkBoard',
      icon_emoji: action.icon_emoji || ':robot_face:',
    };

    const response = await axios.post(action.webhook_url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    return {
      action_type: 'slack',
      success: true,
      duration_ms: timer.end(),
      output: {
        message,
        channel: action.channel,
        response: response.data,
      },
    };
  } catch (error: any) {
    return {
      action_type: 'slack',
      success: false,
      duration_ms: timer.end(),
      error: error.message,
    };
  }
}

/**
 * Execute a single rule action
 */
export async function executeRuleAction(
  action: RuleAction,
  context: RuleEvaluationContext
): Promise<ActionExecutionResult> {
  switch (action.type) {
    case 'webhook':
      return executeWebhookAction(action, context);
    case 'notify':
      return executeNotifyAction(action, context);
    case 'tag':
      return executeTagAction(action, context);
    case 'rate':
      return executeRateAction(action, context);
    case 'slack':
      return executeSlackAction(action, context);
    default:
      return {
        action_type: 'unknown' as any,
        success: false,
        duration_ms: 0,
        error: `Unknown action type: ${(action as any).type}`,
      };
  }
}

/**
 * Evaluate and execute a complete rule
 */
export async function evaluateRule(
  rule: {
    id: string;
    name: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
  },
  context: RuleEvaluationContext
): Promise<RuleEvaluationResult> {
  const timer = createTimer();
  
  // Evaluate conditions
  const conditionResult = evaluateRuleConditions(rule.conditions, context.record.fields);
  
  if (!conditionResult.matched) {
    return {
      matched: false,
      conditions_met: conditionResult.conditionsMet,
      total_conditions: rule.conditions.length,
      execution_time_ms: timer.end(),
      actions_executed: 0,
      actions_failed: 0,
      output: {
        condition_details: conditionResult.details,
      },
    };
  }

  // Execute actions if conditions match
  const actionResults: ActionExecutionResult[] = [];
  let actionsExecuted = 0;
  let actionsFailed = 0;

  for (const action of rule.actions) {
    try {
      const result = await executeRuleAction(action, context);
      actionResults.push(result);
      
      if (result.success) {
        actionsExecuted++;
      } else {
        actionsFailed++;
      }
    } catch (error: any) {
      actionsFailed++;
      actionResults.push({
        action_type: action.type,
        success: false,
        duration_ms: 0,
        error: error.message,
      });
    }
  }

  return {
    matched: true,
    conditions_met: conditionResult.conditionsMet,
    total_conditions: rule.conditions.length,
    execution_time_ms: timer.end(),
    actions_executed: actionsExecuted,
    actions_failed: actionsFailed,
    output: {
      condition_details: conditionResult.details,
      action_results: actionResults,
    },
  };
}

/**
 * Execute all rules for a record
 */
export async function executeRulesForRecord(
  tenantId: string,
  entityId: string,
  recordId: string,
  recordFields: Record<string, any>,
  operation: 'create' | 'update',
  userId?: string
): Promise<{ triggeredRules: number; results: Array<{ ruleId: string; result: RuleEvaluationResult }> }> {
  try {
    const { prisma } = await import('@synkboard/database');

    // Get all active rules for this entity
    const rules = await prisma.rule.findMany({
      where: {
        tenant_id: tenantId,
        entity_id: entityId,
        is_active: true,
        OR: [
          { run_on: 'both' },
          { run_on: operation },
        ],
      },
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (rules.length === 0) {
      return { triggeredRules: 0, results: [] };
    }

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get user info if available
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });
    }

    const results: Array<{ ruleId: string; result: RuleEvaluationResult }> = [];
    let triggeredRules = 0;

    // Execute each rule
    for (const rule of rules) {
      const context: RuleEvaluationContext = {
        record: {
          id: recordId,
          fields: recordFields,
          created_at: new Date().toISOString(),
          updated_at: operation === 'update' ? new Date().toISOString() : undefined,
        },
        entity: {
          id: rule.entity.id,
          name: rule.entity.name,
          slug: rule.entity.slug,
        },
        user: user || {
          id: 'system',
          name: 'System',
          email: 'system@synkboard.com',
        },
        rule: {
          id: rule.id,
          name: rule.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      };

      try {
        const result = await evaluateRule(
          {
            id: rule.id,
            name: rule.name,
            conditions: rule.conditions as any,
            actions: rule.actions as any,
          },
          context
        );

        results.push({ ruleId: rule.id, result });

        if (result.matched) {
          triggeredRules++;
        }

        // Log rule execution
        await prisma.ruleLog.create({
          data: {
            tenant_id: tenantId,
            rule_id: rule.id,
            record_id: recordId,
            status: result.matched ? 'matched' : 'skipped',
            duration_ms: result.execution_time_ms,
            output: result.output,
          },
        });

        // Log to structured logger
        structuredLogger.ruleExecution({
          tenantId,
          ruleId: rule.id,
          recordId,
          status: result.matched ? 'matched' : 'skipped',
          durationMs: result.execution_time_ms,
          actionsExecuted: result.actions_executed,
          actionsFailed: result.actions_failed,
        });

      } catch (error: any) {
        // Log failed rule execution
        await prisma.ruleLog.create({
          data: {
            tenant_id: tenantId,
            rule_id: rule.id,
            record_id: recordId,
            status: 'failed',
            duration_ms: 0,
            output: { error: error.message },
          },
        });

        structuredLogger.ruleExecution({
          tenantId,
          ruleId: rule.id,
          recordId,
          status: 'failed',
          durationMs: 0,
          actionsExecuted: 0,
          actionsFailed: 1,
        });

        logger.error('Rule execution failed', {
          tenant_id: tenantId,
          rule_id: rule.id,
          record_id: recordId,
          error: error.message,
        });
      }
    }

    return { triggeredRules, results };
  } catch (error: any) {
    logger.error('Failed to execute rules for record', {
      tenant_id: tenantId,
      entity_id: entityId,
      record_id: recordId,
      operation,
      error: error.message,
    });

    return { triggeredRules: 0, results: [] };
  }
}
