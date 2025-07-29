/**
 * Authentication Routes Test Suite
 * Tests for user authentication, authorization, and session management
 */

import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../../index';

describe('Authentication Routes', () => {
  let testTenant: any;
  let testUser: any;
  let testApiKey: any;

  beforeEach(async () => {
    // Create test tenant
    testTenant = await global.testFactories.createTestTenant();
    
    // Create test user
    testUser = await global.testFactories.createTestUser(testTenant.id, {
      email: 'test@example.com',
      role: 'ADMIN',
    });

    // Create test API key
    testApiKey = await global.testFactories.createTestApiKey(testTenant.id);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
      expect(response.body.data.user.tenant).toMatchObject({
        id: testTenant.id,
        name: testTenant.name,
        slug: testTenant.slug,
      });
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject inactive user', async () => {
      // Deactivate user
      await global.testPrisma.user.update({
        where: { id: testUser.id },
        data: { is_active: false },
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      authToken = loginResponse.body.data.token;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
      expect(response.body.data.tenant).toMatchObject({
        id: testTenant.id,
        name: testTenant.name,
        slug: testTenant.slug,
      });
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject request with expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, tenantId: testTenant.id },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      refreshToken = loginResponse.body.data.refresh_token;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.token).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      authToken = loginResponse.body.data.token;
      refreshToken = loginResponse.body.data.refresh_token;
    });

    it('should logout successfully with valid tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should reject logout without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refresh_token: refreshToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('API Key Authentication', () => {
    it('should authenticate with valid API key', async () => {
      const response = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', 'Bearer test-api-key')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid API key', async () => {
      const response = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', 'Bearer invalid-api-key')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });

    it('should reject inactive API key', async () => {
      // Deactivate API key
      await global.testPrisma.apiKey.update({
        where: { id: testApiKey.id },
        data: { is_active: false },
      });

      const response = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', 'Bearer test-api-key')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('API_KEY_INACTIVE');
    });
  });

  describe('Permission Middleware', () => {
    let userToken: string;
    let adminToken: string;

    beforeEach(async () => {
      // Create regular user
      const regularUser = await global.testFactories.createTestUser(testTenant.id, {
        email: 'user@example.com',
        role: 'USER',
      });

      // Login as regular user
      const userLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });
      userToken = userLogin.body.data.token;

      // Login as admin
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      adminToken = adminLogin.body.data.token;
    });

    it('should allow admin to access admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should allow both users to access general endpoints', async () => {
      const userResponse = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const adminResponse = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(userResponse.body.success).toBe(true);
      expect(adminResponse.body.success).toBe(true);
    });
  });
});
