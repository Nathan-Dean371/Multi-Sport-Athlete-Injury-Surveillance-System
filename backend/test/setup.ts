// Global test setup for E2E tests
// Runs once before all test suites

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

// Set test timeout (E2E tests can be slower)
jest.setTimeout(30000);

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
