# TestSprite Integration

## Overview

Athletic Academics Hub integrates with TestSprite via Model Context Protocol (MCP) for AI-powered automated testing. TestSprite enables intelligent test generation, execution, and analysis across the full stack.

## Configuration

### Environment Variables

Add your TestSprite API key to `.env`:

```bash
TESTSPRITE_API_KEY=sk-user-xxx
```

### MCP Configuration

TestSprite is configured as an MCP server in Kiro's settings. The configuration is typically located at:
- User-level: `~/.kiro/settings/mcp.json`
- Workspace-level: `.kiro/settings/mcp.json`

Example MCP configuration:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "TESTSPRITE_API_KEY": "${TESTSPRITE_API_KEY}"
      }
    }
  }
}
```

## Test Artifacts

TestSprite generates test files and results in the `testsprite_tests/` directory:

- **Test Cases**: Python test files (e.g., `TC001_*.py`)
- **Test Plans**: JSON configuration files
- **Results**: Test execution results and reports
- **Visualizations**: Links to TestSprite dashboard for test recordings

## Available Test Suites

### Frontend Tests
- User authentication via Clerk
- Role-based access control
- Student dashboard display
- UI component interactions

### Backend Tests
- Advising service (course scheduling, conflict detection)
- Compliance service (NCAA eligibility validation)
- Monitoring service (performance tracking, alerts)
- Support service (tutoring, study hall booking)
- AI service (chatbot, streaming responses)
- Integration service (external system connectivity)

### System Tests
- Rate limiting and throttling
- Environment variable validation
- Security features (encryption, audit logs)
- Performance and scalability stress testing

## Usage

### Via Kiro MCP

TestSprite tools are available through Kiro's MCP integration. You can:

1. Generate tests based on PRD and technical specifications
2. Execute tests against running services
3. Analyze test results and generate reports
4. View test visualizations on TestSprite dashboard

### Manual Execution

Test files in `testsprite_tests/` can be executed manually:

```bash
cd testsprite_tests
python TC001_User_Authentication_via_Clerk.py
```

## Test Results

Test results include:
- **Status**: Pass/Fail indicators
- **Error Messages**: Detailed failure information
- **Browser Logs**: Console output from frontend tests
- **Visualizations**: Video recordings of test execution
- **Analysis**: AI-generated insights and recommendations

## Best Practices

1. **Keep API Key Secret**: Never commit `TESTSPRITE_API_KEY` to version control
2. **Review Generated Tests**: Validate AI-generated tests before production use
3. **Update Test Plans**: Keep test plans in sync with PRD changes
4. **Monitor Test Coverage**: Use TestSprite analytics to track coverage
5. **Integrate with CI/CD**: Automate test execution in deployment pipelines

## Resources

- [TestSprite Documentation](https://www.testsprite.com/docs)
- [TestSprite Dashboard](https://www.testsprite.com/dashboard)
- [MCP Protocol](https://modelcontextprotocol.io)

## Troubleshooting

### API Key Issues
- Verify key is correctly set in `.env`
- Check MCP server configuration in Kiro settings
- Ensure key has not expired

### Test Execution Failures
- Verify services are running (check `npm run dev`)
- Check authentication is properly configured
- Review browser console logs in test results

### MCP Connection Issues
- Restart Kiro to reload MCP servers
- Check network connectivity
- Verify `@testsprite/testsprite-mcp` package is accessible
