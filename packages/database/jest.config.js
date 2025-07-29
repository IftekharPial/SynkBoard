/**
 * Database Package Jest Configuration for SynkBoard
 * Configures testing for Prisma client and database operations
 */

module.exports = {
  displayName: 'Database',
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
    '!src/seed.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
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
