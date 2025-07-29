/**
 * Backend Test Setup for SynkBoard
 * Configures database, mocks, and test utilities for backend tests
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Test database setup
let prisma;

beforeAll(async () => {
  // Initialize test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db',
      },
    },
  });

  // Connect to database
  await prisma.$connect();

  // Clean database before tests
  await cleanDatabase();
});

afterAll(async () => {
  // Clean up after all tests
  await cleanDatabase();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});

// Database cleanup utility
async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';
  `;

  for (const { name } of tablenames) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
    } catch (error) {
      console.warn(`Failed to clean table ${name}:`, error.message);
    }
  }
}

// Test data factories
global.testFactories = {
  async createTestTenant(overrides = {}) {
    return await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: `test-tenant-${Date.now()}`,
        is_active: true,
        ...overrides,
      },
    });
  },

  async createTestUser(tenantId, overrides = {}) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    return await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password_hash: hashedPassword,
        role: 'USER',
        tenant_id: tenantId,
        is_active: true,
        ...overrides,
      },
    });
  },

  async createTestApiKey(tenantId, overrides = {}) {
    return await prisma.apiKey.create({
      data: {
        name: 'Test API Key',
        key_hash: await bcrypt.hash('test-api-key', 10),
        tenant_id: tenantId,
        role: 'INTEGRATION',
        is_active: true,
        ...overrides,
      },
    });
  },

  async createTestEntity(tenantId, overrides = {}) {
    return await prisma.entity.create({
      data: {
        name: 'Test Entity',
        slug: `test-entity-${Date.now()}`,
        tenant_id: tenantId,
        fields: [],
        is_active: true,
        ...overrides,
      },
    });
  },

  async createTestRecord(entityId, tenantId, overrides = {}) {
    return await prisma.record.create({
      data: {
        entity_id: entityId,
        tenant_id: tenantId,
        fields: { test_field: 'test_value' },
        ...overrides,
      },
    });
  },

  async createTestDashboard(tenantId, overrides = {}) {
    return await prisma.dashboard.create({
      data: {
        name: 'Test Dashboard',
        slug: `test-dashboard-${Date.now()}`,
        tenant_id: tenantId,
        is_public: false,
        layout: [],
        ...overrides,
      },
    });
  },

  async createTestWidget(dashboardId, entityId, tenantId, overrides = {}) {
    return await prisma.widget.create({
      data: {
        dashboard_id: dashboardId,
        entity_id: entityId,
        tenant_id: tenantId,
        type: 'kpi',
        config: { metric: 'count' },
        position: { x: 0, y: 0, w: 2, h: 2 },
        ...overrides,
      },
    });
  },

  async createTestRule(entityId, tenantId, overrides = {}) {
    return await prisma.rule.create({
      data: {
        name: 'Test Rule',
        entity_id: entityId,
        tenant_id: tenantId,
        conditions: [{ field: 'test_field', operator: 'eq', value: 'test' }],
        actions: [{ type: 'notify', config: { message: 'Test notification' } }],
        run_on: 'both',
        is_active: true,
        ...overrides,
      },
    });
  },
};

// Mock external services
global.mockServices = {
  // Mock webhook calls
  mockWebhookCall: jest.fn().mockResolvedValue({ status: 200, data: {} }),
  
  // Mock notification service
  mockNotificationService: {
    send: jest.fn().mockResolvedValue(true),
  },

  // Mock Slack webhook
  mockSlackWebhook: jest.fn().mockResolvedValue({ status: 200 }),
};

// Export prisma for use in tests
global.testPrisma = prisma;
