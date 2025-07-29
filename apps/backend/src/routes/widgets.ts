/**
 * Widget management routes for SynkBoard
 * Following dashboard-widgets.md rules
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { executeWidgetQuery } from '../services/query-engine';
import { 
  CreateWidgetSchema,
  UpdateWidgetSchema,
  WidgetQueryParamsSchema,
  UuidSchema,
  validateWidgetConfig,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
} from '@synkboard/types';
import { logger, structuredLogger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// All widget routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/widgets
 * List all widgets for the tenant
 */
router.get('/',
  requirePermission('dashboard:view'),
  validateQuery(z.object({
    dashboard_id: UuidSchema.optional(),
    entity_id: UuidSchema.optional(),
  })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { dashboard_id, entity_id } = req.query as any;

    const { prisma } = await import('@synkboard/database');
    
    // Build where clause
    const where: any = {
      dashboard: {
        tenant_id: tenantId,
      },
    };

    if (dashboard_id) {
      where.dashboard_id = dashboard_id;
    }

    if (entity_id) {
      where.entity_id = entity_id;
    }

    const timer = Date.now();
    const widgets = await prisma.widget.findMany({
      where,
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
        dashboard: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    const duration = Date.now() - timer;

    structuredLogger.performance({
      operation: 'list_widgets',
      durationMs: duration,
      tenantId,
      metadata: { count: widgets.length },
    });

    res.json(createSuccessResponse({
      widgets,
    }));
  })
);

/**
 * POST /api/v1/widgets
 * Create a new widget
 */
router.post('/',
  requirePermission('dashboard:edit'),
  validateBody(CreateWidgetSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    
    if (!userId) {
      throw new ValidationError('User ID required for widget creation');
    }

    const { dashboard_id, entity_id, type, config, ...widgetData } = req.body;

    // Validate widget configuration
    if (!validateWidgetConfig(type, config)) {
      throw new ValidationError(`Invalid configuration for widget type '${type}'`);
    }

    // Verify dashboard exists and user has access
    const { prisma } = await import('@synkboard/database');
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboard_id,
        tenant_id: tenantId,
      },
    });

    if (!dashboard) {
      throw new NotFoundError('Dashboard not found');
    }

    // Verify entity exists
    const entity = await prisma.entity.findFirst({
      where: {
        id: entity_id,
        tenant_id: tenantId,
        is_active: true,
      },
    });

    if (!entity) {
      throw new NotFoundError('Entity not found');
    }

    const timer = Date.now();
    const widget = await prisma.widget.create({
      data: {
        dashboard_id,
        entity_id,
        type,
        config,
        ...widgetData,
      },
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
        dashboard: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'widget_created',
      resourceType: 'widget',
      resourceId: widget.id,
      metadata: { 
        dashboard_id,
        entity_id,
        type,
        title: widget.title,
      },
    });

    structuredLogger.performance({
      operation: 'create_widget',
      durationMs: duration,
      tenantId,
    });

    res.status(201).json(createSuccessResponse({
      widget,
    }));
  })
);

/**
 * GET /api/v1/widgets/:id
 * Get widget by ID
 */
router.get('/:id',
  requirePermission('dashboard:view'),
  validateParams(z.object({ id: UuidSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { id } = req.params;

    const { prisma } = await import('@synkboard/database');
    const widget = await prisma.widget.findFirst({
      where: {
        id,
        dashboard: {
          tenant_id: tenantId,
        },
      },
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
        dashboard: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!widget) {
      throw new NotFoundError('Widget not found');
    }

    res.json(createSuccessResponse({
      widget,
    }));
  })
);

/**
 * PUT /api/v1/widgets/:id
 * Update widget
 */
router.put('/:id',
  requirePermission('dashboard:edit'),
  validateParams(z.object({ id: UuidSchema })),
  validateBody(UpdateWidgetSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for widget update');
    }

    // Check if widget exists
    const { prisma } = await import('@synkboard/database');
    const existingWidget = await prisma.widget.findFirst({
      where: {
        id,
        dashboard: {
          tenant_id: tenantId,
        },
      },
    });

    if (!existingWidget) {
      throw new NotFoundError('Widget not found');
    }

    // Validate widget configuration if being updated
    if (req.body.config) {
      if (!validateWidgetConfig(existingWidget.type, req.body.config)) {
        throw new ValidationError(`Invalid configuration for widget type '${existingWidget.type}'`);
      }
    }

    const timer = Date.now();
    const updatedWidget = await prisma.widget.update({
      where: { id },
      data: req.body,
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
        dashboard: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'widget_updated',
      resourceType: 'widget',
      resourceId: id,
      changes: req.body,
    });

    structuredLogger.performance({
      operation: 'update_widget',
      durationMs: duration,
      tenantId,
    });

    res.json(createSuccessResponse({
      widget: updatedWidget,
    }));
  })
);

/**
 * DELETE /api/v1/widgets/:id
 * Delete widget
 */
router.delete('/:id',
  requirePermission('dashboard:edit'),
  validateParams(z.object({ id: UuidSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { id } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for widget deletion');
    }

    // Check if widget exists
    const { prisma } = await import('@synkboard/database');
    const existingWidget = await prisma.widget.findFirst({
      where: {
        id,
        dashboard: {
          tenant_id: tenantId,
        },
      },
    });

    if (!existingWidget) {
      throw new NotFoundError('Widget not found');
    }

    const timer = Date.now();
    await prisma.widget.delete({
      where: { id },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'widget_deleted',
      resourceType: 'widget',
      resourceId: id,
    });

    structuredLogger.performance({
      operation: 'delete_widget',
      durationMs: duration,
      tenantId,
    });

    res.status(204).send();
  })
);

/**
 * GET /api/v1/widgets/:id/data
 * Fetch widget data
 */
router.get('/:id/data',
  requirePermission('dashboard:view'),
  validateParams(z.object({ id: UuidSchema })),
  validateQuery(WidgetQueryParamsSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { id } = req.params;
    const { start_date, end_date, filters } = req.query as any;

    // Get widget with entity info
    const { prisma } = await import('@synkboard/database');
    const widget = await prisma.widget.findFirst({
      where: {
        id,
        dashboard: {
          tenant_id: tenantId,
        },
      },
      include: {
        entity: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!widget) {
      throw new NotFoundError('Widget not found');
    }

    // Merge widget filters with query filters
    const combinedFilters = {
      ...widget.filters,
      ...filters,
    };

    const timer = Date.now();
    const data = await executeWidgetQuery({
      tenantId,
      entityId: widget.entity_id,
      widgetType: widget.type,
      config: widget.config,
      filters: combinedFilters,
      startDate: start_date,
      endDate: end_date,
    });
    const duration = Date.now() - timer;

    structuredLogger.performance({
      operation: 'fetch_widget_data',
      durationMs: duration,
      tenantId,
      metadata: { 
        widget_id: id,
        widget_type: widget.type,
        entity_slug: widget.entity.slug,
      },
    });

    res.json(createSuccessResponse({
      data,
      generated_at: new Date().toISOString(),
      // TODO: Add cache_expires_at based on refresh_rate
    }));
  })
);

export default router;
