# Fix File Watcher Limit Issue

## Problem
You're encountering: `ENOSPC: System limit for number of file watchers reached`

Your system has **65,536** file watchers available, but you have many Node.js processes running:
- Multiple `tsx watch` processes for services (7+ services)
- Turbo daemon
- Multiple MCP servers (15+ instances)
- TypeScript servers
- Other development tools

## Solution

### Option 1: Increase File Watcher Limit (Recommended)

Run these commands in your terminal:

```bash
# Temporarily increase the limit (until reboot)
sudo sysctl -w fs.inotify.max_user_watches=524288

# Make it permanent
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.d/99-increase-watchers.conf

# Apply changes immediately
sudo sysctl -p /etc/sysctl.d/99-increase-watchers.conf
```

### Option 2: Kill Unnecessary Processes

If you can't increase the limit immediately, kill some processes:

```bash
# Kill duplicate tsx watch processes
pkill -f "tsx watch"

# Kill MCP servers you're not actively using
pkill -f "testsprite-mcp"
pkill -f "playwright-mcp"

# Restart only what you need
cd /home/username01/IdeaProjects01/academic-athletics-saas
pnpm dev
```

### Option 3: Optimize Your Development Setup

Instead of running many watch processes, use Turborepo filtering:

```bash
# Stop all current processes
pkill -f "tsx watch"

# Start only the services you're actively working on
cd /home/username01/IdeaProjects01/academic-athletics-saas
pnpm dev --filter=@aah/web --filter=@aah/service-user
```

## Verification

After applying the fix, verify it worked:

```bash
# Check new limit
cat /proc/sys/fs/inotify/max_user_watches

# Should show: 524288

# Try running Claude Code again
claude --version
```

## Common Causes in Your Project

1. **Turborepo watching all packages** - Each package in monorepo adds watchers
2. **tsx watch for each service** - You have 7+ services each with hot reload
3. **Multiple MCP servers** - 15+ MCP server instances running
4. **TypeScript servers** - Multiple TS language servers
5. **Node_modules** - Large node_modules directories being watched

## Optimization Tips

1. **Use `.watchmanconfig`** to exclude unnecessary directories
2. **Add `.gitignore` patterns** for node_modules, dist, .turbo
3. **Use `pnpm` filtering** to run only needed services
4. **Stop unused MCP servers** in your Claude/Kiro settings
5. **Consider consolidating duplicate MCP server instances**

## Quick Fix (For Now)

Kill some processes to free up watchers:

```bash
# This will stop the duplicate processes
pkill -f "testsprite-mcp-plugin"
pkill -f "firecrawl-mcp"
pkill -f "playwright-mcp"

# Restart only what you need
pnpm dev
```

Then increase the system limit as shown in Option 1.
