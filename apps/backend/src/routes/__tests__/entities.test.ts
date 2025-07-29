/**
 * Entities Routes Test Suite
 * Tests for entity CRUD operations and field management
 */

import request from 'supertest';
import { app } from '../../index';

describe('Entities Routes', () => {
  let testTenant: any;
  let testUser: any;
  let authToken: string;
  let testEntity: any;

  beforeEach(async () => {
    // Create test tenant and user
    testTenant = await global.testFactories.createTestTenant();
    testUser = await global.testFactories.createTestUser(testTenant.id, {
      role: 'ADMIN',
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
      });
    authToken = loginResponse.body.data.token;

    // Create test entity
    testEntity = await global.testFactories.createTestEntity(testTenant.id, {
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
      ],
    });
  });

  describe('GET /api/v1/entities', () => {
    it('should return list of entities for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entities).toHaveLength(1);
      expect(response.body.data.entities[0]).toMatchObject({
        id: testEntity.id,
        name: testEntity.name,
        slug: testEntity.slug,
        tenant_id: testTenant.id,
      });
      expect(response.body.data.entities[0].fields).toHaveLength(2);
    });

    it('should filter entities by search query', async () => {
      // Create another entity
      await global.testFactories.createTestEntity(testTenant.id, {
        name: 'Different Entity',
        slug: 'different-entity',
      });

      const response = await request(app)
        .get('/api/v1/entities?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entities).toHaveLength(1);
      expect(response.body.data.entities[0].name).toContain('Test');
    });

    it('should return only active entities by default', async () => {
      // Create inactive entity
      await global.testFactories.createTestEntity(testTenant.id, {
        name: 'Inactive Entity',
        slug: 'inactive-entity',
        is_active: false,
      });

      const response = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entities).toHaveLength(1);
      expect(response.body.data.entities[0].is_active).toBe(true);
    });

    it('should include inactive entities when requested', async () => {
      // Create inactive entity
      await global.testFactories.createTestEntity(testTenant.id, {
        name: 'Inactive Entity',
        slug: 'inactive-entity',
        is_active: false,
      });

      const response = await request(app)
        .get('/api/v1/entities?include_inactive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entities).toHaveLength(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/entities')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should isolate entities by tenant', async () => {
      // Create another tenant with entity
      const otherTenant = await global.testFactories.createTestTenant({
        name: 'Other Tenant',
        slug: 'other-tenant',
      });
      await global.testFactories.createTestEntity(otherTenant.id, {
        name: 'Other Entity',
        slug: 'other-entity',
      });

      const response = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entities).toHaveLength(1);
      expect(response.body.data.entities[0].tenant_id).toBe(testTenant.id);
    });
  });

  describe('GET /api/v1/entities/:slug', () => {
    it('should return entity by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entity).toMatchObject({
        id: testEntity.id,
        name: testEntity.name,
        slug: testEntity.slug,
        tenant_id: testTenant.id,
      });
      expect(response.body.data.entity.fields).toHaveLength(2);
    });

    it('should return 404 for non-existent entity', async () => {
      const response = await request(app)
        .get('/api/v1/entities/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should not return entities from other tenants', async () => {
      // Create entity in another tenant
      const otherTenant = await global.testFactories.createTestTenant({
        name: 'Other Tenant',
        slug: 'other-tenant',
      });
      const otherEntity = await global.testFactories.createTestEntity(otherTenant.id, {
        name: 'Other Entity',
        slug: 'accessible-slug',
      });

      const response = await request(app)
        .get(`/api/v1/entities/${otherEntity.slug}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENTITY_NOT_FOUND');
    });
  });

  describe('POST /api/v1/entities', () => {
    const validEntityData = {
      name: 'New Entity',
      slug: 'new-entity',
      fields: [
        {
          key: 'title',
          name: 'Title',
          type: 'text',
          is_required: true,
        },
        {
          key: 'priority',
          name: 'Priority',
          type: 'select',
          is_required: false,
          options: ['low', 'medium', 'high'],
        },
      ],
    };

    it('should create entity with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validEntityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entity).toMatchObject({
        name: validEntityData.name,
        slug: validEntityData.slug,
        tenant_id: testTenant.id,
        is_active: true,
      });
      expect(response.body.data.entity.fields).toHaveLength(2);
      expect(response.body.data.entity.fields[0]).toMatchObject({
        key: 'title',
        name: 'Title',
        type: 'text',
        is_required: true,
      });
    });

    it('should auto-generate slug if not provided', async () => {
      const entityData = { ...validEntityData };
      delete entityData.slug;

      const response = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entity.slug).toBe('new-entity');
    });

    it('should reject duplicate slug within tenant', async () => {
      const entityData = {
        ...validEntityData,
        slug: testEntity.slug,
      };

      const response = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENTITY_SLUG_EXISTS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate field definitions', async () => {
      const invalidEntityData = {
        ...validEntityData,
        fields: [
          {
            key: 'invalid-field',
            name: 'Invalid Field',
            type: 'invalid-type',
            is_required: true,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEntityData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require entity:create permission', async () => {
      // Create user without create permission
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
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .send(validEntityData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('PUT /api/v1/entities/:slug', () => {
    const updateData = {
      name: 'Updated Entity',
      fields: [
        {
          key: 'name',
          name: 'Updated Name',
          type: 'text',
          is_required: true,
        },
        {
          key: 'description',
          name: 'Description',
          type: 'text',
          is_required: false,
        },
      ],
    };

    it('should update entity with valid data', async () => {
      const response = await request(app)
        .put(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.entity).toMatchObject({
        id: testEntity.id,
        name: updateData.name,
        slug: testEntity.slug,
        tenant_id: testTenant.id,
      });
      expect(response.body.data.entity.fields).toHaveLength(2);
    });

    it('should return 404 for non-existent entity', async () => {
      const response = await request(app)
        .put('/api/v1/entities/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require entity:update permission', async () => {
      // Create user without update permission
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
        .put(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('DELETE /api/v1/entities/:slug', () => {
    it('should delete entity', async () => {
      const response = await request(app)
        .delete(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Entity deleted successfully');

      // Verify entity is deleted
      const getResponse = await request(app)
        .get(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent entity', async () => {
      const response = await request(app)
        .delete('/api/v1/entities/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should prevent deletion of entity with records', async () => {
      // Create record for entity
      await global.testFactories.createTestRecord(testEntity.id, testTenant.id);

      const response = await request(app)
        .delete(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENTITY_HAS_RECORDS');
    });

    it('should require entity:delete permission', async () => {
      // Create user without delete permission
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
        .delete(`/api/v1/entities/${testEntity.slug}`)
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});
