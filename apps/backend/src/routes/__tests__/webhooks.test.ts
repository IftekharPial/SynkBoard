/**
 * Webhooks Routes Test Suite
 * Tests for webhook ingestion, logging, and management
 */

import request from 'supertest';
import { app } from '../../index';

describe('Webhooks Routes', () => {
  let testTenant: any;
  let testUser: any;
  let testApiKey: any;
  let testEntity: any;
  let authToken: string;

  beforeEach(async () => {
    // Create test tenant and user
    testTenant = await global.testFactories.createTestTenant();
    testUser = await global.testFactories.createTestUser(testTenant.id, {
      role: 'ADMIN',
    });
    testApiKey = await global.testFactories.createTestApiKey(testTenant.id);

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
      });
    authToken = loginResponse.body.data.token;

    // Create test entity with fields
    testEntity = await global.testFactories.createTestEntity(testTenant.id, {
      name: 'Test Entity',
      slug: 'test-entity',
      fields: [
        {
          id: 'field-1',
          key: 'name',
          name: 'Name',
          type: 'text',
          is_required: true,
          options: null,
        },
        {
          id: 'field-2',
          key: 'count',
          name: 'Count',
          type: 'number',
          is_required: false,
          options: null,
        },
        {
          id: 'field-3',
          key: 'status',
          name: 'Status',
          type: 'select',
          is_required: false,
          options: ['active', 'inactive'],
        },
      ],
    });
  });

  describe('POST /api/v1/ingest', () => {
    const validWebhookPayload = {
      entity: 'test-entity',
      fields: {
        name: 'Test Record',
        count: 42,
        status: 'active',
      },
    };

    it('should ingest webhook data with valid API key', async () => {
      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer test-api-key')
        .send(validWebhookPayload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.record).toMatchObject({
        entity_id: testEntity.id,
        tenant_id: testTenant.id,
        fields: validWebhookPayload.fields,
      });

      // Verify webhook log was created
      const webhookLog = await global.testPrisma.webhookLog.findFirst({
        where: { tenant_id: testTenant.id },
      });
      expect(webhookLog).toBeTruthy();
      expect(webhookLog.status).toBe('success');
      expect(webhookLog.entity).toBe('test-entity');
    });

    it('should reject webhook without API key', async () => {
      const response = await request(app)
        .post('/api/v1/ingest')
        .send(validWebhookPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject webhook with invalid API key', async () => {
      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer invalid-api-key')
        .send(validWebhookPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });

    it('should reject webhook for non-existent entity', async () => {
      const invalidPayload = {
        entity: 'non-existent-entity',
        fields: { name: 'Test' },
      };

      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer test-api-key')
        .send(invalidPayload)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENTITY_NOT_FOUND');

      // Verify webhook log was created with failure
      const webhookLog = await global.testPrisma.webhookLog.findFirst({
        where: { tenant_id: testTenant.id },
      });
      expect(webhookLog).toBeTruthy();
      expect(webhookLog.status).toBe('failed');
      expect(webhookLog.error_code).toBe('ENTITY_NOT_FOUND');
    });

    it('should validate required fields', async () => {
      const invalidPayload = {
        entity: 'test-entity',
        fields: {
          count: 42, // missing required 'name' field
        },
      };

      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer test-api-key')
        .send(invalidPayload)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FIELD_VALIDATION_FAILED');
      expect(response.body.error.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should validate field types', async () => {
      const invalidPayload = {
        entity: 'test-entity',
        fields: {
          name: 'Test Record',
          count: 'not-a-number', // invalid type
        },
      };

      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer test-api-key')
        .send(invalidPayload)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FIELD_VALIDATION_FAILED');
    });

    it('should validate select field options', async () => {
      const invalidPayload = {
        entity: 'test-entity',
        fields: {
          name: 'Test Record',
          status: 'invalid-status', // not in options
        },
      };

      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer test-api-key')
        .send(invalidPayload)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FIELD_VALIDATION_FAILED');
    });

    it('should handle webhook payload validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer test-api-key')
        .send({}) // empty payload
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should isolate webhook data by tenant', async () => {
      // Create another tenant with same entity slug
      const otherTenant = await global.testFactories.createTestTenant({
        name: 'Other Tenant',
        slug: 'other-tenant',
      });
      const otherApiKey = await global.testFactories.createTestApiKey(otherTenant.id, {
        key_hash: await require('bcryptjs').hash('other-api-key', 10),
      });
      await global.testFactories.createTestEntity(otherTenant.id, {
        name: 'Other Entity',
        slug: 'test-entity', // same slug, different tenant
        fields: [
          {
            id: 'field-1',
            key: 'name',
            name: 'Name',
            type: 'text',
            is_required: true,
            options: null,
          },
        ],
      });

      // Webhook should create record in correct tenant
      const response = await request(app)
        .post('/api/v1/ingest')
        .set('Authorization', 'Bearer other-api-key')
        .send({
          entity: 'test-entity',
          fields: { name: 'Other Record' },
        })
        .expect(201);

      expect(response.body.data.record.tenant_id).toBe(otherTenant.id);

      // Verify records are isolated
      const originalTenantRecords = await global.testPrisma.record.findMany({
        where: { tenant_id: testTenant.id },
      });
      const otherTenantRecords = await global.testPrisma.record.findMany({
        where: { tenant_id: otherTenant.id },
      });

      expect(originalTenantRecords).toHaveLength(0);
      expect(otherTenantRecords).toHaveLength(1);
    });
  });

  describe('GET /api/v1/webhooks/logs', () => {
    beforeEach(async () => {
      // Create some webhook logs
      await global.testPrisma.webhookLog.createMany({
        data: [
          {
            tenant_id: testTenant.id,
            entity: 'test-entity',
            status: 'success',
            duration_ms: 150,
            source_ip: '192.168.1.1',
            api_key_id: testApiKey.id,
          },
          {
            tenant_id: testTenant.id,
            entity: 'test-entity',
            status: 'failed',
            duration_ms: 75,
            source_ip: '192.168.1.2',
            api_key_id: testApiKey.id,
            error_code: 'VALIDATION_ERROR',
          },
        ],
      });
    });

    it('should return webhook logs for admin user', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.logs[0]).toMatchObject({
        tenant_id: testTenant.id,
        entity: 'test-entity',
        status: expect.any(String),
        duration_ms: expect.any(Number),
      });
    });

    it('should filter logs by entity', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/logs?entity=test-entity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.logs.every(log => log.entity === 'test-entity')).toBe(true);
    });

    it('should filter logs by status', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/logs?status=success')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.logs[0].status).toBe('success');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/logs?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        pages: 2,
      });
    });

    it('should require audit:view permission', async () => {
      // Create user without audit permission
      const limitedUser = await global.testFactories.createTestUser(testTenant.id, {
        role: 'USER',
        email: 'limited@example.com',
      });

      const limitedLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'limited@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .get('/api/v1/webhooks/logs')
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should isolate logs by tenant', async () => {
      // Create logs for another tenant
      const otherTenant = await global.testFactories.createTestTenant({
        name: 'Other Tenant',
        slug: 'other-tenant',
      });
      const otherApiKey = await global.testFactories.createTestApiKey(otherTenant.id);
      
      await global.testPrisma.webhookLog.create({
        data: {
          tenant_id: otherTenant.id,
          entity: 'other-entity',
          status: 'success',
          duration_ms: 100,
          source_ip: '192.168.1.3',
          api_key_id: otherApiKey.id,
        },
      });

      const response = await request(app)
        .get('/api/v1/webhooks/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.logs.every(log => log.tenant_id === testTenant.id)).toBe(true);
    });
  });

  describe('GET /api/v1/webhooks/stats', () => {
    beforeEach(async () => {
      // Create webhook logs for stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await global.testPrisma.webhookLog.createMany({
        data: [
          {
            tenant_id: testTenant.id,
            entity: 'test-entity',
            status: 'success',
            duration_ms: 150,
            source_ip: '192.168.1.1',
            api_key_id: testApiKey.id,
            created_at: new Date(),
          },
          {
            tenant_id: testTenant.id,
            entity: 'test-entity',
            status: 'success',
            duration_ms: 200,
            source_ip: '192.168.1.2',
            api_key_id: testApiKey.id,
            created_at: new Date(),
          },
          {
            tenant_id: testTenant.id,
            entity: 'test-entity',
            status: 'failed',
            duration_ms: 75,
            source_ip: '192.168.1.3',
            api_key_id: testApiKey.id,
            created_at: today,
          },
        ],
      });
    });

    it('should return webhook statistics', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toMatchObject({
        total_requests: 3,
        success_rate: expect.any(Number),
        failed_today: 1,
        avg_duration_ms: expect.any(Number),
      });
      expect(response.body.data.stats.success_rate).toBeCloseTo(66.67, 1);
      expect(response.body.data.stats.avg_duration_ms).toBeCloseTo(141.67, 1);
    });

    it('should require audit:view permission', async () => {
      // Create user without audit permission
      const limitedUser = await global.testFactories.createTestUser(testTenant.id, {
        role: 'USER',
        email: 'limited@example.com',
      });

      const limitedLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'limited@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .get('/api/v1/webhooks/stats')
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/v1/webhooks/test', () => {
    const testPayload = {
      entity: 'test-entity',
      fields: {
        name: 'Test Record',
        count: 42,
      },
    };

    it('should test webhook payload successfully', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        test_result: 'success',
        validation_passed: true,
        duration_ms: expect.any(Number),
        message: expect.stringContaining('valid'),
      });
    });

    it('should return validation errors for invalid payload', async () => {
      const invalidPayload = {
        entity: 'test-entity',
        fields: {
          count: 'not-a-number',
        },
      };

      const response = await request(app)
        .post('/api/v1/webhooks/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayload)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FIELD_VALIDATION_FAILED');
    });

    it('should require audit:view permission', async () => {
      // Create user without audit permission
      const limitedUser = await global.testFactories.createTestUser(testTenant.id, {
        role: 'USER',
        email: 'limited@example.com',
      });

      const limitedLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'limited@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .post('/api/v1/webhooks/test')
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .send(testPayload)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});
