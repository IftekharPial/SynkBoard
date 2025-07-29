/**
 * SynkBoard Backend API Server
 * Entry point for the Express REST API
 * Following api-contracts.md and role-based-access.md
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import {
  globalErrorHandler,
  notFoundHandler,
  setupGracefulShutdown,
  setupUnhandledRejectionHandler
} from './middleware/error-handler';
import {
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  postResponseAuditLog
} from './middleware/logging';
import { createRoleBasedRateLimit, abuseDetectionMiddleware } from './middleware/rate-limit';
import { validateContentType, validateRequestSize } from './middleware/validation';
import { createSuccessResponse } from '@synkboard/types';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Setup error handlers
setupUnhandledRejectionHandler();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

// Request size validation
app.use(validateRequestSize(10 * 1024 * 1024)); // 10MB limit

// Body parsing
app.use(express.json({
  limit: '10mb',
  strict: true,
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Content type validation for POST/PUT requests
app.use(validateContentType);

// Request logging
app.use(requestLoggingMiddleware);

// Abuse detection
app.use(abuseDetectionMiddleware);

// Health check endpoint (no auth or rate limiting required)
app.get('/health', (req, res) => {
  res.json(createSuccessResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  }));
});

// Rate limiting (applied after health endpoint)
app.use(createRoleBasedRateLimit());

// Audit logging setup
app.use(postResponseAuditLog);

// Import API routes
import apiRoutes from './routes';

// Mount API routes
app.use('/api/v1', apiRoutes);

// Error logging middleware
app.use(errorLoggingMiddleware);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info('SynkBoard API server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Setup graceful shutdown
setupGracefulShutdown(server);

export default app;
