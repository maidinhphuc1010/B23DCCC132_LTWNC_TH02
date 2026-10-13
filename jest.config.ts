import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }] },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': '<rootDir>/tests/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ['src/features/**/*.{ts,tsx}', '!src/features/**/*.d.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coverageThreshold: { global: { statements: 0 }, './src/features/': { statements: 70 } },
};
export default config;
