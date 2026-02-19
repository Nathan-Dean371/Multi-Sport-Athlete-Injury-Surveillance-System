/**
 * Jest Configuration - Unit Tests
 *
 * Covers all *.spec.ts files under src/
 * E2E tests are handled separately via test/jest-e2e.json
 *
 * Run unit tests:  npm run test
 * Run with watch: npm run test:watch
 * Run with cov:   npm run test:cov
 */

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  // Use ts-jest to compile TypeScript on the fly
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Only look inside src/ — test/ directory is exclusively for E2E
  roots: ['<rootDir>/src'],

  // NestJS convention: co-located spec files
  testMatch: ['**/*.spec.ts'],

  // TypeScript transform
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Resolve path aliases defined in tsconfig.json
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Coverage collected from source files only — never from tests or dist
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: './coverage/unit',

  // No setupFilesAfterEnv here — that belongs to E2E only
  // Unit tests mock all external dependencies

  verbose: true,

  // Unit tests should be fast — flag anything over 5s
  testTimeout: 5000,
};