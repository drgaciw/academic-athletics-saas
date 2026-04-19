# Claude Code Agents - Complete Implementation Guide

This guide shows you how to implement **both** the NPM package and GitHub template repository for maximum flexibility.

## 📦 What You're Getting

### Option 1: NPM Package (`npm-package/`)
- Install via `pnpm add -D @your-org/turborepo-claude-agents`
- Automatic updates with `pnpm update`
- Version control
- Works in any project with package.json

### Option 2: GitHub Template (`template-repo/`)
- Click "Use this template" on GitHub
- Manual clone/download
- Full control over customization
- No npm dependency

### Both Options Include:
- ✅ 5 specialized AI agents
- ✅ 5 practical skills
- ✅ Complete documentation
- ✅ Quick reference guide
- ✅ Customization tools

## 🚀 Quick Start

### Setup NPM Package

```bash
cd .claude-exports/npm-package

# 1. Initialize git
git init
git add .
git commit -m "Initial commit"

# 2. Create GitHub repo
gh repo create your-org/turborepo-claude-agents \
  --public \
  --description "Reusable Claude Code agents for Turborepo development"

git remote add origin git@github.com:your-org/turborepo-claude-agents.git
git push -u origin main

# 3. Publish to NPM
npm login
npm publish --access public

# Done! Now anyone can install with:
# pnpm add -D @your-org/turborepo-claude-agents
```

### Setup Template Repository

```bash
cd .claude-exports/template-repo

# 1. Initialize git
git init
git add .
git commit -m "Initial commit"

# 2. Create GitHub repo
gh repo create your-org/turborepo-claude-template \
  --public \
  --description "Template for Claude Code agents in Turborepo projects"

git remote add origin git@github.com:your-org/turborepo-claude-template.git
git push -u origin main

# 3. Enable template feature
gh repo edit your-org/turborepo-claude-template --enable-template

# Done! Now anyone can click "Use this template" on GitHub
```

## 📋 Detailed Setup

### For NPM Package

See `npm-package/PUBLISHING.md` for:
- Publishing to NPM registry
- Publishing to GitHub Packages
- Versioning strategy
- Automated publishing with GitHub Actions
- Testing before publishing

### For Template Repository

See `template-repo/SETUP.md` for:
- Creating the template repo
- Enabling template feature
- Adding topics and descriptions
- Creating releases
- Promoting your template

## 🎯 When to Use Which

### Use NPM Package When:
- ✅ Working with TypeScript/JavaScript projects
- ✅ Want automatic updates via package manager
- ✅ Need version control (lock to specific versions)
- ✅ Building tooling around agents
- ✅ Want programmatic access to agent metadata

### Use Template Repository When:
- ✅ Want one-click project creation
- ✅ Prefer git-based distribution
- ✅ Need full customization before using
- ✅ Working with non-npm projects
- ✅ Want users to have complete control

### Use Both When:
- ✅ You want maximum reach
- ✅ Different teams have different preferences
- ✅ You want flexibility for different use cases

## 📊 Comparison

| Feature | NPM Package | Template Repo |
|---------|-------------|---------------|
| Installation | `pnpm add -D` | Git clone |
| Updates | `pnpm update` | Manual pull |
| Versioning | Semantic versioning | Git tags |
| Customization | After install | Before first use |
| Discovery | NPM registry | GitHub |
| Size | ~500KB | ~500KB |
| Dependencies | Node.js | Git |

## 🔄 Maintenance Strategy

### Keeping Both in Sync

When you update agents:

```bash
# 1. Update source files in main project
cd /home/user/academic-athletics-saas/.claude/agents
vim turborepo-architect.md

# 2. Sync to NPM package
cd ../../.claude-exports/npm-package
cp -r ../../.claude/agents/* agents/
npm version patch
git add .
git commit -m "Update Turborepo Architect agent"
npm publish

# 3. Sync to template repo
cd ../template-repo
cp -r ../../.claude/agents/* agents/
git add .
git commit -m "Update Turborepo Architect agent"
git tag v1.0.1
git push --tags
gh release create v1.0.1 --notes "Updated Turborepo Architect"
```

### Automation Script

Create `sync-exports.sh`:

```bash
#!/bin/bash
# Sync agents from main project to exports

SOURCE_DIR=".claude"
NPM_DIR=".claude-exports/npm-package"
TEMPLATE_DIR=".claude-exports/template-repo"

echo "🔄 Syncing agents to exports..."

# Sync to NPM package
cp -r $SOURCE_DIR/agents/* $NPM_DIR/agents/
cp -r $SOURCE_DIR/skills/*.md $NPM_DIR/skills/
cp $SOURCE_DIR/{README,QUICK_REFERENCE,AGENTS_AND_SKILLS,PORTABILITY_GUIDE}.md $NPM_DIR/

# Sync to template
cp -r $SOURCE_DIR/agents/* $TEMPLATE_DIR/agents/
cp -r $SOURCE_DIR/skills/*.md $TEMPLATE_DIR/skills/
cp $SOURCE_DIR/{README,QUICK_REFERENCE,AGENTS_AND_SKILLS,PORTABILITY_GUIDE}.md $TEMPLATE_DIR/
cp $SOURCE_DIR/export-agents.sh $TEMPLATE_DIR/

echo "✅ Sync complete!"
echo ""
echo "Next steps:"
echo "1. cd .claude-exports/npm-package && npm version patch && npm publish"
echo "2. cd .claude-exports/template-repo && git add . && git commit && git push"
```

## 📝 Recommended Workflow

1. **Develop agents** in your main project (`.claude/`)
2. **Test thoroughly** with real development work
3. **Sync to exports** using script or manually
4. **Publish NPM package** with new version
5. **Update template repo** with new release
6. **Document changes** in both repos
7. **Notify users** (if you have a user base)

## 🎨 Customization Tips

### For NPM Package

**Custom install behavior:**

Edit `npm-package/install.js` to:
- Skip certain files
- Add custom configuration
- Prompt user for preferences
- Generate project-specific templates

**Package.json scripts:**

Add helpful scripts:
```json
{
  "scripts": {
    "update-agents": "node update.js",
    "list-agents": "node -e 'console.log(require(\".\").agents)'",
    "verify": "node verify.js"
  }
}
```

### For Template Repository

**Add starter files:**

```
template-repo/
  ├── .gitignore              # Recommended gitignore
  ├── .vscode/                # VS Code settings
  │   └── settings.json
  └── examples/               # Usage examples
      └── example-workflow.md
```

**Pre-configured settings:**

`.vscode/settings.json`:
```json
{
  "files.associations": {
    "*.md": "markdown"
  },
  "markdown.preview.doubleClickToSwitchToEditor": false
}
```

## 📚 Documentation Best Practices

### Both Should Have:

1. **Clear README** - Quick start in < 2 minutes
2. **Examples** - Real-world usage scenarios
3. **Troubleshooting** - Common issues and solutions
4. **Contributing guide** - How to improve
5. **Changelog** - Version history
6. **License** - MIT recommended

### NPM Package Specific:

- Installation instructions
- API documentation (if programmable)
- Upgrade guide
- Compatibility matrix

### Template Repository Specific:

- Customization guide
- "Use this template" instructions
- Folder structure explanation
- Integration examples

## 🚀 Launch Checklist

### Before Publishing NPM Package:

- [ ] Package name is unique
- [ ] Version is 1.0.0
- [ ] README has clear installation
- [ ] install.js works correctly
- [ ] Tested in a real project
- [ ] No sensitive data in package
- [ ] License file included
- [ ] Repository URL is correct

### Before Publishing Template:

- [ ] Template feature enabled on GitHub
- [ ] README renamed from TEMPLATE_README.md
- [ ] Topics added to repository
- [ ] LICENSE file included
- [ ] export-agents.sh is executable
- [ ] All markdown files are formatted
- [ ] No placeholder text remains
- [ ] Created initial release (v1.0.0)

## 📈 Marketing Your Tools

### NPM Package:

- Submit to [Awesome lists](https://github.com/topics/awesome)
- Post on [dev.to](https://dev.to)
- Share on [Twitter/X](https://twitter.com)
- List on [npm trends](https://npmtrends.com)

### Template Repository:

- Add to [GitHub Collections](https://github.com/collections)
- Submit to awesome-lists
- Blog about it
- Create video tutorial
- Share in communities:
  - r/nextjs
  - r/webdev
  - r/programming
  - Discord communities

## 🆘 Troubleshooting

### NPM Package Issues:

**"Package name already exists"**
- Change package name in package.json
- Use scoped package: `@your-org/name`

**"Installation fails"**
- Test with `npm pack` first
- Check install.js for errors
- Verify file paths are correct

### Template Repository Issues:

**"Template button not showing"**
- Ensure "Template repository" is enabled
- Wait a few minutes for GitHub update
- Try refreshing browser cache

**"Users can't find it"**
- Add topics for discoverability
- Improve README with keywords
- Share link directly

## 🔗 Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Templates](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
- [Semantic Versioning](https://semver.org/)
- [GitHub CLI](https://cli.github.com/)

---

## ✅ You're Ready!

You now have:
1. ✅ **NPM package** ready to publish
2. ✅ **Template repository** ready to share
3. ✅ **Documentation** for both
4. ✅ **Publishing guides** for both
5. ✅ **Maintenance strategy** for both

**Choose your path** (or do both!) and help developers everywhere supercharge their Turborepo workflows! 🚀

---

**Questions?** Open an issue in either repository!
