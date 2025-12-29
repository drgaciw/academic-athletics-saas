# Using Claude Code Agents Across Multiple Turborepo Projects

This guide shows you how to reuse these agents and skills in other Turborepo projects.

## 🎯 Quick Portability Options

### Option 1: Copy to New Project (Simplest)

```bash
# From your new Turborepo project root
mkdir -p .claude/{agents,skills}

# Copy all agents and skills
cp -r /path/to/academic-athletics-saas/.claude/* .claude/

# Customize for your project
vim .claude/QUICK_REFERENCE.md  # Update workspace names
```

**Pros:**
- ✅ Instant setup
- ✅ Full control per project
- ✅ Can customize for each codebase

**Cons:**
- ❌ Updates require manual sync
- ❌ Duplicates content

---

### Option 2: Create Shared NPM Package (Best for Multiple Projects)

Create a reusable package with your agents:

#### Step 1: Create Package

```bash
mkdir turborepo-claude-agents
cd turborepo-claude-agents

cat > package.json << 'EOF'
{
  "name": "@your-org/turborepo-claude-agents",
  "version": "1.0.0",
  "description": "Reusable Claude Code agents for Turborepo development",
  "main": "index.js",
  "files": [
    "agents/",
    "skills/",
    "*.md"
  ],
  "scripts": {
    "install-agents": "node install.js"
  }
}
EOF
```

#### Step 2: Add Install Script

```javascript
// install.js
const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), '../../.claude');

// Copy agents and skills to consuming project
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

['agents', 'skills'].forEach(dir => {
  fs.cpSync(
    path.join(__dirname, dir),
    path.join(targetDir, dir),
    { recursive: true }
  );
});

// Copy markdown docs
['README.md', 'QUICK_REFERENCE.md', 'AGENTS_AND_SKILLS.md'].forEach(file => {
  fs.copyFileSync(
    path.join(__dirname, file),
    path.join(targetDir, file)
  );
});

console.log('✅ Claude Code agents installed to .claude/');
```

#### Step 3: Copy Your Agents

```bash
cp -r ../academic-athletics-saas/.claude/{agents,skills,*.md} .
```

#### Step 4: Publish

```bash
# Option A: NPM Registry
npm publish

# Option B: Private GitHub Package
npm publish --registry=https://npm.pkg.github.com/

# Option C: Local file reference
# Just reference in package.json
```

#### Step 5: Use in Any Project

```bash
# In your new Turborepo project
pnpm add -D @your-org/turborepo-claude-agents

# Or with local path
pnpm add -D file:../turborepo-claude-agents
```

---

### Option 3: Git Submodule (For Git-Based Teams)

```bash
# In your new Turborepo project
git submodule add https://github.com/your-org/claude-agents .claude

# Initialize and update
git submodule update --init --recursive

# Pull latest changes
git submodule update --remote
```

**Pros:**
- ✅ Single source of truth
- ✅ Easy to update all projects
- ✅ Version controlled

**Cons:**
- ❌ Requires Git knowledge
- ❌ Extra setup steps

---

### Option 4: Template Repository (GitHub)

1. **Create Template Repo:**
   ```bash
   # Create new repo with just .claude/
   mkdir turborepo-claude-template
   cd turborepo-claude-template
   git init

   # Copy .claude directory
   cp -r ../academic-athletics-saas/.claude .

   # Add README
   cat > README.md << 'EOF'
   # Turborepo Claude Code Template

   Clone this template to add Claude Code agents to your Turborepo project.

   ## Usage
   1. Click "Use this template" on GitHub
   2. Clone to your project's .claude directory
   3. Customize for your workspace names
   EOF

   git add .
   git commit -m "Initial template"
   git remote add origin git@github.com:your-org/turborepo-claude-template.git
   git push -u origin main
   ```

2. **Mark as Template on GitHub:**
   - Go to repo Settings
   - Check "Template repository"

3. **Use in New Projects:**
   ```bash
   # Clone into new project
   cd my-new-turborepo
   git clone git@github.com:your-org/turborepo-claude-template.git .claude

   # Remove git history
   rm -rf .claude/.git
   ```

---

## 🔧 Customizing for Different Projects

When copying to a new project, update these references:

### 1. Workspace Names

Find and replace:
- `@aah/main` → `@your-org/app-name`
- `@aah/database` → `@your-org/database`
- `@aah/service-*` → `@your-org/service-*`

```bash
# Bulk replace in all files
find .claude -type f -name "*.md" -exec sed -i 's/@aah/@your-org/g' {} +
```

### 2. Project-Specific Context

Update in each agent:
- Tech stack (if different)
- Build commands
- Port numbers
- Database providers
- Authentication methods

Example:
```bash
# In .claude/agents/nextjs-app-developer.md
# Change:
- `apps/main` (Port 3000)
# To:
- `apps/web` (Port 3001)
```

### 3. Critical Rules Section

Update `.claude/QUICK_REFERENCE.md` with your project's critical rules:

```markdown
## 💡 Critical Rules

### ✅ DO
- Use `pnpm` (never npm or yarn)
- Run `pnpm db:generate` after schema changes
- Import from: `@your-org/ui`, `@your-org/database`
```

---

## 📋 Automation Scripts

### Auto-Setup Script

Create this in your new project:

```bash
#!/bin/bash
# setup-claude-agents.sh

REPO_URL="https://raw.githubusercontent.com/your-org/turborepo-claude-template/main"

mkdir -p .claude/{agents,skills}

# Download agents
for agent in turborepo-architect nextjs-app-developer shadcn-component-builder service-developer prisma-schema-manager; do
  curl -o ".claude/agents/${agent}.md" \
    "${REPO_URL}/agents/${agent}.md"
done

# Download skills
for skill in add-workspace-package create-new-service shadcn-component-operations turborepo-optimization debug-build-issues; do
  curl -o ".claude/skills/${skill}.md" \
    "${REPO_URL}/skills/${skill}.md"
done

# Download docs
curl -o ".claude/README.md" "${REPO_URL}/README.md"
curl -o ".claude/QUICK_REFERENCE.md" "${REPO_URL}/QUICK_REFERENCE.md"
curl -o ".claude/AGENTS_AND_SKILLS.md" "${REPO_URL}/AGENTS_AND_SKILLS.md"

echo "✅ Claude Code agents installed!"
echo "📝 Customize .claude/QUICK_REFERENCE.md for your project"
```

Run in new project:
```bash
chmod +x setup-claude-agents.sh
./setup-claude-agents.sh
```

---

## 🎨 Creating Generic Versions

Make agents more generic for any Turborepo:

### Before (Project-Specific):
```markdown
**3 Next.js apps in this monorepo:**
- `apps/main` - Main application (@aah/main) - Port 3000
- `apps/student` - Student portal (@aah/student)
- `apps/admin` - Admin dashboard (@aah/admin)
```

### After (Generic):
```markdown
**Next.js apps in your monorepo:**
- List your apps here with their workspace names
- Note their ports and purposes
- Update commands in QUICK_REFERENCE.md accordingly
```

### Template Variables

Use placeholders:
```markdown
# Replace these in your project:
- `{{ORG_NAME}}` → Your organization/project name
- `{{APP_NAMES}}` → Your app workspace names
- `{{PORTS}}` → Your dev server ports
- `{{DATABASE}}` → Your database provider
```

Then use sed to replace:
```bash
sed -i 's/{{ORG_NAME}}/@mycompany/g' .claude/**/*.md
sed -i 's/{{DATABASE}}/MySQL/g' .claude/**/*.md
```

---

## 🔄 Keeping Agents Updated

### Strategy 1: Manual Updates
```bash
# Periodically sync from source
cd ~/turborepo-claude-agents
git pull origin main

# Copy to projects
for project in project1 project2 project3; do
  cp -r agents skills *.md ~/projects/$project/.claude/
done
```

### Strategy 2: Automated Updates (NPM)
```bash
# Update package
cd ~/turborepo-claude-agents
npm version patch
npm publish

# Update in projects
cd ~/projects/my-project
pnpm update @your-org/turborepo-claude-agents
```

### Strategy 3: CI/CD Integration
```yaml
# .github/workflows/update-agents.yml
name: Update Claude Agents
on:
  repository_dispatch:
    types: [update-agents]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Download latest agents
        run: |
          curl -L https://github.com/your-org/agents/archive/main.zip -o agents.zip
          unzip -o agents.zip -d .claude/
      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          title: "Update Claude Code agents"
```

---

## 📚 Best Practices

### 1. Version Your Agents

Use semantic versioning:
```
v1.0.0 - Initial agents for Turborepo + Next.js + Shadcn
v1.1.0 - Added Remix support
v2.0.0 - Breaking: Updated for Turborepo 2.0
```

### 2. Document Customizations

Create `.claude/CUSTOMIZATIONS.md`:
```markdown
# Project-Specific Customizations

This project uses:
- PostgreSQL (not SQLite)
- Ports: 3000 (main), 3001 (admin)
- Extra packages: @tanstack/react-query
- Custom build: uses Vite for packages

## Modified Files
- `agents/nextjs-app-developer.md` - Updated ports
- `QUICK_REFERENCE.md` - Added React Query commands
```

### 3. Create Project Template

Combine your Turborepo scaffold with agents:
```bash
npx create-turbo@latest
cd my-turborepo
curl -L https://github.com/org/agents/archive/main.zip | tar -xz
mv claude-agents-main .claude
```

---

## 🎯 Recommended Approach

**For 1-2 projects:** Copy `.claude/` directly ✅

**For 3-10 projects:** Create NPM package 📦

**For 10+ projects or teams:** Template repo + automation 🤖

---

## 📖 Examples

### Example 1: New E-commerce Turborepo

```bash
# 1. Create new project
npx create-turbo@latest my-ecommerce

# 2. Copy agents
cd my-ecommerce
cp -r ~/academic-athletics-saas/.claude .

# 3. Customize
sed -i 's/@aah/@ecommerce/g' .claude/**/*.md
sed -i 's/NCAA/E-commerce/g' .claude/**/*.md

# 4. Update workspace names in QUICK_REFERENCE.md
vim .claude/QUICK_REFERENCE.md
```

### Example 2: SaaS Dashboard Turborepo

```bash
# 1. Install from NPM package
pnpm add -D @your-org/turborepo-claude-agents

# 2. Run install script
pnpm run install-agents

# 3. Agents now in .claude/
# 4. Start using immediately!
```

---

## 🆘 Troubleshooting

**Q: Agents reference wrong workspace names**
```bash
# Find and replace
find .claude -name "*.md" -exec sed -i 's/old-name/new-name/g' {} +
```

**Q: Want to add custom agents**
```bash
# Just add to .claude/agents/
cp my-custom-agent.md .claude/agents/

# Update AGENTS_AND_SKILLS.md to list it
```

**Q: How to share with team?**
```bash
# Commit to project
git add .claude/
git commit -m "Add Claude Code agents"
git push

# Team members pull and use immediately
```

---

## 🚀 Next Steps

1. **Choose your portability strategy** (copy, NPM, submodule, template)
2. **Customize for your first project**
3. **Document your customizations**
4. **Share with your team**
5. **Iterate and improve agents over time**

Remember: These are living documents - update them as you learn what works best for your team! 🎉
