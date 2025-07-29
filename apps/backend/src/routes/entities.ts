/**
 * Entity management routes for SynkBoard
 * Following dynamic-entities.md rules
 */

import { Router } from 'express';
import { authMiddleware, requireRole, requirePermission } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { entityQueries } from '@synkboard/database';
import { 
  CreateEntitySchema, 
  UpdateEntitySchema,
  CreateEntityFieldSchema,
  UpdateEntityFieldSchema,
  UuidSchema,
  SlugSchema,
  createSuccessResponse,
  ERROR_CODES,
  NotFoundError,
  ValidationError,
} from '@synkboard/types';
import { logger, structuredLogger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// All entity routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/entities
 * List all entities for the tenant
 */
router.get('/', 
  requirePermission('entity:view'),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    
    const timer = Date.now();
    const entities = await entityQueries.getEntitiesForTenant(tenantId);
    const duration = Date.now() - timer;

    structuredLogger.performance({
      operation: 'list_entities',
      durationMs: duration,
      tenantId,
      metadata: { count: entities.length },
    });

    res.json(createSuccessResponse({
      entities,
    }));
  })
);

/**
 * POST /api/v1/entities
 * Create a new entity
 */
router.post('/',
  requirePermission('entity:editSchema'),
  validateBody(CreateEntitySchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    
    if (!userId) {
      throw new ValidationError('User ID required for entity creation');
    }

    const timer = Date.now();
    const entity = await entityQueries.createEntity(tenantId, req.body);
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'entity_created',
      resourceType: 'entity',
      resourceId: entity.id,
      metadata: { name: entity.name, slug: entity.slug },
    });

    structuredLogger.performance({
      operation: 'create_entity',
      durationMs: duration,
      tenantId,
    });

    res.status(201).json(createSuccessResponse({
      entity,
    }));
  })
);

/**
 * GET /api/v1/entities/:slug
 * Get entity by slug with fields
 */
router.get('/:slug',
  requirePermission('entity:view'),
  validateParams(z.object({ slug: SlugSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { slug } = req.params;

    const timer = Date.now();
    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    const duration = Date.now() - timer;

    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    structuredLogger.performance({
      operation: 'get_entity',
      durationMs: duration,
      tenantId,
      metadata: { slug },
    });

    res.json(createSuccessResponse({
      entity,
    }));
  })
);

/**
 * PUT /api/v1/entities/:slug
 * Update entity metadata
 */
router.put('/:slug',
  requirePermission('entity:editSchema'),
  validateParams(z.object({ slug: SlugSchema })),
  validateBody(UpdateEntitySchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for entity update');
    }

    // First check if entity exists
    const existingEntity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!existingEntity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    const timer = Date.now();
    // Update entity using Prisma client directly for now
    const { prisma } = await import('@synkboard/database');
    const updatedEntity = await prisma.entity.update({
      where: { 
        tenant_id_slug: {
          tenant_id: tenantId,
          slug,
        }
      },
      data: req.body,
      include: {
        fields: {
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: { records: true },
        },
      },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'entity_updated',
      resourceType: 'entity',
      resourceId: updatedEntity.id,
      changes: req.body,
    });

    structuredLogger.performance({
      operation: 'update_entity',
      durationMs: duration,
      tenantId,
    });

    res.json(createSuccessResponse({
      entity: updatedEntity,
    }));
  })
);

/**
 * DELETE /api/v1/entities/:slug
 * Deactivate an entity (soft delete)
 */
router.delete('/:slug',
  requireRole('admin'),
  validateParams(z.object({ slug: SlugSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for entity deletion');
    }

    // Check if entity exists
    const existingEntity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!existingEntity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    const timer = Date.now();
    const { prisma } = await import('@synkboard/database');
    await prisma.entity.update({
      where: { 
        tenant_id_slug: {
          tenant_id: tenantId,
          slug,
        }
      },
      data: { is_active: false },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'entity_deleted',
      resourceType: 'entity',
      resourceId: existingEntity.id,
    });

    structuredLogger.performance({
      operation: 'delete_entity',
      durationMs: duration,
      tenantId,
    });

    res.status(204).send();
  })
);

/**
 * GET /api/v1/entities/:slug/fields
 * List all fields for an entity
 */
router.get('/:slug/fields',
  requirePermission('entity:view'),
  validateParams(z.object({ slug: SlugSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { slug } = req.params;

    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    res.json(createSuccessResponse({
      fields: entity.fields,
    }));
  })
);

/**
 * POST /api/v1/entities/:slug/fields
 * Add a new field to an entity
 */
router.post('/:slug/fields',
  requirePermission('entity:editSchema'),
  validateParams(z.object({ slug: SlugSchema })),
  validateBody(CreateEntityFieldSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for field creation');
    }

    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    // Check if field key already exists
    const existingField = entity.fields.find(f => f.key === req.body.key);
    if (existingField) {
      throw new ValidationError(`Field with key '${req.body.key}' already exists`);
    }

    const timer = Date.now();
    const field = await entityQueries.addFieldToEntity(tenantId, entity.id, req.body);
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'field_added',
      resourceType: 'entity_field',
      resourceId: field.id,
      metadata: { 
        entity_slug: slug,
        field_key: field.key,
        field_type: field.type,
      },
    });

    structuredLogger.performance({
      operation: 'add_entity_field',
      durationMs: duration,
      tenantId,
    });

    res.status(201).json(createSuccessResponse({
      field,
    }));
  })
);

/**
 * PUT /api/v1/entities/:slug/fields/:fieldId
 * Update an entity field
 */
router.put('/:slug/fields/:fieldId',
  requirePermission('entity:editSchema'),
  validateParams(z.object({
    slug: SlugSchema,
    fieldId: UuidSchema,
  })),
  validateBody(UpdateEntityFieldSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug, fieldId } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for field update');
    }

    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    const existingField = entity.fields.find(f => f.id === fieldId);
    if (!existingField) {
      throw new NotFoundError(`Field '${fieldId}' not found`);
    }

    // Prevent type changes if records exist
    if (req.body.type && req.body.type !== existingField.type) {
      const { prisma } = await import('@synkboard/database');
      const recordCount = await prisma.entityRecord.count({
        where: { entity_id: entity.id },
      });

      if (recordCount > 0) {
        throw new ValidationError(
          'Cannot change field type when records exist. Create a new field instead.'
        );
      }
    }

    const timer = Date.now();
    const { prisma } = await import('@synkboard/database');
    const updatedField = await prisma.entityField.update({
      where: { id: fieldId },
      data: req.body,
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'field_updated',
      resourceType: 'entity_field',
      resourceId: fieldId,
      changes: req.body,
      metadata: { entity_slug: slug },
    });

    structuredLogger.performance({
      operation: 'update_entity_field',
      durationMs: duration,
      tenantId,
    });

    res.json(createSuccessResponse({
      field: updatedField,
    }));
  })
);

/**
 * DELETE /api/v1/entities/:slug/fields/:fieldId
 * Remove a field from an entity
 */
router.delete('/:slug/fields/:fieldId',
  requireRole('admin'),
  validateParams(z.object({
    slug: SlugSchema,
    fieldId: UuidSchema,
  })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug, fieldId } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for field deletion');
    }

    const entity = await entityQueries.getEntityBySlug(tenantId, slug);
    if (!entity) {
      throw new NotFoundError(`Entity '${slug}' not found`);
    }

    const existingField = entity.fields.find(f => f.id === fieldId);
    if (!existingField) {
      throw new NotFoundError(`Field '${fieldId}' not found`);
    }

    const timer = Date.now();
    const { prisma } = await import('@synkboard/database');
    await prisma.entityField.delete({
      where: { id: fieldId },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'field_removed',
      resourceType: 'entity_field',
      resourceId: fieldId,
      metadata: {
        entity_slug: slug,
        field_key: existingField.key,
      },
    });

    structuredLogger.performance({
      operation: 'delete_entity_field',
      durationMs: duration,
      tenantId,
    });

    res.status(204).send();
  })
);

export default router;
