/**
 * Error handling middleware for SynkBoard
 * Following api-contracts.md error response format
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@synkboard/database';
import { createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@synkboard/types';
import { logger, logError } from '../utils/logger';

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logError(error, {
    tenant_id: req.context?.tenantId,
    user_id: req.context?.userId,
    route: req.path,
    method: req.method,
    request_id: req.context?.requestId,
  });

  // Handle different error types
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(
      createErrorResponse(error.code, error.message)
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, req, res);
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
      createErrorResponse(ERROR_CODES.VALIDATION_ERROR, error.message)
    );
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(ERROR_CODES.INVALID_TOKEN, 'Invalid token')
    );
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(ERROR_CODES.TOKEN_EXPIRED, 'Token has expired')
    );
  }

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid JSON in request body')
    );
  }

  // Default internal server error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      isDevelopment ? error.message : 'Internal server error'
    )
  );
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response
) {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      const fieldName = field ? field[0] : 'field';
      return res.status(HTTP_STATUS.CONFLICT).json(
        createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          `${fieldName} already exists`
        )
      );

    case 'P2025':
      // Record not found
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(ERROR_CODES.RESOURCE_NOT_FOUND, 'Resource not found')
      );

    case 'P2003':
      // Foreign key constraint violation
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Referenced resource does not exist'
        )
      );

    case 'P2014':
      // Required relation violation
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Required relationship is missing'
        )
      );

    default:
      logger.error('Unhandled Prisma error', {
        code: error.code,
        message: error.message,
        meta: error.meta,
        tenant_id: req.context?.tenantId,
        user_id: req.context?.userId,
      });

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(ERROR_CODES.DATABASE_ERROR, 'Database operation failed')
      );
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error classes
 */
export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.VALIDATION_ERROR);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * Async error wrapper
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any) {
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * Unhandled rejection handler
 */
export function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
    });
    
    // Don't exit in production, just log
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    
    process.exit(1);
  });
}
