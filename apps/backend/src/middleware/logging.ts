/**
 * Logging middleware for SynkBoard
 * Following api-contracts.md logging requirements
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs all API requests with required fields from api-contracts.md
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response details
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Log the request
    logApiRequest(req, res, duration);
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Log API request with all required fields
 */
function logApiRequest(req: Request, res: Response, duration: number) {
  const logData = {
    timestamp: new Date().toISOString(),
    route: req.route?.path || req.path,
    method: req.method,
    tenant_id: req.context?.tenantId || 'unknown',
    user_id: req.context?.userId || null,
    role: req.context?.role || 'unknown',
    status_code: res.statusCode,
    duration_ms: duration,
    error_code: res.locals.errorCode || null,
    source_ip: req.context?.sourceIp || getClientIp(req),
    request_id: req.context?.requestId || 'unknown',
    user_agent: req.headers['user-agent'] || null,
  };

  // Determine log level based on status code
  if (res.statusCode >= 500) {
    logger.error('API Request', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('API Request', logData);
  } else {
    logger.info('API Request', logData);
  }
}

/**
 * Error logging middleware
 * Captures and logs all errors
 */
export function errorLoggingMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errorData = {
    timestamp: new Date().toISOString(),
    route: req.route?.path || req.path,
    method: req.method,
    tenant_id: req.context?.tenantId || 'unknown',
    user_id: req.context?.userId || null,
    role: req.context?.role || 'unknown',
    request_id: req.context?.requestId || 'unknown',
    source_ip: req.context?.sourceIp || getClientIp(req),
    error_message: error.message,
    error_stack: error.stack,
    error_code: error.code || 'INTERNAL_SERVER_ERROR',
  };

  logger.error('API Error', errorData);
  
  // Set error code for request logging
  res.locals.errorCode = error.code || 'INTERNAL_SERVER_ERROR';
  
  next(error);
}

/**
 * Audit logging for critical actions
 */
export function auditLog(
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: any,
  metadata?: any
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store audit data for post-request logging
    res.locals.auditData = {
      action,
      resourceType,
      resourceId,
      changes,
      metadata,
    };
    
    next();
  };
}

/**
 * Post-response audit logging
 */
export function postResponseAuditLog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    // Log audit event if data exists and request was successful
    if (res.locals.auditData && res.statusCode < 400) {
      const auditData = {
        timestamp: new Date().toISOString(),
        tenant_id: req.context?.tenantId || 'unknown',
        user_id: req.context?.userId || null,
        request_id: req.context?.requestId || 'unknown',
        ...res.locals.auditData,
      };
      
      logger.info('Audit Event', auditData);
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

/**
 * Sanitize log data to remove sensitive information
 */
export function sanitizeLogData(data: any): any {
  const sensitiveFields = [
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session',
  ];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}
