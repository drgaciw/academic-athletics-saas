#!/bin/bash

echo "=== File Watcher Quick Fix ==="
echo ""

# Check current limit
CURRENT_LIMIT=$(cat /proc/sys/fs/inotify/max_user_watches)
echo "Current file watcher limit: $CURRENT_LIMIT"

# Count running Node processes
NODE_PROCESSES=$(ps aux | grep -E "(node|npm|pnpm)" | grep -v grep | wc -l)
echo "Running Node.js processes: $NODE_PROCESSES"

echo ""
echo "Killing duplicate MCP server instances..."

# Kill duplicate processes
pkill -f "testsprite-mcp-plugin" 2>/dev/null && echo "  ✓ Killed testsprite-mcp instances"
pkill -f "playwright-mcp" 2>/dev/null && echo "  ✓ Killed playwright-mcp instances"
pkill -f "firecrawl-mcp" 2>/dev/null && echo "  ✓ Killed firecrawl-mcp instances"
pkill -f "sequential-thinking" 2>/dev/null && echo "  ✓ Killed sequential-thinking instances"

echo ""
echo "=== Next Steps ==="
echo "1. Increase system limit (requires sudo):"
echo "   sudo sysctl -w fs.inotify.max_user_watches=524288"
echo ""
echo "2. Make it permanent:"
echo "   echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.d/99-increase-watchers.conf"
echo ""
echo "3. Restart your development server:"
echo "   pnpm dev"
echo ""
echo "See fix-file-watchers.md for detailed documentation"
