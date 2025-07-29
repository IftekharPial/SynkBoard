/**
 * API routes index for SynkBoard
 * Following api-contracts.md structure
 */

import { Router } from 'express';
import authRouter from './auth';
import entitiesRouter from './entities';
import recordsRouter from './records';
import webhooksRouter from './webhooks';
import rulesRouter from './rules';
import dashboardsRouter from './dashboards';
import widgetsRouter from './widgets';

const router = Router();

// Mount auth routes
router.use('/auth', authRouter);

// Mount entity routes
router.use('/entities', entitiesRouter);

// Mount record routes (nested under entities)
router.use('/entities', recordsRouter);

// Mount webhook routes
router.use('/webhooks', webhooksRouter);

// Mount rules routes
router.use('/rules', rulesRouter);

// Mount dashboard routes
router.use('/dashboards', dashboardsRouter);

// Mount widget routes
router.use('/widgets', widgetsRouter);

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    name: 'SynkBoard API',
    version: '1.0.0',
    description: 'Multi-tenant, schema-less analytics platform API',
    documentation: {
      entities: {
        'GET /entities': 'List all entities for tenant',
        'POST /entities': 'Create new entity',
        'GET /entities/:slug': 'Get entity by slug',
        'PUT /entities/:slug': 'Update entity',
        'DELETE /entities/:slug': 'Delete entity',
        'GET /entities/:slug/fields': 'List entity fields',
        'POST /entities/:slug/fields': 'Add entity field',
        'PUT /entities/:slug/fields/:fieldId': 'Update entity field',
        'DELETE /entities/:slug/fields/:fieldId': 'Delete entity field',
      },
      records: {
        'GET /entities/:slug/records': 'List records with pagination and filtering',
        'POST /entities/:slug/records': 'Create new record',
        'GET /entities/:slug/records/:id': 'Get record by ID',
        'PUT /entities/:slug/records/:id': 'Update record',
        'DELETE /entities/:slug/records/:id': 'Delete record',
      },
      webhooks: {
        'POST /webhooks/ingest': 'Webhook ingestion endpoint (requires INTEGRATION role)',
        'GET /webhooks/logs': 'Get webhook logs (admin only)',
        'GET /webhooks/stats': 'Get webhook statistics (admin only)',
        'POST /webhooks/test': 'Test webhook payload validation (admin only)',
      },
      rules: {
        'GET /rules': 'List all rules for tenant',
        'POST /rules': 'Create new rule (admin only)',
        'GET /rules/:id': 'Get rule by ID',
        'PUT /rules/:id': 'Update rule (admin only)',
        'DELETE /rules/:id': 'Delete rule (admin only)',
        'POST /rules/test': 'Test rule evaluation (admin only)',
        'GET /rules/logs': 'Get rule execution logs (admin only)',
      },
      dashboards: {
        'GET /dashboards': 'List all dashboards for tenant',
        'POST /dashboards': 'Create new dashboard',
        'GET /dashboards/:slug': 'Get dashboard by slug (supports public access)',
        'PUT /dashboards/:slug': 'Update dashboard',
        'DELETE /dashboards/:slug': 'Delete dashboard',
      },
      widgets: {
        'GET /widgets': 'List all widgets for tenant',
        'POST /widgets': 'Create new widget',
        'GET /widgets/:id': 'Get widget by ID',
        'PUT /widgets/:id': 'Update widget',
        'DELETE /widgets/:id': 'Delete widget',
        'GET /widgets/:id/data': 'Fetch widget data with dynamic queries',
      },
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      'api-key': 'Authorization: Bearer sk_<api_key>',
    },
    headers: {
      'X-Tenant-ID': 'Optional tenant ID override (must match authenticated tenant)',
      'Content-Type': 'application/json',
    },
    errors: {
      format: {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Human readable message',
        },
      },
      codes: [
        'UNAUTHORIZED',
        'FORBIDDEN', 
        'RESOURCE_NOT_FOUND',
        'VALIDATION_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
      ],
    },
  });
});

export default router;
