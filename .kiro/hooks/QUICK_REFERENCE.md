# Agent Hooks Quick Reference

## Automatic Hooks (Always Running)

| Hook | Trigger | Action |
|------|---------|--------|
| **Auto Test on Save** | Save service file | Runs corresponding tests |
| **Update Test Types** | Save type definition | Updates affected tests |

## Manual Hooks (Run on Demand)

### Testing & Validation

```bash
# Check test coverage
→ Command Palette: "Test Coverage Checker"
→ Shows coverage gaps and suggests improvements

# Fix failing tests
→ Command Palette: "Fix Failing Tests"
→ Automatically diagnoses and fixes test issues

# Validate before commit
→ Command Palette: "Pre-Commit Test Runner"
→ Runs tests on staged files only
```

### Test Creation & Maintenance

```bash
# Generate unit tests
→ Command Palette: "Unit Testing Generator"
→ Creates tests for modified files

# Generate test data
→ Command Palette: "Test Data Generator"
→ Creates realistic fixtures and factories

# Validate mocks
→ Command Palette: "Mock Service Validator"
→ Ensures mocks match actual implementations
```

### Performance & Integration

```bash
# Run integration tests
→ Command Palette: "Integration Test Runner"
→ Tests service interactions and workflows

# Monitor test performance
→ Command Palette: "Test Performance Monitor"
→ Identifies and optimizes slow tests
```

## Common Workflows

### 🚀 Starting Development
1. Ensure automatic hooks are enabled
2. Start coding - tests run automatically on save

### 📝 Before Committing
```bash
1. Pre-Commit Test Runner  # Validate changes
2. Test Coverage Checker   # Ensure coverage
3. Fix Failing Tests       # If needed
```

### 🔧 Adding New Feature
```bash
1. Write code
2. Unit Testing Generator  # Create tests
3. Test Data Generator     # Create fixtures
4. Test Coverage Checker   # Verify coverage
```

### 🏃 Weekly Maintenance
```bash
1. Mock Service Validator      # Monday
2. Test Performance Monitor    # Wednesday
3. Integration Test Runner     # Friday
```

## Quick Tips

✅ **DO**
- Keep automatic hooks enabled
- Run pre-commit checks before pushing
- Generate test data for realistic scenarios
- Monitor test performance regularly

❌ **DON'T**
- Disable hooks without reason
- Skip pre-commit validation
- Ignore slow tests
- Let mocks drift from reality

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Command Palette | `Cmd/Ctrl + Shift + P` |
| Search for hook | Type "Kiro Hook" |
| Run last hook | `Cmd/Ctrl + Shift + R` |

## Status Indicators

| Symbol | Meaning |
|--------|---------|
| ✅ | Tests passed |
| ❌ | Tests failed |
| ⚠️ | Warnings found |
| 🔄 | Running tests |
| 📊 | Coverage report |
| ⚡ | Performance issue |

## Need Help?

- Full documentation: `.kiro/hooks/README.md`
- Testing guide: `apps/main/TESTING_GUIDE.md`
- Test summary: `apps/main/lib/services/__tests__/TEST_SUMMARY.md`
