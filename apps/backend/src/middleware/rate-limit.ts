/**
 * Rate limiting middleware for SynkBoard
 * Following api-contracts.md and webhook-behavior.md
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@synkboard/types';
import { logger } from '../utils/logger';

/**
 * Create rate limiter based on user role
 */
export function createRoleBasedRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req: Request) => {
      // If no context yet (before auth), use a generous default for public endpoints
      if (!req.context) {
        return 100; // Allow reasonable requests for auth endpoints
      }

      const role = req.context.role || 'viewer';

      // Rate limits by role following api-contracts.md
      const limits = {
        superadmin: 1000,
        admin: 500,
        editor: 200,
        analyst: 100,
        viewer: 50,
        integration: 60, // 1 per second for webhooks
      };

      return limits[role as keyof typeof limits] || 50;
    },
    keyGenerator: (req: Request) => {
      // If no context yet, use IP-based rate limiting
      if (!req.context) {
        return `ip:${req.ip}`;
      }

      // Use tenant + user/api key for rate limiting
      const tenantId = req.context.tenantId || 'unknown';
      const userId = req.context.userId || req.context.apiKeyId || 'anonymous';
      return `${tenantId}:${userId}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        tenant_id: req.context?.tenantId || 'unknown',
        user_id: req.context?.userId || 'anonymous',
        api_key_id: req.context?.apiKeyId,
        role: req.context?.role || 'unauthenticated',
        source_ip: req.context?.sourceIp || req.ip,
        route: req.path,
        method: req.method,
      });

      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
        createErrorResponse(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded. Please try again later.'
        )
      );
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Webhook-specific rate limiter
 */
export function createWebhookRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute (1 per second)
    keyGenerator: (req: Request) => {
      // Rate limit by tenant + API key for webhooks
      const tenantId = req.context?.tenantId || 'unknown';
      const apiKeyId = req.context?.apiKeyId || 'unknown';
      return `webhook:${tenantId}:${apiKeyId}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Webhook rate limit exceeded', {
        tenant_id: req.context?.tenantId,
        api_key_id: req.context?.apiKeyId,
        source_ip: req.context?.sourceIp,
        entity: req.body?.entity,
      });
      
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
        createErrorResponse(
          ERROR_CODES.WEBHOOK_RATE_LIMITED,
          'Webhook rate limit exceeded. Maximum 60 requests per minute.'
        )
      );
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Abuse detection middleware
 * Detects suspicious patterns and flags them
 */
export function abuseDetectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sourceIp = req.context?.sourceIp;
  const userAgent = req.headers['user-agent'];
  
  // Simple abuse detection patterns
  const suspiciousPatterns = [
    // No user agent
    !userAgent,
    // Very short user agent
    userAgent && userAgent.length < 10,
    // Common bot patterns
    userAgent && /bot|crawler|spider|scraper/i.test(userAgent),
    // Suspicious paths
    req.path.includes('..') || req.path.includes('<script>'),
  ];
  
  const suspiciousScore = suspiciousPatterns.filter(Boolean).length;
  
  if (suspiciousScore >= 2) {
    logger.warn('Suspicious request detected', {
      tenant_id: req.context?.tenantId,
      source_ip: sourceIp,
      user_agent: userAgent,
      path: req.path,
      method: req.method,
      suspicious_score: suspiciousScore,
    });
    
    // Don't block immediately, but log for monitoring
    res.locals.suspiciousRequest = true;
  }
  
  next();
}

/**
 * IP-based rate limiter for public endpoints
 */
export function createIpRateLimit(maxRequests = 100) {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: maxRequests,
    keyGenerator: (req: Request) => {
      return req.context?.sourceIp || req.ip;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('IP rate limit exceeded', {
        source_ip: req.context?.sourceIp || req.ip,
        route: req.path,
        method: req.method,
      });
      
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
        createErrorResponse(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'Too many requests from this IP. Please try again later.'
        )
      );
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Burst protection for high-frequency endpoints
 */
export function createBurstProtection(burstLimit = 10, windowMs = 1000) {
  return rateLimit({
    windowMs,
    max: burstLimit,
    keyGenerator: (req: Request) => {
      const tenantId = req.context?.tenantId || 'unknown';
      const userId = req.context?.userId || req.context?.apiKeyId || 'anonymous';
      return `burst:${tenantId}:${userId}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Burst limit exceeded', {
        tenant_id: req.context?.tenantId,
        user_id: req.context?.userId,
        api_key_id: req.context?.apiKeyId,
        route: req.path,
        method: req.method,
      });
      
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
        createErrorResponse(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'Too many requests in a short time. Please slow down.'
        )
      );
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
