/*
 * Jest Configuration for FHO Cloud
 *
 * Wrapped with next/jest so test files can use ES module `import` syntax
 * (transformed via Next.js's built-in SWC compiler).
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/lib/**/*.js',
    '!src/lib/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [],
  verbose: true,
};

module.exports = createJestConfig(customJestConfig);
