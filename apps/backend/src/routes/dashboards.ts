/**
 * Dashboard management routes for SynkBoard
 * Following dashboard-widgets.md rules
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { dashboardQueries } from '@synkboard/database';
import { 
  CreateDashboardSchema,
  UpdateDashboardSchema,
  SlugSchema,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
} from '@synkboard/types';
import { logger, structuredLogger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/v1/dashboards
 * List all dashboards for the tenant
 */
router.get('/',
  authMiddleware,
  requirePermission('dashboard:view'),
  validateQuery(z.object({
    include_public: z.coerce.boolean().default(false),
  })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { include_public } = req.query as any;

    const timer = Date.now();
    const dashboards = await dashboardQueries.getDashboardsForTenant(tenantId, include_public);
    const duration = Date.now() - timer;

    structuredLogger.performance({
      operation: 'list_dashboards',
      durationMs: duration,
      tenantId,
      metadata: { count: dashboards.length },
    });

    res.json(createSuccessResponse({
      dashboards,
    }));
  })
);

/**
 * POST /api/v1/dashboards
 * Create a new dashboard
 */
router.post('/',
  authMiddleware,
  requirePermission('dashboard:create'),
  validateBody(CreateDashboardSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    
    if (!userId) {
      throw new ValidationError('User ID required for dashboard creation');
    }

    // Check if slug already exists
    const { prisma } = await import('@synkboard/database');
    const existingDashboard = await prisma.dashboard.findFirst({
      where: {
        tenant_id: tenantId,
        slug: req.body.slug,
      },
    });

    if (existingDashboard) {
      throw new ValidationError(`Dashboard with slug '${req.body.slug}' already exists`);
    }

    const timer = Date.now();
    const dashboard = await prisma.dashboard.create({
      data: {
        tenant_id: tenantId,
        created_by: userId,
        ...req.body,
      },
      include: {
        widgets: {
          include: {
            entity: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'dashboard_created',
      resourceType: 'dashboard',
      resourceId: dashboard.id,
      metadata: { 
        name: dashboard.name,
        slug: dashboard.slug,
        is_public: dashboard.is_public,
      },
    });

    structuredLogger.performance({
      operation: 'create_dashboard',
      durationMs: duration,
      tenantId,
    });

    res.status(201).json(createSuccessResponse({
      dashboard,
    }));
  })
);

/**
 * GET /api/v1/dashboards/:slug
 * Get dashboard by slug with widgets
 */
router.get('/:slug',
  // Public dashboards don't require auth
  (req, res, next) => {
    // Check if this is a public dashboard request
    if (req.query.public === 'true') {
      return next();
    }
    // Otherwise require authentication
    authMiddleware(req, res, next);
  },
  validateParams(z.object({ slug: SlugSchema })),
  validateQuery(z.object({
    public: z.coerce.boolean().default(false),
  })),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { public: isPublicRequest } = req.query as any;
    
    // For authenticated requests, use tenant from context
    // For public requests, we need to find the dashboard first
    let tenantId: string;
    
    if (isPublicRequest) {
      // Find public dashboard by slug
      const { prisma } = await import('@synkboard/database');
      const publicDashboard = await prisma.dashboard.findFirst({
        where: { 
          slug,
          is_public: true,
        },
        select: { tenant_id: true },
      });
      
      if (!publicDashboard) {
        throw new NotFoundError(`Public dashboard '${slug}' not found`);
      }
      
      tenantId = publicDashboard.tenant_id;
    } else {
      if (!req.context) {
        throw new ValidationError('Authentication required for private dashboards');
      }
      tenantId = req.context.tenantId;
    }

    const timer = Date.now();
    const dashboard = await dashboardQueries.getDashboardBySlug(tenantId, slug);
    const duration = Date.now() - timer;

    if (!dashboard) {
      throw new NotFoundError(`Dashboard '${slug}' not found`);
    }

    // Check access permissions
    if (!isPublicRequest && !dashboard.is_public) {
      // Private dashboard - check permissions
      if (!req.context) {
        throw new ValidationError('Authentication required');
      }
      // Permission already checked by middleware
    } else if (isPublicRequest && !dashboard.is_public) {
      throw new NotFoundError(`Public dashboard '${slug}' not found`);
    }

    structuredLogger.performance({
      operation: 'get_dashboard',
      durationMs: duration,
      tenantId,
      metadata: { 
        slug,
        is_public_request: isPublicRequest,
        widget_count: dashboard.widgets.length,
      },
    });

    res.json(createSuccessResponse({
      dashboard,
    }));
  })
);

/**
 * PUT /api/v1/dashboards/:slug
 * Update dashboard
 */
router.put('/:slug',
  authMiddleware,
  requirePermission('dashboard:edit'),
  validateParams(z.object({ slug: SlugSchema })),
  validateBody(UpdateDashboardSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for dashboard update');
    }

    // Check if dashboard exists
    const existingDashboard = await dashboardQueries.getDashboardBySlug(tenantId, slug);
    if (!existingDashboard) {
      throw new NotFoundError(`Dashboard '${slug}' not found`);
    }

    const timer = Date.now();
    const { prisma } = await import('@synkboard/database');
    const updatedDashboard = await prisma.dashboard.update({
      where: { 
        tenant_id_slug: {
          tenant_id: tenantId,
          slug,
        }
      },
      data: req.body,
      include: {
        widgets: {
          include: {
            entity: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'dashboard_updated',
      resourceType: 'dashboard',
      resourceId: updatedDashboard.id,
      changes: req.body,
    });

    structuredLogger.performance({
      operation: 'update_dashboard',
      durationMs: duration,
      tenantId,
    });

    res.json(createSuccessResponse({
      dashboard: updatedDashboard,
    }));
  })
);

/**
 * DELETE /api/v1/dashboards/:slug
 * Delete dashboard
 */
router.delete('/:slug',
  authMiddleware,
  requirePermission('dashboard:delete'),
  validateParams(z.object({ slug: SlugSchema })),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const userId = req.context!.userId;
    const { slug } = req.params;

    if (!userId) {
      throw new ValidationError('User ID required for dashboard deletion');
    }

    // Check if dashboard exists
    const existingDashboard = await dashboardQueries.getDashboardBySlug(tenantId, slug);
    if (!existingDashboard) {
      throw new NotFoundError(`Dashboard '${slug}' not found`);
    }

    const timer = Date.now();
    const { prisma } = await import('@synkboard/database');
    await prisma.dashboard.delete({
      where: { 
        tenant_id_slug: {
          tenant_id: tenantId,
          slug,
        }
      },
    });
    const duration = Date.now() - timer;

    structuredLogger.auditEvent({
      tenantId,
      userId,
      action: 'dashboard_deleted',
      resourceType: 'dashboard',
      resourceId: existingDashboard.id,
    });

    structuredLogger.performance({
      operation: 'delete_dashboard',
      durationMs: duration,
      tenantId,
    });

    res.status(204).send();
  })
);

export default router;
