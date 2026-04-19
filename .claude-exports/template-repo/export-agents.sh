#!/bin/bash
# Export Claude Code agents to another Turborepo project
# Usage: ./export-agents.sh /path/to/target/project [@your-org]

set -e

TARGET_DIR="${1:-.}"
ORG_NAME="${2:-@aah}"

if [ "$TARGET_DIR" = "." ]; then
  echo "❌ Error: Please provide target directory"
  echo "Usage: ./export-agents.sh /path/to/target/project [@your-org]"
  exit 1
fi

echo "🚀 Exporting Claude Code agents..."
echo "📁 Target: $TARGET_DIR"
echo "🏢 Organization: $ORG_NAME"
echo ""

# Create target directory structure
mkdir -p "$TARGET_DIR/.claude"/{agents,skills}

# Copy agents
echo "📋 Copying agents..."
cp -r agents/*.md "$TARGET_DIR/.claude/agents/"

# Copy skills
echo "🛠️  Copying skills..."
cp add-workspace-package.md "$TARGET_DIR/.claude/skills/"
cp create-new-service.md "$TARGET_DIR/.claude/skills/"
cp shadcn-component-operations.md "$TARGET_DIR/.claude/skills/"
cp turborepo-optimization.md "$TARGET_DIR/.claude/skills/"
cp debug-build-issues.md "$TARGET_DIR/.claude/skills/"

# Copy documentation
echo "📚 Copying documentation..."
cp README.md "$TARGET_DIR/.claude/"
cp QUICK_REFERENCE.md "$TARGET_DIR/.claude/"
cp AGENTS_AND_SKILLS.md "$TARGET_DIR/.claude/"
cp PORTABILITY_GUIDE.md "$TARGET_DIR/.claude/"

# Replace organization name if different
if [ "$ORG_NAME" != "@aah" ]; then
  echo "🔄 Replacing @aah with $ORG_NAME..."
  find "$TARGET_DIR/.claude" -type f -name "*.md" \
    -exec sed -i "s/@aah/$ORG_NAME/g" {} +
fi

echo ""
echo "✅ Export complete!"
echo ""
echo "📝 Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. Review .claude/QUICK_REFERENCE.md"
echo "3. Customize workspace names if needed"
echo "4. Update project-specific context in agents"
echo ""
echo "💡 See .claude/PORTABILITY_GUIDE.md for detailed instructions"
