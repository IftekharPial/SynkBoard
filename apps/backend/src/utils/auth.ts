/**
 * Authentication utilities for SynkBoard backend
 * JWT token generation, password validation, and auth helpers
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { User, Tenant } from '@prisma/client';
import { userQueries } from '@synkboard/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthUser extends User {
  tenant: Tenant;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'synkboard',
    audience: 'synkboard-api',
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate both access and refresh tokens
 */
export async function generateAuthTokens(user: AuthUser): Promise<AuthTokens> {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  
  // Calculate expiration dates
  const accessTokenExpiresAt = new Date();
  accessTokenExpiresAt.setTime(
    accessTokenExpiresAt.getTime() + parseTimeToMs(JWT_EXPIRES_IN)
  );

  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setTime(
    refreshTokenExpiresAt.getTime() + parseTimeToMs(REFRESH_TOKEN_EXPIRES_IN)
  );

  // Store refresh token in database
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await userQueries.createRefreshToken(
    user.id,
    refreshTokenHash,
    refreshTokenExpiresAt
  );

  return {
    accessToken,
    refreshToken,
    expiresAt: accessTokenExpiresAt,
  };
}

/**
 * Verify JWT token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'synkboard',
      audience: 'synkboard-api',
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate refresh token
 */
export async function validateRefreshToken(token: string): Promise<AuthUser | null> {
  try {
    // Clean expired tokens first
    await userQueries.cleanExpiredRefreshTokens();

    // Get all active refresh tokens and compare with provided token
    const activeTokens = await userQueries.getActiveRefreshTokens();

    for (const tokenRecord of activeTokens) {
      const isValidToken = await bcrypt.compare(token, tokenRecord.token_hash);
      if (isValidToken) {
        return tokenRecord.user as AuthUser;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  try {
    // Find the token by comparing with all active tokens
    const activeTokens = await userQueries.getActiveRefreshTokens();

    for (const tokenRecord of activeTokens) {
      const isValidToken = await bcrypt.compare(token, tokenRecord.token_hash);
      if (isValidToken) {
        await userQueries.revokeRefreshToken(tokenRecord.token_hash);
        break;
      }
    }
  } catch (error) {
    // Silently fail - token might not exist
  }
}

/**
 * Parse time string to milliseconds
 */
function parseTimeToMs(timeStr: string): number {
  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(0, -1));

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 1000; // Default to minutes
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Sanitize user data for API response
 */
export function sanitizeUser(user: AuthUser) {
  const { password_hash, ...sanitizedUser } = user;
  return {
    ...sanitizedUser,
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
    },
  };
}
