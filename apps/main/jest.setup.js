/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.USER_SERVICE_URL = 'http://localhost:3001';
process.env.COMPLIANCE_SERVICE_URL = 'http://localhost:3002';
process.env.ADVISING_SERVICE_URL = 'http://localhost:3003';
process.env.MONITORING_SERVICE_URL = 'http://localhost:3004';
process.env.SUPPORT_SERVICE_URL = 'http://localhost:3005';
process.env.INTEGRATION_SERVICE_URL = 'http://localhost:3006';
process.env.AI_SERVICE_URL = 'http://localhost:3007';

// Mock fetch globally if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
