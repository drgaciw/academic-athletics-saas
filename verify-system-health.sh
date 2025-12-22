#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Athletic Academics Hub - System Health Check          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ISSUES=0

# 1. File Watcher Limit
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. File Watcher Limit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CURRENT_LIMIT=$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null)
if [ "$CURRENT_LIMIT" -ge 524288 ]; then
    echo -e "${GREEN}✓${NC} File watcher limit: $CURRENT_LIMIT (Good)"
else
    echo -e "${RED}✗${NC} File watcher limit: $CURRENT_LIMIT (Too low - should be >= 524288)"
    echo "  Fix: sudo sysctl -w fs.inotify.max_user_watches=524288"
    ((ISSUES++))
fi
echo ""

# 2. Environment File
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check for required variables (without showing values)
    if grep -q "^OPENAI_API_KEY=sk-" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} OPENAI_API_KEY is set"
    else
        echo -e "${YELLOW}!${NC} OPENAI_API_KEY may not be set correctly"
        ((ISSUES++))
    fi
    
    if grep -q "^ANTHROPIC_API_KEY=sk-ant-" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} ANTHROPIC_API_KEY is set"
    else
        echo -e "${YELLOW}!${NC} ANTHROPIC_API_KEY may not be set correctly"
        ((ISSUES++))
    fi
    
    if grep -q "^DATABASE_URL=" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} DATABASE_URL is set"
    else
        echo -e "${RED}✗${NC} DATABASE_URL is not set"
        ((ISSUES++))
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    echo "  Fix: cp .env.example .env && edit .env"
    ((ISSUES++))
fi
echo ""

# 3. Running Processes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Running Processes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NODE_PROCESSES=$(ps aux | grep -E "(node|npm|pnpm)" | grep -v grep | wc -l)
TSX_PROCESSES=$(ps aux | grep "tsx watch" | grep -v grep | wc -l)
MCP_PROCESSES=$(ps aux | grep "mcp" | grep -v grep | wc -l)

echo "  Node.js processes: $NODE_PROCESSES"
echo "  tsx watch processes: $TSX_PROCESSES"
echo "  MCP server processes: $MCP_PROCESSES"

if [ "$NODE_PROCESSES" -gt 50 ]; then
    echo -e "${YELLOW}!${NC} High number of Node processes may impact performance"
fi
echo ""

# 4. Node Modules
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules directory exists"
else
    echo -e "${RED}✗${NC} node_modules not found"
    echo "  Fix: pnpm install"
    ((ISSUES++))
fi

if [ -f "pnpm-lock.yaml" ]; then
    echo -e "${GREEN}✓${NC} pnpm-lock.yaml exists"
else
    echo -e "${YELLOW}!${NC} pnpm-lock.yaml not found"
fi
echo ""

# 5. Services Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Service Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service() {
    local PORT=$1
    local NAME=$2
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health 2>/dev/null | grep -q "200"; then
        echo -e "${GREEN}✓${NC} $NAME (port $PORT) is running"
        return 0
    else
        echo -e "${YELLOW}!${NC} $NAME (port $PORT) is not responding"
        return 1
    fi
}

check_service 3000 "Web App"
check_service 3001 "User Service"
check_service 3007 "AI Service"
echo ""

# 6. Git Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Git Repository"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    BRANCH=$(git branch --show-current 2>/dev/null)
    echo "  Current branch: $BRANCH"
    
    UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo "  Uncommitted changes: $UNCOMMITTED files"
    fi
else
    echo -e "${YELLOW}!${NC} Not a git repository"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! System is healthy.${NC}"
else
    echo -e "${YELLOW}! Found $ISSUES issue(s) that need attention.${NC}"
    echo ""
    echo "See FIXES-SUMMARY.md for detailed solutions."
fi
echo ""
