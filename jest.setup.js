/**
 * Global Jest Setup for SynkBoard
 * Configures test environment and global utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

// Global test utilities
global.testUtils = {
  // Mock console methods to reduce noise in tests
  mockConsole: () => {
    const originalConsole = { ...console };
    beforeEach(() => {
      console.log = jest.fn();
      console.warn = jest.fn();
      console.error = jest.fn();
    });
    afterEach(() => {
      Object.assign(console, originalConsole);
    });
  },

  // Create test timeout helper
  timeout: (ms = 5000) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test data helpers
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  generateTestEmail: () => `test-${Date.now()}@example.com`,
  
  generateTestUser: (overrides = {}) => ({
    id: global.testUtils.generateTestId(),
    email: global.testUtils.generateTestEmail(),
    name: 'Test User',
    role: 'USER',
    tenant_id: 'test-tenant-id',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  generateTestTenant: (overrides = {}) => ({
    id: global.testUtils.generateTestId(),
    name: 'Test Tenant',
    slug: `test-tenant-${Date.now()}`,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  generateTestEntity: (overrides = {}) => ({
    id: global.testUtils.generateTestId(),
    name: 'Test Entity',
    slug: `test-entity-${Date.now()}`,
    tenant_id: 'test-tenant-id',
    fields: [],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for integration tests
jest.setTimeout(30000);
