# Publishing Guide - NPM Package

This guide shows how to publish `@your-org/turborepo-claude-agents` to NPM or GitHub Packages.

## 📋 Prerequisites

- Node.js >= 18.0.0
- NPM account (for NPM registry) or GitHub account (for GitHub Packages)
- Repository on GitHub

## 🚀 Setup

### Step 1: Update Package Information

Edit `package.json`:

```json
{
  "name": "@your-org/turborepo-claude-agents",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR-ORG/turborepo-claude-agents.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR-ORG/turborepo-claude-agents/issues"
  },
  "homepage": "https://github.com/YOUR-ORG/turborepo-claude-agents#readme",
  "author": "YOUR NAME"
}
```

### Step 2: Create GitHub Repository

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub
gh repo create your-org/turborepo-claude-agents --public --source=.

# Push
git push -u origin main
```

## 📦 Publishing to NPM

### Option A: Public NPM Registry

1. **Login to NPM:**
   ```bash
   npm login
   ```

2. **Test the package:**
   ```bash
   npm pack
   # Review the generated .tgz file
   ```

3. **Publish:**
   ```bash
   npm publish --access public
   ```

4. **Verify:**
   ```bash
   npm view @your-org/turborepo-claude-agents
   ```

### Option B: GitHub Packages

1. **Create `.npmrc` in package root:**
   ```
   @your-org:registry=https://npm.pkg.github.com
   ```

2. **Update `package.json`:**
   ```json
   {
     "publishConfig": {
       "registry": "https://npm.pkg.github.com"
     }
   }
   ```

3. **Authenticate with GitHub:**
   ```bash
   # Create a Personal Access Token (PAT) with `write:packages` scope
   # Then login
   npm login --registry=https://npm.pkg.github.com
   ```

4. **Publish:**
   ```bash
   npm publish
   ```

## 🔄 Updating the Package

### Versioning

Follow semantic versioning:

```bash
# Patch release (bug fixes)
npm version patch
npm publish

# Minor release (new features, backward compatible)
npm version minor
npm publish

# Major release (breaking changes)
npm version major
npm publish
```

### Update Workflow

1. Make changes to agents/skills
2. Test locally:
   ```bash
   # Test in a separate project
   cd /path/to/test-project
   pnpm add file:/path/to/turborepo-claude-agents
   ```
3. Update version
4. Commit changes
5. Publish
6. Create git tag:
   ```bash
   git tag v1.0.1
   git push --tags
   ```

## 🔒 Security

### .npmignore

Create `.npmignore` to exclude files:

```
.git
.github
node_modules
*.log
.DS_Store
PUBLISHING.md
```

### Publishing Checklist

Before publishing:

- [ ] All tests pass
- [ ] README is up to date
- [ ] Version number is correct
- [ ] CHANGELOG is updated
- [ ] No sensitive data in package
- [ ] Package.json metadata is correct
- [ ] License is included

## 🤖 Automated Publishing (GitHub Actions)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-gpr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 📊 Usage Analytics

Track usage with NPM stats:

```bash
# View download stats
npm view @your-org/turborepo-claude-agents

# Or use npm-stat.com
# https://npm-stat.com/charts.html?package=@your-org/turborepo-claude-agents
```

## 🆘 Troubleshooting

### "Package name already exists"

Change package name in `package.json` to something unique.

### "Unauthorized"

Re-login to NPM:
```bash
npm logout
npm login
```

### "Package not found after publishing"

Wait a few minutes - NPM registry needs time to update.

### "Error: 402 Payment Required"

Your package name may require a paid NPM account. Use a scoped package (@your-org) or rename.

## 🔗 Resources

- [NPM Publishing Docs](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Packages Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Semantic Versioning](https://semver.org/)

---

**Ready to publish? Good luck! 🚀**
