/**
 * Shared Package Jest Configuration for SynkBoard
 * Configures testing for shared utility functions
 */

module.exports = {
  displayName: 'Shared Utils',
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
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
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
