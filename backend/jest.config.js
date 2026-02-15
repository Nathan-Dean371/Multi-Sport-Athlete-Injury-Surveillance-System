module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  // Match both unit and E2E tests
  testMatch: [
    "<rootDir>/src/**/*.spec.ts",
    "<rootDir>/test/**/*.e2e-spec.ts"
  ],
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  
  // Setup file for E2E tests (will only run before E2E tests)
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  
  // Module path mapping
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
