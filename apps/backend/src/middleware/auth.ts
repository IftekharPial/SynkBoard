/**
 * Authentication middleware for SynkBoard
 * Following api-contracts.md and role-based-access.md
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userQueries } from '@synkboard/database';
import { JwtPayload, Role, canPerform, Permission } from '@synkboard/types';
import { createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@synkboard/types';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        role: Role;
        email: string;
      };
      context?: {
        tenantId: string;
        userId?: string;
        role: string;
        requestId: string;
        sourceIp: string;
        userAgent?: string;
        apiKeyId?: string;
      };
    }
  }
}

/**
 * JWT Authentication middleware
 * Validates Bearer tokens and API keys
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Authorization header required')
      );
    }

    const token = authHeader.substring(7);
    
    // Check if it's an API key (starts with 'sk_')
    if (token.startsWith('sk_')) {
      return await handleApiKeyAuth(req, res, next, token);
    }
    
    // Handle JWT token
    return await handleJwtAuth(req, res, next, token);
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(ERROR_CODES.INVALID_TOKEN, 'Invalid authentication token')
    );
  }
}

/**
 * Handle JWT token authentication
 */
async function handleJwtAuth(
  req: Request,
  res: Response,
  next: NextFunction,
  token: string
) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Fetch user to ensure they still exist and are active
    const user = await userQueries.getUserById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'User not found or inactive')
      );
    }

    // Set user context
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role as Role,
      email: decoded.email,
    };

    req.context = {
      tenantId: decoded.tenantId,
      userId: decoded.userId,
      role: decoded.role,
      requestId: generateRequestId(),
      sourceIp: getClientIp(req),
      userAgent: req.headers['user-agent'],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(ERROR_CODES.TOKEN_EXPIRED, 'Token has expired')
      );
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(ERROR_CODES.INVALID_TOKEN, 'Invalid JWT token')
    );
  }
}

/**
 * Handle API key authentication
 */
async function handleApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
  apiKey: string
) {
  try {
    // Hash the API key for lookup
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const apiKeyRecord = await userQueries.validateApiKey(keyHash);
    
    if (!apiKeyRecord || !apiKeyRecord.is_active) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Invalid or inactive API key')
      );
    }

    // Check expiration
    if (apiKeyRecord.expires_at && new Date() > new Date(apiKeyRecord.expires_at)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(ERROR_CODES.TOKEN_EXPIRED, 'API key has expired')
      );
    }

    // Set context for API key
    req.context = {
      tenantId: apiKeyRecord.tenant_id,
      role: apiKeyRecord.role,
      requestId: generateRequestId(),
      sourceIp: getClientIp(req),
      userAgent: req.headers['user-agent'],
      apiKeyId: apiKeyRecord.id,
    };

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(ERROR_CODES.INVALID_TOKEN, 'Invalid API key')
    );
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.context) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Authentication required')
      );
    }

    const userRole = req.context.role as Role;
    
    // Check role hierarchy
    const ROLE_HIERARCHY = {
      superadmin: 5,
      admin: 4,
      editor: 3,
      analyst: 2,
      viewer: 1,
      integration: 0,
    };

    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(ERROR_CODES.FORBIDDEN, `Minimum role required: ${minRole}`)
      );
    }

    next();
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.context) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Authentication required')
      );
    }

    const userRole = req.context.role as Role;
    
    if (!canPerform(permission, userRole)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(ERROR_CODES.FORBIDDEN, `Permission denied: ${permission}`)
      );
    }

    next();
  };
}

/**
 * Tenant scope validation middleware
 */
export function validateTenantScope(req: Request, res: Response, next: NextFunction) {
  if (!req.context) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Authentication required')
    );
  }

  // Check X-Tenant-ID header matches authenticated tenant
  const headerTenantId = req.headers['x-tenant-id'];
  
  if (headerTenantId && headerTenantId !== req.context.tenantId) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(ERROR_CODES.FORBIDDEN, 'Tenant ID mismatch')
    );
  }

  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return require('uuid').v4();
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
