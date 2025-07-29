/**
 * Authentication routes for SynkBoard backend
 * Handles login, refresh, and user info endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import { userQueries } from '@synkboard/database';
import { 
  LoginRequestSchema, 
  RefreshTokenRequestSchema,
  ApiSuccessResponse,
  ApiErrorResponse,
  ERROR_CODES,
} from '@synkboard/types';
import { 
  generateAuthTokens,
  verifyPassword,
  validateRefreshToken,
  revokeRefreshToken,
  sanitizeUser,
  AuthUser,
} from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/auth/login
 * User login with email and password
 */
router.post('/login', validateRequest(LoginRequestSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userQueries.getUserByEmail(email);
    if (!user) {
      logger.warn('Login attempt with invalid email', { email });
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid email or password',
        },
      } as ApiErrorResponse);
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.password_hash) {
      logger.warn('Login attempt for OAuth-only user', { email });
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Please use OAuth to sign in',
        },
      } as ApiErrorResponse);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email });
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid email or password',
        },
      } as ApiErrorResponse);
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login attempt for inactive user', { email });
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Account is deactivated',
        },
      } as ApiErrorResponse);
    }

    // Generate tokens
    const tokens = await generateAuthTokens(user as AuthUser);

    logger.info('User logged in successfully', { 
      userId: user.id, 
      email: user.email,
      tenantId: user.tenant_id,
    });

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user as AuthUser),
        token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
      },
    } as ApiSuccessResponse);

  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh JWT token using refresh token
 */
router.post('/refresh', validateRequest(RefreshTokenRequestSchema), async (req, res) => {
  try {
    const { refresh_token } = req.body;

    // Validate refresh token
    const user = await validateRefreshToken(refresh_token);
    if (!user) {
      logger.warn('Invalid refresh token used');
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid or expired refresh token',
        },
      } as ApiErrorResponse);
    }

    // Check if user is still active
    if (!user.is_active) {
      logger.warn('Refresh attempt for inactive user', { userId: user.id });
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Account is deactivated',
        },
      } as ApiErrorResponse);
    }

    // Revoke old refresh token
    await revokeRefreshToken(refresh_token);

    // Generate new tokens
    const tokens = await generateAuthTokens(user);

    logger.info('Token refreshed successfully', { 
      userId: user.id,
      tenantId: user.tenant_id,
    });

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
      },
    } as ApiSuccessResponse);

  } catch (error) {
    logger.error('Token refresh error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user information
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      } as ApiErrorResponse);
    }

    // Get fresh user data
    const user = await userQueries.getUserById(userId);
    if (!user) {
      logger.warn('User not found for authenticated request', { userId });
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found',
        },
      } as ApiErrorResponse);
    }

    // Check if user is still active
    if (!user.is_active) {
      logger.warn('Inactive user attempted to access /me', { userId });
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Account is deactivated',
        },
      } as ApiErrorResponse);
    }

    res.json({
      success: true,
      data: sanitizeUser(user as AuthUser),
    } as ApiSuccessResponse);

  } catch (error) {
    logger.error('Get user info error', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user and revoke refresh token
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await revokeRefreshToken(refresh_token);
    }

    logger.info('User logged out', { userId: req.user?.userId });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    } as ApiSuccessResponse);

  } catch (error) {
    logger.error('Logout error', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

export default router;
