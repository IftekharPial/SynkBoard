/**
 * Webhook ingestion routes for SynkBoard
 * Following webhook-behavior.md rules
 */

import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createWebhookRateLimit } from '../middleware/rate-limit';
import { asyncHandler } from '../middleware/error-handler';
import { entityQueries, recordQueries } from '@synkboard/database';
import { 
  WebhookIngestRequestSchema,
  validateWebhookPayload,
  validateRecordFields,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  HTTP_STATUS,
  NotFoundError,
  ValidationError,
} from '@synkboard/types';
import { logger, structuredLogger, createTimer } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/v1/ingest
 * Webhook ingestion endpoint following webhook-behavior.md
 */
router.post('/ingest',
  // Webhook-specific rate limiting
  createWebhookRateLimit(),
  // Authentication required (API key with INTEGRATION role)
  authMiddleware,
  requirePermission('record:create'),
  // Validate request body
  validateBody(WebhookIngestRequestSchema),
  asyncHandler(async (req, res) => {
    const timer = createTimer();
    const requestId = uuidv4();
    const tenantId = req.context!.tenantId;
    const apiKeyId = req.context!.apiKeyId;
    const sourceIp = req.context!.sourceIp;
    const { entity: entitySlug, fields } = req.body;

    // Validate that this is an integration request
    if (req.context!.role !== 'integration') {
      throw new ValidationError('Webhook ingestion requires INTEGRATION role');
    }

    try {
      // Get entity with fields for validation
      const entity = await entityQueries.getEntityBySlug(tenantId, entitySlug);
      if (!entity) {
        await logWebhookEvent({
          tenantId,
          apiKeyId,
          entity: entitySlug,
          sourceIp,
          status: 'failed',
          durationMs: timer.end(),
          errorCode: ERROR_CODES.WEBHOOK_ENTITY_UNKNOWN,
          requestId,
        });

        throw new NotFoundError(`Entity '${entitySlug}' not found`);
      }

      // Validate webhook payload structure
      const payloadValidation = validateWebhookPayload(req.body, entity.fields);
      if (payloadValidation.length > 0) {
        await logWebhookEvent({
          tenantId,
          apiKeyId,
          entity: entitySlug,
          sourceIp,
          status: 'failed',
          durationMs: timer.end(),
          errorCode: ERROR_CODES.WEBHOOK_PAYLOAD_INVALID,
          requestId,
        });

        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
          createErrorResponse(
            ERROR_CODES.FIELD_VALIDATION_FAILED,
            'Webhook payload validation failed',
            { errors: payloadValidation }
          )
        );
      }

      // Validate record fields against entity schema
      const fieldValidation = validateRecordFields(fields, entity.fields);
      if (!fieldValidation.isValid) {
        await logWebhookEvent({
          tenantId,
          apiKeyId,
          entity: entitySlug,
          sourceIp,
          status: 'failed',
          durationMs: timer.end(),
          errorCode: ERROR_CODES.FIELD_VALIDATION_FAILED,
          requestId,
        });

        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
          createErrorResponse(
            ERROR_CODES.FIELD_VALIDATION_FAILED,
            'Field validation failed',
            { errors: fieldValidation.errors }
          )
        );
      }

      // Type coercion and normalization
      const normalizedFields = normalizeFieldValues(fields, entity.fields);

      // Create the record
      const record = await recordQueries.createRecord(
        tenantId,
        entity.id,
        normalizedFields,
        apiKeyId || 'webhook'
      );

      // TODO: Queue rule evaluation
      const triggeredRules = 0; // Placeholder

      const duration = timer.end();

      // Log successful webhook event
      await logWebhookEvent({
        tenantId,
        apiKeyId,
        entity: entitySlug,
        sourceIp,
        status: 'success',
        durationMs: duration,
        requestId,
      });

      // Emit webhook ingested event
      structuredLogger.auditEvent({
        tenantId,
        action: 'webhook_ingested',
        resourceType: 'entity_record',
        resourceId: record.id,
        metadata: {
          entity_slug: entitySlug,
          source_ip: sourceIp,
          api_key_id: apiKeyId,
          field_count: Object.keys(fields).length,
        },
      });

      res.json(createSuccessResponse({
        record_id: record.id,
        triggered_rules: triggeredRules,
      }));

    } catch (error) {
      const duration = timer.end();

      // Log failed webhook event
      await logWebhookEvent({
        tenantId,
        apiKeyId,
        entity: entitySlug,
        sourceIp,
        status: 'failed',
        durationMs: duration,
        errorCode: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
        requestId,
      });

      // Re-throw to be handled by global error handler
      throw error;
    }
  })
);

/**
 * GET /api/v1/webhooks/logs
 * Get webhook logs for admin users
 */
router.get('/logs',
  authMiddleware,
  requirePermission('audit:view'),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { page = 1, limit = 20, entity, status, start_date, end_date } = req.query;

    const { prisma } = await import('@synkboard/database');
    
    // Build where clause
    const where: any = { tenant_id: tenantId };
    
    if (entity) {
      where.entity = entity;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at.gte = new Date(start_date as string);
      }
      if (end_date) {
        where.created_at.lte = new Date(end_date as string);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        include: {
          api_key: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.webhookLog.count({ where }),
    ]);

    res.json(createSuccessResponse({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }));
  })
);

/**
 * GET /api/v1/webhooks/stats
 * Get webhook statistics for admin users
 */
router.get('/stats',
  authMiddleware,
  requirePermission('audit:view'),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { prisma } = await import('@synkboard/database');

    // Get stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalRequests, successCount, failedToday, avgDuration] = await Promise.all([
      // Total requests in last 30 days
      prisma.webhookLog.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: thirtyDaysAgo },
        },
      }),

      // Successful requests in last 30 days
      prisma.webhookLog.count({
        where: {
          tenant_id: tenantId,
          status: 'success',
          created_at: { gte: thirtyDaysAgo },
        },
      }),

      // Failed requests today
      prisma.webhookLog.count({
        where: {
          tenant_id: tenantId,
          status: 'failed',
          created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),

      // Average duration
      prisma.webhookLog.aggregate({
        where: {
          tenant_id: tenantId,
          created_at: { gte: thirtyDaysAgo },
        },
        _avg: { duration_ms: true },
      }),
    ]);

    const stats = {
      total_requests: totalRequests,
      success_rate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      failed_today: failedToday,
      avg_duration_ms: avgDuration._avg.duration_ms || 0,
    };

    res.json(createSuccessResponse({ stats }));
  })
);

/**
 * POST /api/v1/webhooks/test
 * Test webhook endpoint with sample payload
 */
router.post('/test',
  authMiddleware,
  requirePermission('audit:view'),
  validateBody(WebhookIngestRequestSchema),
  asyncHandler(async (req, res) => {
    const timer = createTimer();
    const tenantId = req.context!.tenantId;
    const { entity: entitySlug, fields } = req.body;

    try {
      // Get entity with fields for validation
      const entity = await entityQueries.getEntityBySlug(tenantId, entitySlug);
      if (!entity) {
        throw new NotFoundError(`Entity '${entitySlug}' not found`);
      }

      // Validate webhook payload structure
      const payloadValidation = validateWebhookPayload(req.body, entity.fields);
      if (payloadValidation.length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
          createErrorResponse(
            ERROR_CODES.FIELD_VALIDATION_FAILED,
            'Webhook payload validation failed',
            { errors: payloadValidation }
          )
        );
      }

      // Validate record fields against entity schema
      const fieldValidation = validateRecordFields(fields, entity.fields);
      if (!fieldValidation.isValid) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
          createErrorResponse(
            ERROR_CODES.FIELD_VALIDATION_FAILED,
            'Field validation failed',
            { errors: fieldValidation.errors }
          )
        );
      }

      const duration = timer.end();

      // Return test result without creating actual record
      res.json(createSuccessResponse({
        test_result: 'success',
        validation_passed: true,
        duration_ms: duration,
        message: 'Webhook payload is valid and would create a record successfully',
      }));

    } catch (error: any) {
      const duration = timer.end();

      res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(
          error.code || ERROR_CODES.INTERNAL_ERROR,
          error.message || 'Webhook test failed',
          { duration_ms: duration }
        )
      );
    }
  })
);

/**
 * Log webhook event to database
 */
async function logWebhookEvent(data: {
  tenantId: string;
  apiKeyId?: string;
  entity: string;
  sourceIp: string;
  status: 'success' | 'failed';
  durationMs: number;
  errorCode?: string;
  requestId: string;
}) {
  try {
    const { prisma } = await import('@synkboard/database');
    
    await prisma.webhookLog.create({
      data: {
        tenant_id: data.tenantId,
        api_key_id: data.apiKeyId,
        entity: data.entity,
        source_ip: data.sourceIp,
        status: data.status,
        duration_ms: data.durationMs,
        error_code: data.errorCode,
        // TODO: Add schema_version and deprecated_keys
      },
    });

    // Also log to structured logger
    structuredLogger.webhookEvent({
      tenantId: data.tenantId,
      entity: data.entity,
      status: data.status,
      durationMs: data.durationMs,
      apiKeyId: data.apiKeyId,
      sourceIp: data.sourceIp,
      errorCode: data.errorCode,
      requestId: data.requestId,
    });
  } catch (error) {
    logger.error('Failed to log webhook event', {
      error: error.message,
      webhook_data: data,
    });
  }
}

/**
 * Normalize field values based on field types
 */
function normalizeFieldValues(
  fields: Record<string, any>,
  entityFields: Array<{ key: string; type: string }>
): Record<string, any> {
  const normalized: Record<string, any> = {};
  const fieldMap = new Map(entityFields.map(f => [f.key, f.type]));

  for (const [key, value] of Object.entries(fields)) {
    const fieldType = fieldMap.get(key);
    
    if (!fieldType || value === null || value === undefined) {
      normalized[key] = value;
      continue;
    }

    try {
      switch (fieldType) {
        case 'text':
          normalized[key] = String(value).trim();
          break;
        
        case 'number':
          normalized[key] = typeof value === 'number' ? value : parseFloat(value);
          break;
        
        case 'boolean':
          normalized[key] = typeof value === 'boolean' ? value : 
            ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
          break;
        
        case 'date':
          normalized[key] = typeof value === 'string' ? value : new Date(value).toISOString();
          break;
        
        case 'select':
          normalized[key] = String(value).toLowerCase().trim();
          break;
        
        case 'multiselect':
          normalized[key] = Array.isArray(value) ? 
            value.map(v => String(v).toLowerCase().trim()) : 
            [String(value).toLowerCase().trim()];
          break;
        
        case 'rating':
          const rating = typeof value === 'number' ? value : parseInt(value);
          normalized[key] = Math.max(1, Math.min(5, rating));
          break;
        
        case 'user':
        case 'json':
        default:
          normalized[key] = value;
          break;
      }
    } catch (error) {
      // If normalization fails, use original value
      normalized[key] = value;
    }
  }

  return normalized;
}

export default router;
