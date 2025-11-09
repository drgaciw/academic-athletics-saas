# Agent Hooks for Test Automation

This directory contains Kiro agent hooks that automate testing workflows for the Athletic Academics Hub project.

## Available Hooks

### 1. Auto Test on Service Save
**File**: `auto-test-on-save.kiro.hook`  
**Trigger**: Automatic when service files are saved  
**Purpose**: Runs tests immediately after saving a service file

**Usage**: Just save any file in `apps/main/lib/services/` and tests will run automatically.

### 2. Test Coverage Checker
**File**: `test-coverage-check.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Analyzes test coverage and identifies gaps

**Usage**: 
- Open Command Palette (Cmd/Ctrl+Shift+P)
- Search for "Test Coverage Checker"
- Click to run

**What it does**:
- Runs coverage report
- Identifies files with <70% coverage
- Suggests additional test cases
- Prioritizes critical paths

### 3. Fix Failing Tests
**File**: `fix-failing-tests.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Automatically diagnoses and fixes common test failures

**Usage**: Run when tests are failing to get automated fixes

**Fixes**:
- Type errors
- Mock issues
- Assertion errors
- Runtime errors

### 4. Update Test Types
**File**: `update-test-types.kiro.hook`  
**Trigger**: Automatic when type files are saved  
**Purpose**: Keeps tests in sync with type definitions

**Usage**: Save any file in `apps/main/lib/types/services/` and tests will be updated automatically.

### 5. Pre-Commit Test Runner
**File**: `pre-commit-test-runner.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Validates staged changes before commit

**Usage**: Run before committing to ensure all tests pass

**Checks**:
- Tests for staged files
- TypeScript errors
- Linting issues
- Offers to fix issues automatically

### 6. Test Data Generator
**File**: `test-data-generator.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Generates realistic test fixtures

**Usage**: Run to create comprehensive test data

**Generates**:
- Valid data (happy path)
- Edge cases
- Invalid data (error scenarios)
- Factory functions for easy data creation

### 7. Integration Test Runner
**File**: `integration-test-runner.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Tests service interactions and workflows

**Usage**: Run to test end-to-end workflows

**Tests**:
- Common user journeys
- Service-to-service communication
- Data consistency
- Error propagation
- Performance metrics

### 8. Mock Service Validator
**File**: `mock-service-validator.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Ensures mocks match actual implementations

**Usage**: Run to validate test mocks

**Validates**:
- Mock methods match actual methods
- Return types are correct
- Parameters are accurate
- Behavior is realistic

### 9. Test Performance Monitor
**File**: `test-performance-monitor.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Identifies and optimizes slow tests

**Usage**: Run to analyze test performance

**Analyzes**:
- Test execution times
- Slow tests (>1000ms)
- Performance bottlenecks
- Optimization opportunities

**Performance Budgets**:
- Unit tests: <100ms
- Integration tests: <500ms
- E2E tests: <2000ms

### 10. Unit Testing Generator
**File**: `unit-testing-hook.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Generates or updates unit tests for modified files

**Usage**: Run after modifying source files to create/update tests

### 11. TestSprite Frontend Test Runner
**File**: `testsprite-frontend-runner.kiro.hook`  
**Trigger**: Manual (user-triggered)  
**Purpose**: Runs TestSprite frontend tests for authentication and UI workflows

**Usage**: Run to test frontend functionality with TestSprite

**Tests**:
- Clerk authentication flows
- Navigation and routing
- Form validation
- UI components
- Accessibility compliance

**Reports**:
- Test pass/fail status
- Screenshots of failures
- Performance metrics
- Accessibility issues

## How to Use Hooks

### Viewing Hooks
1. Open the Kiro feature panel
2. Navigate to "Agent Hooks" section
3. See all available hooks with their status

### Running Manual Hooks
1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Type "Kiro Hook" or search for specific hook name
3. Select the hook to run

### Enabling/Disabling Hooks
1. Open the hook file
2. Change `"enabled": true` to `"enabled": false`
3. Save the file
4. Hooks reconnect automatically

### Creating Custom Hooks
1. Create a new `.kiro.hook` file in this directory
2. Use this structure:
```json
{
  "enabled": true,
  "name": "Hook Name",
  "description": "What this hook does",
  "version": "1",
  "when": {
    "type": "userTriggered" | "onFileSave",
    "filePattern": "path/pattern/**/*.ts",
    "excludePattern": "**/*.test.ts"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Instructions for the agent..."
  }
}
```

## Recommended Workflow

### During Development
1. **Auto Test on Save** - Enabled by default, runs tests as you code
2. **Update Test Types** - Enabled by default, keeps tests in sync

### Before Committing
1. Run **Pre-Commit Test Runner** to validate changes
2. Run **Test Coverage Checker** to ensure adequate coverage
3. If tests fail, run **Fix Failing Tests**

### Weekly Maintenance
1. Run **Mock Service Validator** to ensure mocks are accurate
2. Run **Test Performance Monitor** to keep tests fast
3. Run **Integration Test Runner** to verify workflows

### When Adding Features
1. Use **Unit Testing Generator** to create initial tests
2. Use **Test Data Generator** to create fixtures
3. Run **Test Coverage Checker** to verify coverage

## Best Practices

1. **Keep hooks enabled during development** - They catch issues early
2. **Run pre-commit checks** - Prevents broken commits
3. **Monitor test performance** - Slow tests hurt productivity
4. **Validate mocks regularly** - Ensures tests reflect reality
5. **Generate test data** - Makes tests more realistic
6. **Check coverage weekly** - Maintains quality standards

## Troubleshooting

### Hook Not Running
- Check if hook is enabled (`"enabled": true`)
- Verify file pattern matches your files
- Check Kiro logs for errors

### Hook Running Too Often
- Adjust `filePattern` to be more specific
- Add `excludePattern` to skip certain files
- Consider changing to `userTriggered`

### Hook Taking Too Long
- Simplify the prompt
- Focus on specific tasks
- Break into multiple smaller hooks

## Integration with CI/CD

These hooks complement CI/CD pipelines:
- Hooks provide immediate feedback during development
- CI/CD runs comprehensive tests before deployment
- Both ensure code quality at different stages

## Support

For issues or questions:
1. Check hook configuration in the file
2. Review Kiro logs
3. Consult the main testing documentation in `apps/main/TESTING_GUIDE.md`
