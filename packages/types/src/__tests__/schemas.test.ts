/**
 * Zod Schemas Test Suite
 * Tests for TypeScript type definitions and Zod validation schemas
 */

import {
  CreateEntitySchema,
  UpdateEntitySchema,
  CreateRecordSchema,
  CreateDashboardSchema,
  CreateWidgetSchema,
  WebhookIngestRequestSchema,
  CreateRuleSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
} from '../schemas';

describe('Zod Schemas Validation', () => {
  describe('CreateEntitySchema', () => {
    it('should validate valid entity creation data', () => {
      const validData = {
        name: 'Customer Entity',
        slug: 'customer-entity',
        description: 'Entity for managing customers',
        fields: [
          {
            key: 'name',
            name: 'Customer Name',
            type: 'text',
            is_required: true,
            options: null,
          },
          {
            key: 'status',
            name: 'Status',
            type: 'select',
            is_required: false,
            options: ['active', 'inactive'],
          },
        ],
      };

      const result = CreateEntitySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid entity creation data', () => {
      const invalidData = {
        name: '', // Empty name
        slug: 'Invalid Slug!', // Invalid slug format
        fields: [
          {
            key: 'invalid-field',
            name: 'Invalid Field',
            type: 'invalid-type', // Invalid field type
            is_required: 'not-boolean', // Invalid boolean
          },
        ],
      };

      const result = CreateEntitySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(4); // Multiple validation errors
      }
    });

    it('should auto-generate slug when not provided', () => {
      const dataWithoutSlug = {
        name: 'Test Entity',
        fields: [],
      };

      const result = CreateEntitySchema.safeParse(dataWithoutSlug);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('test-entity');
      }
    });

    it('should validate field types correctly', () => {
      const validFieldTypes = ['text', 'number', 'boolean', 'date', 'select', 'multiselect', 'rating', 'user', 'json'];
      
      validFieldTypes.forEach(type => {
        const data = {
          name: 'Test Entity',
          fields: [
            {
              key: 'test_field',
              name: 'Test Field',
              type,
              is_required: false,
              options: type === 'select' || type === 'multiselect' ? ['option1', 'option2'] : null,
            },
          ],
        };

        const result = CreateEntitySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should require options for select fields', () => {
      const selectFieldWithoutOptions = {
        name: 'Test Entity',
        fields: [
          {
            key: 'status',
            name: 'Status',
            type: 'select',
            is_required: false,
            options: null, // Should be required for select fields
          },
        ],
      };

      const result = CreateEntitySchema.safeParse(selectFieldWithoutOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateEntitySchema', () => {
    it('should validate entity update data', () => {
      const validUpdateData = {
        name: 'Updated Entity Name',
        description: 'Updated description',
        fields: [
          {
            key: 'updated_field',
            name: 'Updated Field',
            type: 'text',
            is_required: true,
            options: null,
          },
        ],
      };

      const result = UpdateEntitySchema.safeParse(validUpdateData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialUpdateData = {
        name: 'New Name Only',
      };

      const result = UpdateEntitySchema.safeParse(partialUpdateData);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateRecordSchema', () => {
    it('should validate record creation data', () => {
      const validRecordData = {
        fields: {
          name: 'John Doe',
          age: 30,
          active: true,
          tags: ['customer', 'vip'],
        },
      };

      const result = CreateRecordSchema.safeParse(validRecordData);
      expect(result.success).toBe(true);
    });

    it('should reject empty fields object', () => {
      const invalidRecordData = {
        fields: {},
      };

      const result = CreateRecordSchema.safeParse(invalidRecordData);
      expect(result.success).toBe(false);
    });

    it('should handle various field value types', () => {
      const recordWithVariousTypes = {
        fields: {
          text_field: 'string value',
          number_field: 42,
          boolean_field: true,
          date_field: '2024-01-15T10:30:00Z',
          array_field: ['item1', 'item2'],
          object_field: { key: 'value' },
          null_field: null,
        },
      };

      const result = CreateRecordSchema.safeParse(recordWithVariousTypes);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateDashboardSchema', () => {
    it('should validate dashboard creation data', () => {
      const validDashboardData = {
        name: 'Sales Dashboard',
        slug: 'sales-dashboard',
        description: 'Dashboard for sales metrics',
        is_public: false,
      };

      const result = CreateDashboardSchema.safeParse(validDashboardData);
      expect(result.success).toBe(true);
    });

    it('should auto-generate slug from name', () => {
      const dataWithoutSlug = {
        name: 'My Dashboard',
        is_public: true,
      };

      const result = CreateDashboardSchema.safeParse(dataWithoutSlug);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('my-dashboard');
      }
    });

    it('should default is_public to false', () => {
      const dataWithoutPublic = {
        name: 'Private Dashboard',
      };

      const result = CreateDashboardSchema.safeParse(dataWithoutPublic);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_public).toBe(false);
      }
    });
  });

  describe('CreateWidgetSchema', () => {
    it('should validate widget creation data', () => {
      const validWidgetData = {
        dashboard_id: 'dashboard-123',
        entity_id: 'entity-456',
        type: 'kpi',
        config: {
          title: 'Total Sales',
          metric: 'sum',
          field: 'amount',
        },
        position: {
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
        is_public: false,
      };

      const result = CreateWidgetSchema.safeParse(validWidgetData);
      expect(result.success).toBe(true);
    });

    it('should validate widget types', () => {
      const validWidgetTypes = ['kpi', 'bar', 'line', 'pie', 'table', 'list'];
      
      validWidgetTypes.forEach(type => {
        const data = {
          dashboard_id: 'dashboard-123',
          entity_id: 'entity-456',
          type,
          config: { title: 'Test Widget' },
          position: { x: 0, y: 0, w: 2, h: 2 },
        };

        const result = CreateWidgetSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid widget types', () => {
      const invalidWidgetData = {
        dashboard_id: 'dashboard-123',
        entity_id: 'entity-456',
        type: 'invalid-type',
        config: {},
        position: { x: 0, y: 0, w: 2, h: 2 },
      };

      const result = CreateWidgetSchema.safeParse(invalidWidgetData);
      expect(result.success).toBe(false);
    });

    it('should validate position constraints', () => {
      const invalidPositionData = {
        dashboard_id: 'dashboard-123',
        entity_id: 'entity-456',
        type: 'kpi',
        config: {},
        position: {
          x: -1, // Invalid negative position
          y: 0,
          w: 0, // Invalid zero width
          h: 2,
        },
      };

      const result = CreateWidgetSchema.safeParse(invalidPositionData);
      expect(result.success).toBe(false);
    });
  });

  describe('WebhookIngestRequestSchema', () => {
    it('should validate webhook ingestion data', () => {
      const validWebhookData = {
        entity: 'customer',
        fields: {
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
        },
      };

      const result = WebhookIngestRequestSchema.safeParse(validWebhookData);
      expect(result.success).toBe(true);
    });

    it('should reject webhook data without entity', () => {
      const invalidWebhookData = {
        fields: {
          name: 'John Doe',
        },
      };

      const result = WebhookIngestRequestSchema.safeParse(invalidWebhookData);
      expect(result.success).toBe(false);
    });

    it('should reject webhook data without fields', () => {
      const invalidWebhookData = {
        entity: 'customer',
      };

      const result = WebhookIngestRequestSchema.safeParse(invalidWebhookData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateRuleSchema', () => {
    it('should validate rule creation data', () => {
      const validRuleData = {
        name: 'High Value Alert',
        entity_id: 'entity-123',
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

      const result = CreateRuleSchema.safeParse(validRuleData);
      expect(result.success).toBe(true);
    });

    it('should validate condition operators', () => {
      const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'starts_with', 'ends_with', 'in', 'not_in', 'is_null', 'is_not_null'];
      
      validOperators.forEach(operator => {
        const data = {
          name: 'Test Rule',
          entity_id: 'entity-123',
          conditions: [
            {
              field: 'test_field',
              operator,
              value: 'test_value',
            },
          ],
          actions: [
            {
              type: 'notify',
              config: { message: 'Test' },
            },
          ],
          run_on: 'create',
          is_active: true,
        };

        const result = CreateRuleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate action types', () => {
      const validActionTypes = ['webhook', 'notify', 'tag', 'rate', 'slack'];
      
      validActionTypes.forEach(type => {
        const data = {
          name: 'Test Rule',
          entity_id: 'entity-123',
          conditions: [
            {
              field: 'test_field',
              operator: 'eq',
              value: 'test',
            },
          ],
          actions: [
            {
              type,
              config: { message: 'Test' },
            },
          ],
          run_on: 'create',
          is_active: true,
        };

        const result = CreateRuleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate run_on values', () => {
      const validRunOnValues = ['create', 'update', 'both'];
      
      validRunOnValues.forEach(runOn => {
        const data = {
          name: 'Test Rule',
          entity_id: 'entity-123',
          conditions: [
            {
              field: 'test_field',
              operator: 'eq',
              value: 'test',
            },
          ],
          actions: [
            {
              type: 'notify',
              config: { message: 'Test' },
            },
          ],
          run_on: runOn,
          is_active: true,
        };

        const result = CreateRuleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should require at least one condition and action', () => {
      const ruleWithoutConditions = {
        name: 'Test Rule',
        entity_id: 'entity-123',
        conditions: [],
        actions: [
          {
            type: 'notify',
            config: { message: 'Test' },
          },
        ],
        run_on: 'create',
        is_active: true,
      };

      const result1 = CreateRuleSchema.safeParse(ruleWithoutConditions);
      expect(result1.success).toBe(false);

      const ruleWithoutActions = {
        name: 'Test Rule',
        entity_id: 'entity-123',
        conditions: [
          {
            field: 'test_field',
            operator: 'eq',
            value: 'test',
          },
        ],
        actions: [],
        run_on: 'create',
        is_active: true,
      };

      const result2 = CreateRuleSchema.safeParse(ruleWithoutActions);
      expect(result2.success).toBe(false);
    });
  });

  describe('LoginRequestSchema', () => {
    it('should validate login request data', () => {
      const validLoginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = LoginRequestSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidLoginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = LoginRequestSchema.safeParse(invalidLoginData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidLoginData = {
        email: 'user@example.com',
        password: '',
      };

      const result = LoginRequestSchema.safeParse(invalidLoginData);
      expect(result.success).toBe(false);
    });
  });

  describe('RefreshTokenRequestSchema', () => {
    it('should validate refresh token request', () => {
      const validRefreshData = {
        refresh_token: 'valid-refresh-token-string',
      };

      const result = RefreshTokenRequestSchema.safeParse(validRefreshData);
      expect(result.success).toBe(true);
    });

    it('should reject empty refresh token', () => {
      const invalidRefreshData = {
        refresh_token: '',
      };

      const result = RefreshTokenRequestSchema.safeParse(invalidRefreshData);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema Integration Tests', () => {
    it('should handle complex nested validation', () => {
      const complexEntityData = {
        name: 'Complex Entity',
        description: 'Entity with complex field definitions',
        fields: [
          {
            key: 'customer_info',
            name: 'Customer Information',
            type: 'json',
            is_required: true,
            options: null,
          },
          {
            key: 'priority_level',
            name: 'Priority Level',
            type: 'select',
            is_required: true,
            options: ['low', 'medium', 'high', 'critical'],
          },
          {
            key: 'tags',
            name: 'Tags',
            type: 'multiselect',
            is_required: false,
            options: ['urgent', 'follow-up', 'vip', 'new-customer'],
          },
          {
            key: 'satisfaction_rating',
            name: 'Satisfaction Rating',
            type: 'rating',
            is_required: false,
            options: null,
          },
        ],
      };

      const result = CreateEntitySchema.safeParse(complexEntityData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fields).toHaveLength(4);
        expect(result.data.fields[1].options).toEqual(['low', 'medium', 'high', 'critical']);
      }
    });

    it('should validate complete dashboard with widgets workflow', () => {
      // First validate dashboard creation
      const dashboardData = {
        name: 'Analytics Dashboard',
        description: 'Comprehensive analytics dashboard',
        is_public: false,
      };

      const dashboardResult = CreateDashboardSchema.safeParse(dashboardData);
      expect(dashboardResult.success).toBe(true);

      // Then validate widget creation for the dashboard
      const widgetData = {
        dashboard_id: 'dashboard-123',
        entity_id: 'entity-456',
        type: 'kpi',
        config: {
          title: 'Total Revenue',
          metric: 'sum',
          field: 'amount',
          refresh_rate: 30,
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
        is_public: false,
      };

      const widgetResult = CreateWidgetSchema.safeParse(widgetData);
      expect(widgetResult.success).toBe(true);
    });

    it('should validate complete rule creation workflow', () => {
      const ruleData = {
        name: 'Customer Satisfaction Alert',
        entity_id: 'customer-entity-id',
        conditions: [
          {
            field: 'satisfaction_rating',
            operator: 'lte',
            value: 2,
          },
          {
            field: 'is_vip',
            operator: 'eq',
            value: true,
          },
        ],
        actions: [
          {
            type: 'notify',
            config: {
              title: 'Low Satisfaction Alert',
              message: 'VIP customer has low satisfaction rating',
              priority: 'high',
            },
          },
          {
            type: 'webhook',
            config: {
              url: 'https://api.example.com/alerts',
              method: 'POST',
              headers: {
                'Authorization': 'Bearer token',
                'Content-Type': 'application/json',
              },
            },
          },
        ],
        run_on: 'both',
        is_active: true,
      };

      const result = CreateRuleSchema.safeParse(ruleData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conditions).toHaveLength(2);
        expect(result.data.actions).toHaveLength(2);
      }
    });
  });
});
