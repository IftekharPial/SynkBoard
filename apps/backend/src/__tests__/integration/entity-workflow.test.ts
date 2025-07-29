/**
 * Entity Workflow Integration Tests
 * Tests complete entity management workflows from creation to deletion
 */

import request from 'supertest';
import { app } from '../../index';

describe('Entity Management Workflow Integration', () => {
  let testTenant: any;
  let testUser: any;
  let authToken: string;

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
  });

  describe('Complete Entity Lifecycle', () => {
    it('should handle complete entity creation, update, and deletion workflow', async () => {
      // Step 1: Create entity
      const createResponse = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Customer',
          slug: 'customer',
          description: 'Customer management entity',
          fields: [
            {
              key: 'name',
              name: 'Customer Name',
              type: 'text',
              is_required: true,
            },
            {
              key: 'email',
              name: 'Email Address',
              type: 'text',
              is_required: true,
            },
            {
              key: 'status',
              name: 'Status',
              type: 'select',
              is_required: false,
              options: ['active', 'inactive', 'pending'],
            },
          ],
        })
        .expect(201);

      const entityId = createResponse.body.data.entity.id;
      expect(createResponse.body.data.entity).toMatchObject({
        name: 'Customer',
        slug: 'customer',
        tenant_id: testTenant.id,
        is_active: true,
      });
      expect(createResponse.body.data.entity.fields).toHaveLength(3);

      // Step 2: Verify entity appears in list
      const listResponse = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.data.entities).toHaveLength(1);
      expect(listResponse.body.data.entities[0].id).toBe(entityId);

      // Step 3: Get entity by slug
      const getResponse = await request(app)
        .get('/api/v1/entities/customer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.entity.id).toBe(entityId);
      expect(getResponse.body.data.entity.fields).toHaveLength(3);

      // Step 4: Create records for the entity
      const record1Response = await request(app)
        .post('/api/v1/entities/customer/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: {
            name: 'John Doe',
            email: 'john@example.com',
            status: 'active',
          },
        })
        .expect(201);

      const record2Response = await request(app)
        .post('/api/v1/entities/customer/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            status: 'pending',
          },
        })
        .expect(201);

      // Step 5: Verify records exist
      const recordsResponse = await request(app)
        .get('/api/v1/entities/customer/records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(recordsResponse.body.data.records).toHaveLength(2);

      // Step 6: Update entity (add new field)
      const updateResponse = await request(app)
        .put('/api/v1/entities/customer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Customer Management',
          description: 'Updated customer management entity',
          fields: [
            {
              key: 'name',
              name: 'Customer Name',
              type: 'text',
              is_required: true,
            },
            {
              key: 'email',
              name: 'Email Address',
              type: 'text',
              is_required: true,
            },
            {
              key: 'status',
              name: 'Status',
              type: 'select',
              is_required: false,
              options: ['active', 'inactive', 'pending'],
            },
            {
              key: 'phone',
              name: 'Phone Number',
              type: 'text',
              is_required: false,
            },
          ],
        })
        .expect(200);

      expect(updateResponse.body.data.entity.name).toBe('Customer Management');
      expect(updateResponse.body.data.entity.fields).toHaveLength(4);

      // Step 7: Verify updated entity
      const updatedGetResponse = await request(app)
        .get('/api/v1/entities/customer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedGetResponse.body.data.entity.name).toBe('Customer Management');
      expect(updatedGetResponse.body.data.entity.fields).toHaveLength(4);

      // Step 8: Try to delete entity with records (should fail)
      const deleteWithRecordsResponse = await request(app)
        .delete('/api/v1/entities/customer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(deleteWithRecordsResponse.body.error.code).toBe('ENTITY_HAS_RECORDS');

      // Step 9: Delete all records first
      await request(app)
        .delete(`/api/v1/entities/customer/records/${record1Response.body.data.record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .delete(`/api/v1/entities/customer/records/${record2Response.body.data.record.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 10: Now delete entity (should succeed)
      const deleteResponse = await request(app)
        .delete('/api/v1/entities/customer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.data.message).toBe('Entity deleted successfully');

      // Step 11: Verify entity is deleted
      await request(app)
        .get('/api/v1/entities/customer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Step 12: Verify entity doesn't appear in list
      const finalListResponse = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalListResponse.body.data.entities).toHaveLength(0);
    });

    it('should handle entity field validation throughout lifecycle', async () => {
      // Create entity with validation rules
      const createResponse = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Product',
          slug: 'product',
          fields: [
            {
              key: 'name',
              name: 'Product Name',
              type: 'text',
              is_required: true,
            },
            {
              key: 'price',
              name: 'Price',
              type: 'number',
              is_required: true,
            },
            {
              key: 'category',
              name: 'Category',
              type: 'select',
              is_required: true,
              options: ['electronics', 'clothing', 'books'],
            },
          ],
        })
        .expect(201);

      // Test valid record creation
      await request(app)
        .post('/api/v1/entities/product/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: {
            name: 'iPhone 15',
            price: 999.99,
            category: 'electronics',
          },
        })
        .expect(201);

      // Test missing required field
      await request(app)
        .post('/api/v1/entities/product/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: {
            name: 'MacBook Pro',
            // missing required price
            category: 'electronics',
          },
        })
        .expect(422);

      // Test invalid field type
      await request(app)
        .post('/api/v1/entities/product/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: {
            name: 'iPad',
            price: 'not-a-number',
            category: 'electronics',
          },
        })
        .expect(422);

      // Test invalid select option
      await request(app)
        .post('/api/v1/entities/product/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: {
            name: 'Apple Watch',
            price: 399.99,
            category: 'invalid-category',
          },
        })
        .expect(422);

      // Update entity to change field requirements
      await request(app)
        .put('/api/v1/entities/product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Product',
          fields: [
            {
              key: 'name',
              name: 'Product Name',
              type: 'text',
              is_required: true,
            },
            {
              key: 'price',
              name: 'Price',
              type: 'number',
              is_required: false, // Changed to optional
            },
            {
              key: 'category',
              name: 'Category',
              type: 'select',
              is_required: true,
              options: ['electronics', 'clothing', 'books', 'home'], // Added new option
            },
          ],
        })
        .expect(200);

      // Test record creation with updated schema
      await request(app)
        .post('/api/v1/entities/product/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: {
            name: 'Smart Home Device',
            // price is now optional
            category: 'home', // New category option
          },
        })
        .expect(201);
    });
  });

  describe('Multi-tenant Entity Isolation', () => {
    it('should properly isolate entities between tenants', async () => {
      // Create second tenant and user
      const tenant2 = await global.testFactories.createTestTenant({
        name: 'Tenant 2',
        slug: 'tenant-2',
      });
      const user2 = await global.testFactories.createTestUser(tenant2.id, {
        role: 'ADMIN',
        email: 'admin2@example.com',
      });

      // Login as second user
      const login2Response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin2@example.com',
          password: 'password123',
        });
      const authToken2 = login2Response.body.data.token;

      // Create entity in first tenant
      await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Tenant 1 Entity',
          slug: 'tenant-1-entity',
          fields: [
            {
              key: 'name',
              name: 'Name',
              type: 'text',
              is_required: true,
            },
          ],
        })
        .expect(201);

      // Create entity with same slug in second tenant
      await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          name: 'Tenant 2 Entity',
          slug: 'tenant-1-entity', // Same slug, different tenant
          fields: [
            {
              key: 'title',
              name: 'Title',
              type: 'text',
              is_required: true,
            },
          ],
        })
        .expect(201);

      // Verify tenant 1 can only see their entity
      const tenant1Entities = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(tenant1Entities.body.data.entities).toHaveLength(1);
      expect(tenant1Entities.body.data.entities[0].name).toBe('Tenant 1 Entity');
      expect(tenant1Entities.body.data.entities[0].tenant_id).toBe(testTenant.id);

      // Verify tenant 2 can only see their entity
      const tenant2Entities = await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(tenant2Entities.body.data.entities).toHaveLength(1);
      expect(tenant2Entities.body.data.entities[0].name).toBe('Tenant 2 Entity');
      expect(tenant2Entities.body.data.entities[0].tenant_id).toBe(tenant2.id);

      // Verify tenant 1 cannot access tenant 2's entity
      await request(app)
        .get('/api/v1/entities/tenant-1-entity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should get their own entity

      // Create records in both entities
      await request(app)
        .post('/api/v1/entities/tenant-1-entity/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fields: { name: 'Tenant 1 Record' },
        })
        .expect(201);

      await request(app)
        .post('/api/v1/entities/tenant-1-entity/records')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          fields: { title: 'Tenant 2 Record' },
        })
        .expect(201);

      // Verify record isolation
      const tenant1Records = await request(app)
        .get('/api/v1/entities/tenant-1-entity/records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const tenant2Records = await request(app)
        .get('/api/v1/entities/tenant-1-entity/records')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(tenant1Records.body.data.records).toHaveLength(1);
      expect(tenant1Records.body.data.records[0].fields.name).toBe('Tenant 1 Record');

      expect(tenant2Records.body.data.records).toHaveLength(1);
      expect(tenant2Records.body.data.records[0].fields.title).toBe('Tenant 2 Record');
    });
  });

  describe('Permission-based Entity Access', () => {
    it('should enforce permissions throughout entity workflow', async () => {
      // Create user with limited permissions
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
      const limitedToken = limitedLogin.body.data.token;

      // Create entity as admin
      const createResponse = await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Entity',
          slug: 'test-entity',
          fields: [
            {
              key: 'name',
              name: 'Name',
              type: 'text',
              is_required: true,
            },
          ],
        })
        .expect(201);

      // Limited user should be able to view entities
      await request(app)
        .get('/api/v1/entities')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(200);

      // Limited user should be able to view specific entity
      await request(app)
        .get('/api/v1/entities/test-entity')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(200);

      // Limited user should NOT be able to create entities
      await request(app)
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send({
          name: 'Unauthorized Entity',
          slug: 'unauthorized-entity',
          fields: [],
        })
        .expect(403);

      // Limited user should NOT be able to update entities
      await request(app)
        .put('/api/v1/entities/test-entity')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send({
          name: 'Updated Name',
          fields: [],
        })
        .expect(403);

      // Limited user should NOT be able to delete entities
      await request(app)
        .delete('/api/v1/entities/test-entity')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      // Limited user should be able to create records (if they have record:create permission)
      await request(app)
        .post('/api/v1/entities/test-entity/records')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send({
          fields: { name: 'Test Record' },
        })
        .expect(201);
    });
  });
});
