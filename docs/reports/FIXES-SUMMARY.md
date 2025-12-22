# System Fixes Summary

## Issues Identified and Fixed

### 1. File Watcher Limit Error ✓

**Error:**
```
ENOSPC: System limit for number of file watchers reached
```

**Root Cause:**
- System limit: 65,536 watchers (too low for your monorepo)
- Your project has:
  - 7+ microservices with tsx watch
  - 15+ MCP server instances (many duplicates)
  - Turbo daemon watching entire monorepo
  - Multiple TypeScript language servers

**Solution:**
Run these commands:

```bash
# Increase file watcher limit (requires sudo password)
sudo sysctl -w fs.inotify.max_user_watches=524288

# Make it permanent
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.d/99-increase-watchers.conf

# Apply changes
sudo sysctl -p /etc/sysctl.d/99-increase-watchers.conf

# Verify
cat /proc/sys/fs/inotify/max_user_watches
# Should show: 524288
```

**Quick Relief (if you can't sudo immediately):**
```bash
./quick-fix-watchers.sh
```

**Documentation:** See [`fix-file-watchers.md`](fix-file-watchers.md)

---

### 2. Gemini CLI API Permission Error ✓

**Error:**
```
403 - Permission denied on resource project default
CONSUMER_INVALID: cloudaicompanion.googleapis.com
```

**Root Cause:**
This error is from the **Gemini CLI tool** (a Google product), NOT your Athletic Academics Hub project.

The Gemini CLI is trying to use a Google Cloud project called "default" which doesn't exist.

**Important Discovery:**
Your project **does NOT use Google Gemini**. Your AI services use:
- ✅ OpenAI (GPT-4, GPT-4o-mini)
- ✅ Anthropic (Claude 3.5 Sonnet)

**Solution Options:**

**Option 1: Ignore (Recommended)**
You don't need Gemini CLI for your project. The error is unrelated to your codebase.

**Option 2: Fix Gemini CLI (if you want to use it separately)**
```bash
# Install Google Cloud CLI
# See: https://cloud.google.com/sdk/docs/install

# Create/select a project
gcloud projects create my-gemini-project
gcloud config set project my-gemini-project

# Enable APIs
gcloud services enable cloudaicompanion.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

**Option 3: Add Gemini to Your Project (optional)**
See detailed steps in [`fix-gemini-api-error.md`](fix-gemini-api-error.md)

**Documentation:** See [`fix-gemini-api-error.md`](fix-gemini-api-error.md)

---

## Current System Status

### Running Processes
You currently have many processes consuming system resources:

```
- 7+ tsx watch processes (microservices)
- 1 Turbo daemon (high CPU usage)
- 15+ MCP server instances
- 4+ TypeScript language servers
- Multiple npm/node processes
```

### Recommendations

1. **Optimize Development Workflow**
   ```bash
   # Instead of running all services, use Turborepo filtering
   pnpm dev --filter=@aah/web --filter=@aah/service-user
   ```

2. **Review MCP Server Configuration**
   - You have duplicate MCP servers running
   - Check your Kiro/Claude settings
   - Disable unused MCP servers

3. **Monitor Resource Usage**
   ```bash
   # Check file watcher usage
   cat /proc/sys/fs/inotify/max_user_watches
   
   # Count Node processes
   ps aux | grep -E "(node|npm|pnpm)" | grep -v grep | wc -l
   ```

---

## Files Created

| File | Purpose |
|------|---------|
| [`fix-file-watchers.md`](fix-file-watchers.md) | Complete guide to file watcher issue |
| [`quick-fix-watchers.sh`](quick-fix-watchers.sh) | Script for quick relief |
| [`fix-gemini-api-error.md`](fix-gemini-api-error.md) | Complete guide to Gemini API error |
| [`quick-fix-gemini-cli.sh`](quick-fix-gemini-cli.sh) | Gemini CLI diagnostic script |
| [`FIXES-SUMMARY.md`](FIXES-SUMMARY.md) | This file - overall summary |

---

## Next Steps

### Immediate Actions (Required)

1. **Increase file watcher limit:**
   ```bash
   sudo sysctl -w fs.inotify.max_user_watches=524288
   ```

2. **Verify your .env file has AI API keys:**
   ```bash
   # Check if .env exists
   ls -la .env
   
   # If not, copy from example
   cp .env.example .env
   
   # Edit and add your actual API keys
   # OPENAI_API_KEY=sk-proj-...
   # ANTHROPIC_API_KEY=sk-ant-...
   ```

### Optional Optimizations

1. **Reduce running processes:**
   ```bash
   # Kill unnecessary MCP servers
   pkill -f "testsprite-mcp"
   pkill -f "playwright-mcp"
   ```

2. **Use filtered dev mode:**
   ```bash
   # Only run services you're actively working on
   pnpm dev --filter=@aah/web --filter=@aah/service-ai
   ```

3. **Review `.gitignore` and add:**
   ```
   node_modules/
   dist/
   .turbo/
   .next/
   ```

---

## Project Health Check

Run these commands to verify your project is healthy:

```bash
# 1. Check file watcher limit
cat /proc/sys/fs/inotify/max_user_watches

# 2. Check environment variables
node -e "console.log('OpenAI:', !!process.env.OPENAI_API_KEY); console.log('Anthropic:', !!process.env.ANTHROPIC_API_KEY)"

# 3. Check running processes
ps aux | grep -E "(node|npm|pnpm)" | grep -v grep | wc -l

# 4. Test AI service health
curl http://localhost:3007/health

# 5. Run type checking
pnpm type-check
```

---

## Support Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Node.js File Watchers](https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener)
- [Google Cloud Console](https://console.cloud.google.com)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)

---

## Questions?

If you encounter other issues:

1. Check the detailed documentation in the fix files
2. Run the diagnostic scripts
3. Verify environment variables are set correctly
4. Ensure database is running and accessible
5. Check service logs for errors

---

*Last Updated: $(date)*
*Project: Athletic Academics Hub*
*Environment: Linux 6.14, Node.js v22.21.0*
