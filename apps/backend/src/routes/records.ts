/**
 * Entity record routes for SynkBoard
 * Following dynamic-entities.md rules
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { entityQueries, recordQueries } from '@synkboard/database';
import {
  CreateEntityRecordSchema,
  UpdateEntityRecordSchema,
  RecordQueryParamsSchema,
  UuidSchema,
  SlugSchema,
  validateRecordFields,
  createSuccessResponse,
  NotFoundError,
  ApiValidationError,
} from '@synkboard/types';
import { logger, structuredLogger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// All record routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/entities/:slug/records
 * List records for an entity with pagination and filtering
 */
router.get('/:slug/records',
  requirePermission('record:view'),
  validateParams(z.object({ slug: SlugSchema })),
  validateQuery(RecordQueryParamsSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { slug } = req.params;
    const queryParams = req.query as any;

    // Get entity to validate it exists
    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    // Extract pagination and filter parameters
    const { page, limit, sort_by, order, ...filters } = queryParams;
    
    // Validate sort field is sortable
    if (sort_by && sort_by !== 'created_at') {
      const field = entity.fields.find(f => f.key === sort_by);
      if (!field) {
        throw new ApiValidationError(`Unknown field '${sort_by}'`);
      }
      if (!field.is_sortable) {
        throw new ApiValidationError(`Field '${sort_by}' is not sortable`);
      }
    }

    // Validate filter fields are filterable
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const field = entity.fields.find(f => f.key === key);
        if (!field) {
          throw new ApiValidationError(`Unknown filter field '${key}'`);
        }
        if (!field.is_filterable) {
          throw new ApiValidationError(`Field '${key}' is not filterable`);
        }
      }
    }

    const timer = Date.now();
    const result = await recordQueries.getRecordsForEntity(tenantId, entity.id, {
      page,
      limit,
      filters,
      sortBy: sort_by,
      sortOrder: order,
    });
    const duration = Date.now() - timer;

    structuredLogger.performance({
      operation: 'list_records',
      durationMs: duration,
      tenantId,
      metadata: { 
        entity_slug: slug,
        count: result.records.length,
        total: result.pagination.total,
      },
    });

    res.json(createSuccessResponse({
      records: result.records,
      pagination: result.pagination,
    }));
  })
);

/**
 * POST /api/v1/entities/:slug/records
 * Create a new record for an entity
 */
router.post('/:slug/records',
  requirePermission('record:create'),
  validateParams(z.object({ slug: SlugSchema })),
  validateBody(CreateEntityRecordSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug } = req.params;
    const { fields } = req.body;

    if (!userId) {
      throw new ApiValidationError('User ID required for record creation');
    }

    // Get entity with fields for validation
    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    // Validate record fields against entity schema
    const validation = validateRecordFields(fields, entity.fields);
    if (!validation.isValid) {
      throw new ApiValidationError(`Field validation failed: ${validation.errors.join(', ')}`);
    }

    const timer = Date.now();
    const record = await recordQueries.createRecord(tenantId, entity.id, fields, userId);
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'record_created',
      resourceType: 'entity_record',
      resourceId: record.id,
      metadata: { 
        entity_slug: slug,
        field_count: Object.keys(fields).length,
      },
    });

    structuredLogger.performance({
      operation: 'create_record',
      durationMs: duration,
      tenantId,
    });

    // Trigger rule evaluation
    const { executeRulesForRecord } = await import('../services/rule-engine');
    const ruleResult = await executeRulesForRecord(
      tenantId,
      entity.id,
      record.id,
      fields,
      'create',
      userId
    );
    const triggeredRules = ruleResult.triggeredRules;

    res.status(201).json(createSuccessResponse({
      record,
      triggered_rules: triggeredRules,
    }));
  })
);

/**
 * GET /api/v1/entities/:slug/records/:id
 * Get a specific record by ID
 */
router.get('/:slug/records/:id',
  requirePermission('record:view'),
  validateParams(z.object({ 
    slug: SlugSchema,
    id: UuidSchema,
  })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { slug, id } = req.params;

    // Verify entity exists
    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    const timer = Date.now();
    const { prisma } = await import('@synkboard/database');
    const record = await prisma.entityRecord.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        entity_id: entity.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    const duration = Date.now() - timer;

    if (!record) {
      throw new NotFoundError(`Record '${id}' not found`);
    }

    structuredLogger.performance({
      operation: 'get_record',
      durationMs: duration,
      tenantId,
      metadata: { entity_slug: slug },
    });

    res.json(createSuccessResponse({
      record,
    }));
  })
);

/**
 * PUT /api/v1/entities/:slug/records/:id
 * Update a record
 */
router.put('/:slug/records/:id',
  requirePermission('record:update'),
  validateParams(z.object({ 
    slug: SlugSchema,
    id: UuidSchema,
  })),
  validateBody(UpdateEntityRecordSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug, id } = req.params;
    const { fields } = req.body;

    if (!userId) {
      throw new ApiValidationError('User ID required for record update');
    }

    // Get entity with fields for validation
    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    // Check if record exists
    const { prisma } = await import('@synkboard/database');
    const existingRecord = await prisma.entityRecord.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        entity_id: entity.id,
      },
    });

    if (!existingRecord) {
      throw new NotFoundError(`Record '${id}' not found`);
    }

    // Validate record fields against entity schema
    const validation = validateRecordFields(fields, entity.fields);
    if (!validation.isValid) {
      throw new ApiValidationError(`Field validation failed: ${validation.errors.join(', ')}`);
    }

    const timer = Date.now();
    const updatedRecord = await prisma.entityRecord.update({
      where: { id },
      data: { fields },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'record_updated',
      resourceType: 'entity_record',
      resourceId: id,
      changes: { fields },
      metadata: { entity_slug: slug },
    });

    structuredLogger.performance({
      operation: 'update_record',
      durationMs: duration,
      tenantId,
    });

    // Trigger rule evaluation
    const { executeRulesForRecord } = await import('../services/rule-engine');
    const ruleResult = await executeRulesForRecord(
      tenantId,
      entity.id,
      id,
      fields,
      'update',
      userId
    );
    const triggeredRules = ruleResult.triggeredRules;

    res.json(createSuccessResponse({
      record: updatedRecord,
      triggered_rules: triggeredRules,
    }));
  })
);

/**
 * DELETE /api/v1/entities/:slug/records/:id
 * Delete a record
 */
router.delete('/:slug/records/:id',
  requirePermission('record:delete'),
  validateParams(z.object({ 
    slug: SlugSchema,
    id: UuidSchema,
  })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug, id } = req.params;

    if (!userId) {
      throw new ApiValidationError('User ID required for record deletion');
    }

    // Verify entity exists
    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    // Check if record exists
    const { prisma } = await import('@synkboard/database');
    const existingRecord = await prisma.entityRecord.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        entity_id: entity.id,
      },
    });

    if (!existingRecord) {
      throw new NotFoundError(`Record '${id}' not found`);
    }

    const timer = Date.now();
    await prisma.entityRecord.delete({
      where: { id },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'record_deleted',
      resourceType: 'entity_record',
      resourceId: id,
      metadata: { entity_slug: slug },
    });

    structuredLogger.performance({
      operation: 'delete_record',
      durationMs: duration,
      tenantId,
    });

    res.status(204).send();
  })
);

export default router;
