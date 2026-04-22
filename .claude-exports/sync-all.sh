#!/bin/bash
# Sync Claude Code agents from main project to both exports
# Usage: ./sync-all.sh [version]

set -e

VERSION="${1:-patch}"
SOURCE_DIR="../.claude"
NPM_DIR="npm-package"
TEMPLATE_DIR="template-repo"

echo "🔄 Syncing Claude Code agents to exports..."
echo "📁 Source: $SOURCE_DIR"
echo ""

# Check source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Error: Source directory $SOURCE_DIR not found"
  exit 1
fi

# Sync to NPM package
echo "📦 Syncing to NPM package..."
rm -rf $NPM_DIR/agents $NPM_DIR/skills/*.md
cp -r $SOURCE_DIR/agents $NPM_DIR/
mkdir -p $NPM_DIR/skills
cp $SOURCE_DIR/skills/{add-workspace-package,create-new-service,shadcn-component-operations,turborepo-optimization,debug-build-issues}.md $NPM_DIR/skills/
cp $SOURCE_DIR/{README,QUICK_REFERENCE,AGENTS_AND_SKILLS,PORTABILITY_GUIDE}.md $NPM_DIR/
echo "✅ NPM package synced"

# Sync to template repo
echo "🎨 Syncing to template repository..."
rm -rf $TEMPLATE_DIR/agents $TEMPLATE_DIR/skills
cp -r $SOURCE_DIR/agents $TEMPLATE_DIR/
mkdir -p $TEMPLATE_DIR/skills
cp $SOURCE_DIR/skills/{add-workspace-package,create-new-service,shadcn-component-operations,turborepo-optimization,debug-build-issues}.md $TEMPLATE_DIR/skills/
cp $SOURCE_DIR/{README,QUICK_REFERENCE,AGENTS_AND_SKILLS,PORTABILITY_GUIDE}.md $TEMPLATE_DIR/
cp $SOURCE_DIR/export-agents.sh $TEMPLATE_DIR/
chmod +x $TEMPLATE_DIR/export-agents.sh
echo "✅ Template repository synced"

echo ""
echo "✨ Sync complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "NPM Package:"
echo "  cd $NPM_DIR"
echo "  npm version $VERSION"
echo "  git add ."
echo "  git commit -m 'Update agents'"
echo "  npm publish"
echo ""
echo "Template Repository:"
echo "  cd $TEMPLATE_DIR"
echo "  git add ."
echo "  git commit -m 'Update agents'"
echo "  git tag v1.x.x"
echo "  git push --tags"
echo "  gh release create v1.x.x --notes 'Updated agents'"
echo ""
echo "💡 Tip: Run this script whenever you update agents in the main project!"
