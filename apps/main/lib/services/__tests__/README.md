# Service Tests

Comprehensive unit tests for all backend service clients in the Athletic Academics Hub platform.

## Test Coverage

### ServiceClient (Base Client)
- HTTP request methods (GET, POST, PUT, PATCH, DELETE)
- Retry logic with exponential backoff
- Timeout handling
- Error handling (4xx vs 5xx)
- Streaming support
- Health checks
- Service URL resolution

### AdvisingService
- Schedule generation
- Conflict detection
- Course recommendations
- Degree progress tracking
- Schedule validation

### ComplianceService
- Eligibility checking
- Initial eligibility (freshmen)
- Continuing eligibility
- Violation tracking
- NCAA rule updates
- Audit logging

### MonitoringService
- Performance metrics retrieval
- Progress report submission
- Alert management
- Intervention plan creation
- Team analytics
- Risk assessment

### SupportService
- Tutoring session booking
- Tutor availability checking
- Study hall check-in
- Attendance tracking
- Workshop registration
- Mentor matching
- Mentoring session scheduling

### UserService
- User account creation
- Profile retrieval and updates
- Role and permission management
- Clerk user synchronization

### AIService
- Chat (streaming and non-streaming)
- Conversation history
- AI-powered advising recommendations
- Compliance analysis
- Report generation
- Risk prediction
- Agentic workflow submission and status
- Knowledge base search
- Feedback submission
- Embedding generation

### IntegrationService
- Travel letter generation
- Absence notifications
- Email sending
- Calendar synchronization
- LMS integration
- SIS data import
- Transcript retrieval

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test serviceClient.test.ts
```

### Run tests for specific service
```bash
npm test advisingService.test.ts
```

## Test Structure

Each test file follows this structure:

1. **Setup**: Mock dependencies and create test fixtures
2. **Test Suites**: Organized by method/functionality
3. **Test Cases**: Cover success, error, and edge cases
4. **Cleanup**: Reset mocks after each test

## Mocking Strategy

- **ServiceClient**: Mocked at the module level
- **fetch**: Mocked globally for HTTP requests
- **Timers**: Mocked for retry delay testing
- **Environment Variables**: Set in jest.setup.js

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Clarity**: Test names clearly describe what is being tested
3. **Coverage**: Tests cover success paths, error cases, and edge cases
4. **Assertions**: Use specific assertions to verify behavior
5. **Mocking**: Mock external dependencies to ensure unit test isolation

## Coverage Goals

- **Statements**: 70%+
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+

## Adding New Tests

When adding new service methods:

1. Create test cases for success scenarios
2. Add error handling tests
3. Test edge cases (empty data, invalid input, etc.)
4. Verify correct parameters are passed to ServiceClient
5. Update this README with new test coverage

## Troubleshooting

### Tests timing out
- Check if timers are properly mocked
- Ensure async operations are properly awaited
- Verify mock implementations resolve/reject correctly

### Mock not working
- Ensure mocks are cleared between tests
- Check mock implementation order
- Verify jest.mock() is called before imports

### Coverage not meeting threshold
- Run with `--coverage` to see uncovered lines
- Add tests for missing branches
- Ensure all exported functions are tested
