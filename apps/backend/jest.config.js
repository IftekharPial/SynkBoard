/**
 * Backend Jest Configuration for SynkBoard
 * Configures testing for Express API server
 */

module.exports = {
  displayName: 'Backend API',
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
    '!src/test-*.ts',
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
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@synkboard/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@synkboard/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
    '^@synkboard/database/(.*)$': '<rootDir>/../../packages/database/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2022',
      },
    }],
  },
  testTimeout: 15000,
  maxWorkers: 1, // Database tests need to run sequentially
  verbose: true,
};
