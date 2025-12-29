# Claude Code Agents - Export Packages

This directory contains ready-to-publish packages for distributing Claude Code agents across multiple Turborepo projects.

## 📦 What's Inside

### 1. NPM Package (`npm-package/`)

Install via package manager:
```bash
pnpm add -D @your-org/turborepo-claude-agents
```

**Includes:**
- Automatic installation to `.claude/` directory
- Version management with semantic versioning
- Programmatic access to agent metadata
- Update via `pnpm update`

**Ready to publish to:**
- NPM Registry
- GitHub Packages
- Private registries

**Documentation:** `npm-package/PUBLISHING.md`

---

### 2. GitHub Template (`template-repo/`)

One-click repository creation:
- Click "Use this template" on GitHub
- Instant project with agents pre-configured
- Full customization before first commit

**Includes:**
- All agents and skills
- Export script for other projects
- Complete documentation
- Setup examples

**Documentation:** `template-repo/SETUP.md`

---

### 3. Implementation Guide (`IMPLEMENTATION_GUIDE.md`)

Complete guide for setting up and publishing both options.

---

### 4. Sync Script (`sync-all.sh`)

Automated sync from main project to both exports:
```bash
./sync-all.sh [patch|minor|major]
```

## 🚀 Quick Start

### Option 1: Publish NPM Package

```bash
cd npm-package

# Update package name in package.json
vim package.json  # Change @your-org to your actual org

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo
gh repo create your-org/turborepo-claude-agents --public

# Publish to NPM
npm login
npm publish --access public
```

### Option 2: Create Template Repository

```bash
cd template-repo

# Update README
mv TEMPLATE_README.md README.md

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo
gh repo create your-org/turborepo-claude-template --public

# Enable template
gh repo edit your-org/turborepo-claude-template --enable-template
```

### Option 3: Do Both! (Recommended)

Follow both guides above. Maximum flexibility for users!

## 📋 Pre-Publishing Checklist

### NPM Package

- [ ] Updated `package.json` with your org name
- [ ] Updated repository URLs in `package.json`
- [ ] Tested `install.js` in a separate project
- [ ] Reviewed and customized `NPM_README.md`
- [ ] Added `.npmignore` if needed
- [ ] Created GitHub repository
- [ ] Published to NPM or GitHub Packages

### Template Repository

- [ ] Renamed `TEMPLATE_README.md` to `README.md`
- [ ] Updated all placeholder text
- [ ] Made `export-agents.sh` executable
- [ ] Added LICENSE file
- [ ] Created GitHub repository
- [ ] Enabled "Template repository" feature
- [ ] Added repository topics
- [ ] Created initial release (v1.0.0)

## 🔄 Maintenance Workflow

When you update agents in the main project:

```bash
# 1. Sync to both exports
./sync-all.sh

# 2. Publish NPM package
cd npm-package
npm version patch  # or minor/major
npm publish
git add .
git commit -m "Update agents"
git push

# 3. Update template repo
cd ../template-repo
git add .
git commit -m "Update agents"
git tag v1.0.1
git push --tags
gh release create v1.0.1 --notes "Updated agents"

# Done!
```

## 📊 Directory Structure

```
.claude-exports/
├── README.md                      # This file
├── IMPLEMENTATION_GUIDE.md        # Complete setup guide
├── sync-all.sh                    # Sync script
│
├── npm-package/                   # NPM package
│   ├── package.json
│   ├── install.js                 # Postinstall script
│   ├── index.js                   # Package entry
│   ├── NPM_README.md              # NPM-specific README
│   ├── PUBLISHING.md              # Publishing guide
│   ├── agents/                    # 5 agents
│   ├── skills/                    # 5 skills
│   └── *.md                       # Documentation
│
└── template-repo/                 # GitHub template
    ├── TEMPLATE_README.md         # Rename to README.md
    ├── SETUP.md                   # Setup guide
    ├── export-agents.sh           # Export helper
    ├── agents/                    # 5 agents
    ├── skills/                    # 5 skills
    └── *.md                       # Documentation
```

## 💡 Usage Comparison

| Feature | NPM Package | Template Repo |
|---------|-------------|---------------|
| **Installation** | `pnpm add -D` | Git clone or "Use template" |
| **Updates** | `pnpm update` | Manual pull or re-download |
| **Versioning** | Semantic versioning | Git tags |
| **Customization** | After installation | Before first use |
| **Best For** | Automated workflows | Manual setup |
| **Discovery** | NPM search | GitHub search |
| **Dependencies** | Node.js required | Git only |

## 🎯 When to Use Which

### Use NPM Package When:
- Building TypeScript/JavaScript projects
- Want automatic updates
- Need version locking
- Prefer package managers

### Use Template Repository When:
- Starting new projects
- Want full control upfront
- Prefer git-based workflow
- No Node.js available

### Use Both When:
- You want maximum reach
- Different teams prefer different methods
- You want flexibility

## 📚 Resources

- **NPM Publishing:** `npm-package/PUBLISHING.md`
- **Template Setup:** `template-repo/SETUP.md`
- **Complete Guide:** `IMPLEMENTATION_GUIDE.md`
- **Sync Script:** `sync-all.sh`

## 🆘 Support

Each package has its own documentation:
- NPM package questions → See `npm-package/PUBLISHING.md`
- Template repo questions → See `template-repo/SETUP.md`
- General questions → See `IMPLEMENTATION_GUIDE.md`

## 🚀 Next Steps

1. **Choose your distribution method** (NPM, template, or both)
2. **Customize** package names and metadata
3. **Publish** following the relevant guide
4. **Share** with your team or the community!

---

**Ready to share your Claude Code agents with the world? Let's go! 🎉**
