/**
 * Types Package Jest Configuration for SynkBoard
 * Configures testing for TypeScript types and Zod schemas
 */

module.exports = {
  displayName: 'Types & Schemas',
  testEnvironment: 'node',
  preset: 'ts-jest',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2022',
      },
    }],
  },
  testTimeout: 5000,
  verbose: true,
};
