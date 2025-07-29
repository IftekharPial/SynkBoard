/**
 * Rules Routes Test Suite
 * Tests for rule engine CRUD operations and execution
 */

import request from 'supertest';
import { app } from '../../index';

describe('Rules Routes', () => {
  let testTenant: any;
  let testUser: any;
  let testEntity: any;
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

    // Create test entity
    testEntity = await global.testFactories.createTestEntity(testTenant.id, {
      fields: [
        {
          id: 'field-1',
          key: 'amount',
          name: 'Amount',
          type: 'number',
          is_required: true,
          options: null,
        },
        {
          id: 'field-2',
          key: 'status',
          name: 'Status',
          type: 'select',
          is_required: false,
          options: ['pending', 'completed', 'cancelled'],
        },
      ],
    });
  });

  describe('POST /api/v1/rules', () => {
    const validRuleData = {
      name: 'High Value Alert',
      entity_id: 'entity-id',
      conditions: [
        {
          field: 'amount',
          operator: 'gt',
          value: 1000,
        },
      ],
      actions: [
        {
          type: 'notify',
          config: {
            title: 'High Value Transaction',
            message: 'A high value transaction was detected',
          },
        },
      ],
      run_on: 'both',
      is_active: true,
    };

    it('should create rule with valid data', async () => {
      const ruleData = {
        ...validRuleData,
        entity_id: testEntity.id,
      };

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rule).toMatchObject({
        name: ruleData.name,
        entity_id: testEntity.id,
        tenant_id: testTenant.id,
        is_active: true,
      });
      expect(response.body.data.rule.conditions).toHaveLength(1);
      expect(response.body.data.rule.actions).toHaveLength(1);
    });

    it('should validate rule conditions', async () => {
      const invalidRuleData = {
        ...validRuleData,
        entity_id: testEntity.id,
        conditions: [
          {
            field: 'invalid_field',
            operator: 'invalid_operator',
            value: 'test',
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require rule:edit permission', async () => {
      // Create user without rule permissions
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
        .post('/api/v1/rules')
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .send({
          ...validRuleData,
          entity_id: testEntity.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('GET /api/v1/rules', () => {
    beforeEach(async () => {
      // Create test rules
      await global.testFactories.createTestRule(testEntity.id, testTenant.id, {
        name: 'Rule 1',
        is_active: true,
      });
      await global.testFactories.createTestRule(testEntity.id, testTenant.id, {
        name: 'Rule 2',
        is_active: false,
      });
    });

    it('should return list of rules', async () => {
      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rules).toHaveLength(2);
      expect(response.body.data.rules[0]).toHaveProperty('name');
      expect(response.body.data.rules[0]).toHaveProperty('entity');
      expect(response.body.data.rules[0]).toHaveProperty('conditions');
      expect(response.body.data.rules[0]).toHaveProperty('actions');
    });

    it('should filter rules by entity', async () => {
      // Create another entity and rule
      const otherEntity = await global.testFactories.createTestEntity(testTenant.id, {
        name: 'Other Entity',
        slug: 'other-entity',
      });
      await global.testFactories.createTestRule(otherEntity.id, testTenant.id, {
        name: 'Other Rule',
      });

      const response = await request(app)
        .get(`/api/v1/rules?entity_id=${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rules).toHaveLength(2);
      expect(response.body.data.rules.every(rule => rule.entity_id === testEntity.id)).toBe(true);
    });

    it('should filter rules by active status', async () => {
      const response = await request(app)
        .get('/api/v1/rules?is_active=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rules).toHaveLength(1);
      expect(response.body.data.rules[0].is_active).toBe(true);
    });
  });

  describe('POST /api/v1/rules/test', () => {
    const testRuleData = {
      conditions: [
        {
          field: 'amount',
          operator: 'gt',
          value: 500,
        },
      ],
      actions: [
        {
          type: 'notify',
          config: {
            title: 'Test Alert',
            message: 'Test message',
          },
        },
      ],
      test_data: {
        amount: 1000,
        status: 'pending',
      },
    };

    it('should test rule with matching conditions', async () => {
      const response = await request(app)
        .post('/api/v1/rules/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRuleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.matched).toBe(true);
      expect(response.body.data.conditions_met).toBe(1);
      expect(response.body.data.total_conditions).toBe(1);
      expect(response.body.data.actions_would_execute).toBe(1);
    });

    it('should test rule with non-matching conditions', async () => {
      const nonMatchingData = {
        ...testRuleData,
        test_data: {
          amount: 100, // Less than 500
          status: 'pending',
        },
      };

      const response = await request(app)
        .post('/api/v1/rules/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nonMatchingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.matched).toBe(false);
      expect(response.body.data.conditions_met).toBe(0);
      expect(response.body.data.total_conditions).toBe(1);
      expect(response.body.data.actions_would_execute).toBe(0);
    });

    it('should provide detailed evaluation results', async () => {
      const response = await request(app)
        .post('/api/v1/rules/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRuleData)
        .expect(200);

      expect(response.body.data.evaluation_details).toHaveLength(1);
      expect(response.body.data.evaluation_details[0]).toMatchObject({
        condition: testRuleData.conditions[0],
        matched: true,
      });
    });
  });

  describe('GET /api/v1/rules/logs', () => {
    beforeEach(async () => {
      // Create test rule
      const testRule = await global.testFactories.createTestRule(testEntity.id, testTenant.id);

      // Create test rule logs
      await global.testPrisma.ruleLog.createMany({
        data: [
          {
            rule_id: testRule.id,
            tenant_id: testTenant.id,
            record_id: 'record-1',
            status: 'matched',
            duration_ms: 150,
            output: {
              conditions_met: 1,
              total_conditions: 1,
              actions_executed: 1,
            },
          },
          {
            rule_id: testRule.id,
            tenant_id: testTenant.id,
            record_id: 'record-2',
            status: 'skipped',
            duration_ms: 50,
            output: {
              conditions_met: 0,
              total_conditions: 1,
              actions_executed: 0,
            },
          },
        ],
      });
    });

    it('should return rule execution logs', async () => {
      const response = await request(app)
        .get('/api/v1/rules/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.logs[0]).toMatchObject({
        tenant_id: testTenant.id,
        status: expect.any(String),
        duration_ms: expect.any(Number),
      });
    });

    it('should filter logs by status', async () => {
      const response = await request(app)
        .get('/api/v1/rules/logs?status=matched')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.logs[0].status).toBe('matched');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/rules/logs?page=1&limit=1')
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

    it('should require rule:edit permission', async () => {
      // Create user without rule permissions
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
        .get('/api/v1/rules/logs')
        .set('Authorization', `Bearer ${limitedLogin.body.data.token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('PUT /api/v1/rules/:id', () => {
    let testRule: any;

    beforeEach(async () => {
      testRule = await global.testFactories.createTestRule(testEntity.id, testTenant.id);
    });

    it('should update rule with valid data', async () => {
      const updateData = {
        name: 'Updated Rule Name',
        is_active: false,
        conditions: [
          {
            field: 'amount',
            operator: 'gte',
            value: 2000,
          },
        ],
        actions: [
          {
            type: 'webhook',
            config: {
              url: 'https://example.com/webhook',
              method: 'POST',
            },
          },
        ],
      };

      const response = await request(app)
        .put(`/api/v1/rules/${testRule.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rule.name).toBe('Updated Rule Name');
      expect(response.body.data.rule.is_active).toBe(false);
      expect(response.body.data.rule.conditions).toHaveLength(1);
      expect(response.body.data.rule.actions).toHaveLength(1);
    });

    it('should return 404 for non-existent rule', async () => {
      const response = await request(app)
        .put('/api/v1/rules/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RULE_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/rules/:id', () => {
    let testRule: any;

    beforeEach(async () => {
      testRule = await global.testFactories.createTestRule(testEntity.id, testTenant.id);
    });

    it('should delete rule', async () => {
      const response = await request(app)
        .delete(`/api/v1/rules/${testRule.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Rule deleted successfully');

      // Verify rule is deleted
      const getResponse = await request(app)
        .get(`/api/v1/rules/${testRule.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent rule', async () => {
      const response = await request(app)
        .delete('/api/v1/rules/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RULE_NOT_FOUND');
    });
  });
});
