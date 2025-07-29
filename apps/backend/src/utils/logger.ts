/**
 * Logger utility for SynkBoard
 * Following api-contracts.md logging requirements
 */

import winston from 'winston';

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Create Winston logger instance
export const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    })
  ),
  defaultMeta: {
    service: 'synkboard-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Structured logging functions
export const structuredLogger = {
  /**
   * Log API request
   */
  apiRequest: (data: {
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
    tenantId: string;
    userId?: string;
    role: string;
    sourceIp: string;
    requestId: string;
    errorCode?: string;
  }) => {
    const level = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'API Request', {
      type: 'api_request',
      ...data,
    });
  },

  /**
   * Log webhook event
   */
  webhookEvent: (data: {
    tenantId: string;
    entity: string;
    status: 'success' | 'failed';
    durationMs: number;
    apiKeyId?: string;
    sourceIp: string;
    errorCode?: string;
    requestId: string;
  }) => {
    const level = data.status === 'failed' ? 'error' : 'info';
    logger.log(level, 'Webhook Event', {
      type: 'webhook_event',
      ...data,
    });
  },

  /**
   * Log rule execution
   */
  ruleExecution: (data: {
    tenantId: string;
    ruleId: string;
    recordId: string;
    status: 'matched' | 'skipped' | 'failed';
    durationMs: number;
    actionsExecuted: number;
    actionsFailed: number;
  }) => {
    const level = data.status === 'failed' ? 'error' : 'info';
    logger.log(level, 'Rule Execution', {
      type: 'rule_execution',
      ...data,
    });
  },

  /**
   * Log audit event
   */
  auditEvent: (data: {
    tenantId: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changes?: any;
    metadata?: any;
  }) => {
    logger.info('Audit Event', {
      type: 'audit_event',
      ...data,
    });
  },

  /**
   * Log security event
   */
  securityEvent: (data: {
    tenantId?: string;
    userId?: string;
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    sourceIp: string;
    details?: any;
  }) => {
    const level = data.severity === 'critical' ? 'error' : data.severity === 'high' ? 'warn' : 'info';
    logger.log(level, 'Security Event', {
      type: 'security_event',
      ...data,
    });
  },

  /**
   * Log performance metric
   */
  performance: (data: {
    operation: string;
    durationMs: number;
    tenantId?: string;
    metadata?: any;
  }) => {
    logger.info('Performance Metric', {
      type: 'performance',
      ...data,
    });
  },

  /**
   * Log database operation
   */
  database: (data: {
    operation: string;
    table: string;
    durationMs: number;
    tenantId?: string;
    recordCount?: number;
    error?: string;
  }) => {
    const level = data.error ? 'error' : 'debug';
    logger.log(level, 'Database Operation', {
      type: 'database',
      ...data,
    });
  },
};

// Error logging helper
export function logError(error: Error, context?: any) {
  logger.error('Application Error', {
    type: 'application_error',
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

// Performance timing helper
export function createTimer() {
  const start = Date.now();
  
  return {
    end: () => Date.now() - start,
  };
}

// Sanitize sensitive data from logs
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session',
    'key_hash',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

// Log stream for external services (e.g., Datadog, Loki)
export function createLogStream() {
  return new winston.transports.Stream({
    stream: process.stdout,
    format: winston.format.json(),
  });
}

export default logger;
