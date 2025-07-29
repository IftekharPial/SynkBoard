/**
 * Root Jest Configuration for SynkBoard
 * Orchestrates testing across all packages and apps
 */

module.exports = {
  projects: [
    '<rootDir>/apps/backend',
    '<rootDir>/apps/frontend',
    '<rootDir>/packages/shared',
    '<rootDir>/packages/types',
    '<rootDir>/packages/database',
  ],
  collectCoverageFrom: [
    'apps/*/src/**/*.{ts,tsx}',
    'packages/*/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.config.{js,ts}',
    '!**/coverage/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/.next/',
  ],
  moduleNameMapping: {
    '^@synkboard/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@synkboard/types/(.*)$': '<rootDir>/packages/types/src/$1',
    '^@synkboard/database/(.*)$': '<rootDir>/packages/database/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  maxWorkers: '50%',
  verbose: true,
};
