/**
 * Frontend Test Setup for SynkBoard
 * Configures React Testing Library, mocks, and test utilities
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  }),
}));

// Mock API client
jest.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
      refresh: jest.fn(),
    },
    entities: {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    records: {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dashboards: {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    widgets: {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getData: jest.fn(),
    },
    rules: {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      test: jest.fn(),
      getLogs: jest.fn(),
    },
    webhooks: {
      getLogs: jest.fn(),
      getStats: jest.fn(),
      testEndpoint: jest.fn(),
    },
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Test utilities for React components
global.testUtils = {
  ...global.testUtils,

  // Mock user context
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    tenant: {
      id: 'test-tenant-id',
      name: 'Test Tenant',
      slug: 'test-tenant',
    },
    permissions: ['entity:view', 'entity:create', 'dashboard:view', 'dashboard:create'],
  },

  // Mock auth context
  mockAuthContext: {
    user: global.testUtils?.mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(true),
  },

  // Create wrapper with providers
  createWrapper: ({ user = global.testUtils?.mockUser, ...props } = {}) => {
    const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  },

  // Generate test props
  generateTestEntity: (overrides = {}) => ({
    id: 'test-entity-id',
    name: 'Test Entity',
    slug: 'test-entity',
    tenant_id: 'test-tenant-id',
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
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  generateTestDashboard: (overrides = {}) => ({
    id: 'test-dashboard-id',
    name: 'Test Dashboard',
    slug: 'test-dashboard',
    tenant_id: 'test-tenant-id',
    is_public: false,
    layout: [],
    widgets: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  generateTestWidget: (overrides = {}) => ({
    id: 'test-widget-id',
    dashboard_id: 'test-dashboard-id',
    entity_id: 'test-entity-id',
    tenant_id: 'test-tenant-id',
    type: 'kpi',
    config: { metric: 'count' },
    position: { x: 0, y: 0, w: 2, h: 2 },
    is_public: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
};

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('React does not recognize')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};
