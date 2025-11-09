# Testing Guide - Backend Services

Quick reference guide for running and maintaining the backend service tests.

## Quick Start

### 1. Install Dependencies
```bash
cd apps/main
npm install
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm test:coverage

# Run in watch mode (auto-rerun on changes)
npm test:watch

# Run only service tests
npm test:services
```

## Test Structure

```
apps/main/lib/services/__tests__/
├── serviceClient.test.ts       # Base HTTP client tests
├── advisingService.test.ts     # Advising service tests
├── complianceService.test.ts   # Compliance service tests
├── monitoringService.test.ts   # Monitoring service tests
├── supportService.test.ts      # Support service tests
├── userService.test.ts         # User service tests
├── aiService.test.ts           # AI service tests
├── integrationService.test.ts  # Integration service tests
├── README.md                   # Detailed test documentation
└── TEST_SUMMARY.md            # Implementation summary
```

## What's Tested

### ✅ ServiceClient (Base)
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Retry logic with exponential backoff
- Timeout handling
- Error handling (4xx vs 5xx)
- Streaming support
- Health checks

### ✅ All Service Clients
- Success scenarios
- Error handling
- Edge cases
- Parameter validation
- Context propagation
- Health checks

## Coverage Goals

| Metric | Target |
|--------|--------|
| Statements | 70%+ |
| Branches | 70%+ |
| Functions | 70%+ |
| Lines | 70%+ |

## Viewing Coverage

After running `npm test:coverage`:

1. **Terminal**: Summary displayed in console
2. **HTML Report**: Open `coverage/lcov-report/index.html`
3. **Detailed**: Check `coverage/lcov.info` for line-by-line coverage

## Common Commands

```bash
# Run specific test file
npm test serviceClient.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should retry"

# Update snapshots (if using)
npm test -- -u

# Run with verbose output
npm test -- --verbose

# Run tests in specific directory
npm test lib/services/__tests__
```

## Debugging Tests

### Enable Debug Output
```bash
# Show console logs
npm test -- --silent=false

# Run single test file with logs
npm test serviceClient.test.ts -- --silent=false
```

### VS Code Debugging
1. Set breakpoint in test file
2. Click "Debug" above test case
3. Or use Jest Runner extension

## Writing New Tests

### Template
```typescript
import { serviceName } from '../serviceName';
import { ServiceClient } from '../serviceClient';
import { RequestContext, UserRole } from '../../types/services/common';

jest.mock('../serviceClient');

describe('ServiceName', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.STUDENT,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  let mockPost: jest.Mock;
  let mockGet: jest.Mock;

  beforeEach(() => {
    mockPost = jest.fn();
    mockGet = jest.fn();

    (ServiceClient as jest.Mock).mockImplementation(() => ({
      post: mockPost,
      get: mockGet,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const request = { /* ... */ };
      const mockResponse = { /* ... */ };
      mockPost.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await serviceName.methodName(request, mockContext);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/endpoint', request, mockContext);
    });

    it('should handle error case', async () => {
      // Arrange
      const request = { /* ... */ };
      mockPost.mockRejectedValueOnce(new Error('Test error'));

      // Act & Assert
      await expect(
        serviceName.methodName(request, mockContext)
      ).rejects.toThrow('Test error');
    });
  });
});
```

## Troubleshooting

### Tests Timing Out
```bash
# Increase timeout in jest.config.js
testTimeout: 10000  // 10 seconds
```

### Mocks Not Working
```bash
# Clear Jest cache
npm test -- --clearCache
```

### TypeScript Errors
```bash
# Check TypeScript configuration
npm run type-check
```

### Coverage Not Meeting Threshold
```bash
# Run coverage to see uncovered lines
npm test:coverage

# View HTML report for details
open coverage/lcov-report/index.html
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    cd apps/main
    npm install
    npm test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./apps/main/coverage/lcov.info
```

## Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should explain what they test
3. **Test behavior, not implementation** - Focus on what, not how
4. **Mock external dependencies** - Keep tests fast and reliable
5. **Clean up after tests** - Use afterEach to reset state
6. **Test edge cases** - Don't just test the happy path
7. **Keep tests simple** - One assertion per test when possible

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test README](./lib/services/__tests__/README.md)
- [Test Summary](./lib/services/__tests__/TEST_SUMMARY.md)

## Getting Help

If you encounter issues:
1. Check this guide
2. Review test README in `__tests__/README.md`
3. Check Jest documentation
4. Ask the team in #engineering channel
