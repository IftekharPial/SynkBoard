# 🧪 Testing Guide for SynkBoard

This document provides comprehensive instructions for running, writing, and maintaining tests in the SynkBoard project.

## 📋 Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🏗️ Test Structure

SynkBoard uses a comprehensive testing strategy with multiple layers:

```
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/__tests__/          # API endpoint tests
│   │   │   ├── __tests__/integration/     # Integration tests
│   │   │   └── utils/__tests__/           # Utility function tests
│   │   ├── jest.config.js                 # Backend Jest config
│   │   └── jest.setup.js                  # Backend test setup
│   └── frontend/
│       ├── src/
│       │   ├── components/**/__tests__/   # Component tests
│       │   ├── hooks/__tests__/           # Custom hook tests
│       │   ├── __tests__/e2e/            # End-to-end tests
│       │   └── lib/__tests__/             # Utility tests
│       ├── jest.config.js                 # Frontend Jest config
│       └── jest.setup.js                  # Frontend test setup
├── packages/
│   ├── shared/src/__tests__/              # Shared utility tests
│   ├── types/src/__tests__/               # Schema validation tests
│   └── database/src/__tests__/            # Database operation tests
├── jest.config.js                         # Root Jest config
├── jest.setup.js                          # Global test setup
└── TESTING.md                             # This file
```

## 🚀 Running Tests

### All Tests
```bash
# Run all tests across all packages
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run tests for CI/CD (no watch, with coverage)
npm run test:ci
```

### Specific Test Suites
```bash
# Backend API tests only
npm run test:backend

# Frontend component tests only
npm run test:frontend

# Shared packages tests only
npm run test:packages

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### Individual Package Tests
```bash
# Run tests in specific workspace
npm run test --workspace=apps/backend
npm run test --workspace=apps/frontend
npm run test --workspace=packages/shared
```

## 🧪 Test Types

### 1. Unit Tests
- **Location**: `**/__tests__/*.test.ts`
- **Purpose**: Test individual functions, components, and modules in isolation
- **Examples**: Validation functions, utility helpers, React components

### 2. Integration Tests
- **Location**: `apps/backend/src/__tests__/integration/`
- **Purpose**: Test complete workflows and API interactions
- **Examples**: Entity CRUD operations, authentication flows, webhook processing

### 3. End-to-End Tests
- **Location**: `apps/frontend/src/__tests__/e2e/`
- **Purpose**: Test complete user journeys and workflows
- **Examples**: Dashboard creation, entity management, user registration

### 4. API Tests
- **Location**: `apps/backend/src/routes/__tests__/`
- **Purpose**: Test REST API endpoints with proper authentication and validation
- **Examples**: Entity endpoints, authentication, webhook ingestion

### 5. Component Tests
- **Location**: `apps/frontend/src/components/**/__tests__/`
- **Purpose**: Test React components with user interactions
- **Examples**: Forms, buttons, dashboard widgets, admin interfaces

## ✍️ Writing Tests

### Backend API Tests

```typescript
import request from 'supertest';
import { app } from '../../index';

describe('Entity Routes', () => {
  let testTenant: any;
  let authToken: string;

  beforeEach(async () => {
    testTenant = await global.testFactories.createTestTenant();
    const user = await global.testFactories.createTestUser(testTenant.id);
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'password123' });
    
    authToken = loginResponse.body.data.token;
  });

  it('should create entity with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/entities')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Entity',
        fields: [{ key: 'name', name: 'Name', type: 'text', is_required: true }],
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.entity.name).toBe('Test Entity');
  });
});
```

### Frontend Component Tests

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityForm } from '../EntityForm';

describe('EntityForm Component', () => {
  const user = userEvent.setup();

  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(<EntityForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/entity name/i);
    await user.type(nameInput, 'Test Entity');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Test Entity',
      slug: 'test-entity',
    });
  });
});
```

### Integration Tests

```typescript
describe('Entity Management Workflow', () => {
  it('should handle complete entity lifecycle', async () => {
    // Create entity
    const createResponse = await request(app)
      .post('/api/v1/entities')
      .set('Authorization', `Bearer ${authToken}`)
      .send(entityData)
      .expect(201);

    // Create records
    await request(app)
      .post(`/api/v1/entities/${entitySlug}/records`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(recordData)
      .expect(201);

    // Update entity
    await request(app)
      .put(`/api/v1/entities/${entitySlug}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    // Delete entity
    await request(app)
      .delete(`/api/v1/entities/${entitySlug}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
```

## 📊 Test Coverage

### Coverage Requirements
- **Global**: 80% minimum coverage for lines, functions, branches, and statements
- **Backend**: 85% minimum coverage (higher due to critical business logic)
- **Frontend**: 80% minimum coverage
- **Shared Packages**: 90% minimum coverage (pure utility functions)

### Viewing Coverage Reports
```bash
# Generate and view coverage report
npm run test:coverage

# Coverage reports are generated in:
# - coverage/ (root level)
# - apps/*/coverage/ (individual packages)
```

### Coverage Exclusions
The following are excluded from coverage requirements:
- Configuration files (`*.config.js`, `*.config.ts`)
- Type definition files (`*.d.ts`)
- Test files themselves
- Build output directories
- Database migration files

## 🔧 Test Configuration

### Jest Configuration
Each package has its own Jest configuration optimized for its environment:

- **Backend**: Node.js environment with database setup
- **Frontend**: jsdom environment with React Testing Library
- **Packages**: Node.js environment for utility testing

### Test Database
Backend tests use an isolated SQLite database:
- Database is reset before each test
- Test factories provide consistent test data
- Transactions are rolled back after each test

### Mocking Strategy
- **API calls**: Mocked using Jest mocks
- **External services**: Mocked with configurable responses
- **Database**: Real database with cleanup between tests
- **React components**: Shallow rendering with React Testing Library

## 🚀 CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Pull requests to main branch
- Pushes to main branch
- Scheduled nightly runs

### Test Pipeline
1. **Setup**: Install dependencies and setup test databases
2. **Lint**: Run ESLint and TypeScript checks
3. **Unit Tests**: Run all unit tests with coverage
4. **Integration Tests**: Run integration test suite
5. **E2E Tests**: Run end-to-end test suite
6. **Coverage**: Upload coverage reports to codecov

### Required Checks
All tests must pass before merging:
- Unit tests: 100% pass rate
- Integration tests: 100% pass rate
- Coverage: Meets minimum thresholds
- Linting: No errors or warnings

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Reset test database
npm run db:setup
npm run test:backend
```

#### Frontend Test Timeouts
```bash
# Increase timeout in jest.config.js
testTimeout: 15000
```

#### Memory Issues
```bash
# Run tests with more memory
node --max-old-space-size=4096 node_modules/.bin/jest
```

#### Mock Issues
```bash
# Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Debug Mode
```bash
# Run tests in debug mode
npm test -- --verbose --no-cache

# Run specific test file
npm test -- --testPathPattern=entity.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create entity"
```

### Performance Optimization
```bash
# Run tests in parallel (default)
npm test -- --maxWorkers=4

# Run tests serially (for debugging)
npm test -- --runInBand

# Skip coverage for faster runs
npm test -- --passWithNoTests
```

## 📝 Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Keep tests focused and independent

### Test Data
- Use test factories for consistent data creation
- Clean up test data after each test
- Use realistic but minimal test data
- Avoid hardcoded IDs or timestamps

### Assertions
- Use specific assertions (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Verify error messages and status codes
- Check side effects and state changes

### Mocking
- Mock external dependencies and services
- Use real implementations for internal code
- Keep mocks simple and focused
- Reset mocks between tests

## 🔄 Continuous Improvement

### Test Metrics
Monitor these metrics to improve test quality:
- Test execution time
- Test flakiness rate
- Coverage trends
- Test maintenance overhead

### Regular Maintenance
- Review and update test data factories
- Remove obsolete tests
- Refactor duplicated test code
- Update mocks when APIs change

### Team Practices
- Write tests before or alongside feature development
- Review test code in pull requests
- Share testing patterns and utilities
- Document complex test scenarios

---

For questions or issues with testing, please refer to the project documentation or reach out to the development team.
