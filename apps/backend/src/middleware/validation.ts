/**
 * Validation middleware for SynkBoard
 * Following api-contracts.md validation requirements
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@synkboard/types';
import { logger } from '../utils/logger';

/**
 * Validate request body against Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.input,
        }));

        logger.warn('Request body validation failed', {
          tenant_id: req.context?.tenantId,
          user_id: req.context?.userId,
          route: req.path,
          method: req.method,
          errors: validationErrors,
        });

        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
          createErrorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            'Request body validation failed',
            { errors: validationErrors }
          )
        );
      }

      next(error);
    }
  };
}

/**
 * Alias for validateBody for backward compatibility
 */
export const validateRequest = validateBody;

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.input,
        }));

        logger.warn('Query parameters validation failed', {
          tenant_id: req.context?.tenantId,
          user_id: req.context?.userId,
          route: req.path,
          method: req.method,
          errors: validationErrors,
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          createErrorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            'Query parameters validation failed',
            { errors: validationErrors }
          )
        );
      }

      next(error);
    }
  };
}

/**
 * Validate route parameters against Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.input,
        }));

        logger.warn('Route parameters validation failed', {
          tenant_id: req.context?.tenantId,
          user_id: req.context?.userId,
          route: req.path,
          method: req.method,
          errors: validationErrors,
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          createErrorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            'Route parameters validation failed',
            { errors: validationErrors }
          )
        );
      }

      next(error);
    }
  };
}

/**
 * Validate headers against Zod schema
 */
export function validateHeaders<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.headers);
      // Don't override headers, just validate
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.input,
        }));

        logger.warn('Headers validation failed', {
          tenant_id: req.context?.tenantId,
          user_id: req.context?.userId,
          route: req.path,
          method: req.method,
          errors: validationErrors,
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          createErrorResponse(
            ERROR_CODES.VALIDATION_ERROR,
            'Headers validation failed',
            { errors: validationErrors }
          )
        );
      }

      next(error);
    }
  };
}

/**
 * Validate that required system fields are not being modified
 */
export function validateSystemFields(req: Request, res: Response, next: NextFunction) {
  const systemFields = [
    'id',
    'tenant_id',
    'tenantId',
    'created_at',
    'createdAt',
    'updated_at',
    'updatedAt',
  ];

  if (req.body && typeof req.body === 'object') {
    const providedSystemFields = systemFields.filter(field => 
      req.body.hasOwnProperty(field)
    );

    if (providedSystemFields.length > 0) {
      logger.warn('Attempt to modify system fields', {
        tenant_id: req.context?.tenantId,
        user_id: req.context?.userId,
        route: req.path,
        method: req.method,
        system_fields: providedSystemFields,
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          `System fields cannot be modified: ${providedSystemFields.join(', ')}`
        )
      );
    }
  }

  next();
}

/**
 * Validate content type for POST/PUT requests
 */
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Content-Type must be application/json'
        )
      );
    }
  }

  next();
}

/**
 * Validate request size limits
 */
export function validateRequestSize(maxSizeBytes = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSizeBytes) {
      logger.warn('Request size limit exceeded', {
        tenant_id: req.context?.tenantId,
        user_id: req.context?.userId,
        route: req.path,
        method: req.method,
        content_length: contentLength,
        max_size: maxSizeBytes,
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          `Request size exceeds limit of ${maxSizeBytes} bytes`
        )
      );
    }

    next();
  };
}

/**
 * Custom validation function wrapper
 */
export function customValidation(
  validationFn: (req: Request) => { isValid: boolean; errors: string[] }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validationFn(req);
    
    if (!result.isValid) {
      logger.warn('Custom validation failed', {
        tenant_id: req.context?.tenantId,
        user_id: req.context?.userId,
        route: req.path,
        method: req.method,
        errors: result.errors,
      });

      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
        createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Validation failed',
          { errors: result.errors }
        )
      );
    }

    next();
  };
}

// Helper function to create error response with details
function createErrorResponse(code: string, message: string, details?: any) {
  const response: any = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return response;
}
