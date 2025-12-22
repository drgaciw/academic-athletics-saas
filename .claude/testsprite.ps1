# Execute TestSprite MCP with the latest version and the API key from environment variable (TESTSPRITE_API_KEY -> API_KEY)
$env:API_KEY = $env:TESTSPRITE_API_KEY
npx @testsprite/testsprite-mcp@latest
