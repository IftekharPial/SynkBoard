/**
 * Rule management routes for SynkBoard
 * Following rule-engine.md rules
 */

import { Router } from 'express';
import { authMiddleware, requireRole, requirePermission } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { entityQueries } from '@synkboard/database';
import { evaluateRuleConditions } from '../services/rule-engine';
import { 
  CreateRuleSchema,
  UpdateRuleSchema,
  TestRuleRequestSchema,
  UuidSchema,
  validateRuleConditions,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
} from '@synkboard/types';
import { logger, structuredLogger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// All rule routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/rules
 * List all rules for the tenant
 */
router.get('/',
  requirePermission('rule:edit'),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    
    const { prisma } = await import('@synkboard/database');
    const rules = await prisma.rule.findMany({
      where: { tenant_id: tenantId },
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(createSuccessResponse({
      rules,
    }));
  })
);

/**
 * POST /api/v1/rules
 * Create a new rule
 */
router.post('/',
  requireRole('admin'),
  validateBody(CreateRuleSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    
    if (!userId) {
      throw new ValidationError('User ID required for rule creation');
    }

    const { entity_id, conditions, actions, ...ruleData } = req.body;

    // Verify entity exists and get its fields
    const { prisma } = await import('@synkboard/database');
    const entity = await prisma.entity.findFirst({
      where: { 
        id: entity_id,
        tenant_id: tenantId,
        is_active: true,
      },
      include: {
        fields: true,
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    // Validate rule conditions against entity fields
    const conditionValidation = validateRuleConditions(conditions, entity.fields);
    if (!conditionValidation.isValid) {
      throw new ValidationError(`Rule conditions invalid: ${conditionValidation.errors.join(', ')}`);
    }

    // Create the rule
    const rule = await prisma.rule.create({
      data: {
        tenant_id: tenantId,
        entity_id,
        conditions,
        actions,
        created_by: userId,
        ...ruleData,
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

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'rule_created',
      resourceType: 'rule',
      resourceId: rule.id,
      metadata: { 
        entity_id,
        conditions_count: conditions.length,
        actions_count: actions.length,
      },
    });

    res.status(201).json(createSuccessResponse({
      rule,
    }));
  })
);

/**
 * GET /api/v1/rules/:id
 * Get rule by ID
 */
router.get('/:id',
  requirePermission('rule:edit'),
  validateParams(z.object({ id: UuidSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { id } = req.params;

    const { prisma } = await import('@synkboard/database');
    const rule = await prisma.rule.findFirst({
      where: { 
        id,
        tenant_id: tenantId,
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

    if (!rule) {
      throw new NotFoundError('Rule not found');
    }

    res.json(createSuccessResponse({
      rule,
    }));
  })
);

/**
 * PUT /api/v1/rules/:id
 * Update a rule
 */
router.put('/:id',
  requireRole('admin'),
  validateParams(z.object({ id: UuidSchema })),
  validateBody(UpdateRuleSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for rule update');
    }

    const { prisma } = await import('@synkboard/database');
    
    // Check if rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { 
        id,
        tenant_id: tenantId,
      },
      include: {
        entity: {
          include: { fields: true },
        },
      },
    });

    if (!existingRule) {
      throw new NotFoundError('Rule not found');
    }

    // If conditions are being updated, validate them
    if (req.body.conditions) {
      const conditionValidation = validateRuleConditions(req.body.conditions, existingRule.entity.fields);
      if (!conditionValidation.isValid) {
        throw new ValidationError(`Rule conditions invalid: ${conditionValidation.errors.join(', ')}`);
      }
    }

    // Update the rule
    const updatedRule = await prisma.rule.update({
      where: { id },
      data: req.body,
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'rule_updated',
      resourceType: 'rule',
      resourceId: id,
      changes: req.body,
    });

    res.json(createSuccessResponse({
      rule: updatedRule,
    }));
  })
);

/**
 * DELETE /api/v1/rules/:id
 * Delete a rule
 */
router.delete('/:id',
  requireRole('admin'),
  validateParams(z.object({ id: UuidSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for rule deletion');
    }

    const { prisma } = await import('@synkboard/database');
    
    // Check if rule exists
    const existingRule = await prisma.rule.findFirst({
      where: { 
        id,
        tenant_id: tenantId,
      },
    });

    if (!existingRule) {
      throw new NotFoundError('Rule not found');
    }

    // Delete the rule
    await prisma.rule.delete({
      where: { id },
    });

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'rule_deleted',
      resourceType: 'rule',
      resourceId: id,
    });

    res.status(204).send();
  })
);

/**
 * POST /api/v1/rules/test
 * Test rule evaluation without saving
 */
router.post('/test',
  requireRole('admin'),
  validateBody(TestRuleRequestSchema),
  asyncHandler(async (req, res) => {
    const { conditions, actions, test_data } = req.body;

    // Evaluate conditions against test data
    const result = evaluateRuleConditions(conditions, test_data);

    const response = {
      matched: result.matched,
      conditions_met: result.conditionsMet,
      total_conditions: conditions.length,
      actions_would_execute: result.matched ? actions.length : 0,
      evaluation_details: result.details.map(detail => ({
        condition: detail.condition,
        matched: detail.matched,
        reason: detail.reason,
      })),
    };

    res.json(createSuccessResponse(response));
  })
);

/**
 * GET /api/v1/rules/logs
 * Get rule execution logs
 */
router.get('/logs',
  requireRole('admin'),
  validateQuery(z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    rule_id: UuidSchema.optional(),
    status: z.enum(['matched', 'skipped', 'failed']).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { page, limit, rule_id, status, start_date, end_date } = req.query as any;

    const { prisma } = await import('@synkboard/database');
    
    // Build where clause
    const where: any = { tenant_id: tenantId };
    
    if (rule_id) {
      where.rule_id = rule_id;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at.gte = new Date(start_date);
      }
      if (end_date) {
        where.created_at.lte = new Date(end_date);
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.ruleLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          rule: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.ruleLog.count({ where }),
    ]);

    res.json(createSuccessResponse({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }));
  })
);

export default router;
