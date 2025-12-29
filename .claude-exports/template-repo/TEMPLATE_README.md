# Turborepo Claude Code Agents Template

> 🤖 Pre-configured Claude Code agents and skills for Turborepo + Next.js + Shadcn development

This template provides a complete set of AI agents and skills to supercharge your Turborepo development workflow.

## 🚀 Quick Start

### Option 1: GitHub Template (Recommended)

1. Click **"Use this template"** button above
2. Create your new Turborepo project
3. Agents and skills are ready to use!

### Option 2: Clone into Existing Project

```bash
# Navigate to your Turborepo project
cd your-turborepo-project

# Clone template as .claude directory
git clone https://github.com/your-org/turborepo-claude-template.git .claude

# Remove git history (optional)
rm -rf .claude/.git

# Customize for your project
./claude/export-agents.sh . @your-org
```

### Option 3: Manual Copy

```bash
# Download as ZIP
# Extract to your-project/.claude/

# Or use wget
cd your-turborepo
wget https://github.com/your-org/turborepo-claude-template/archive/main.zip
unzip main.zip -d .claude
```

## ✨ What's Included

This template contains:

### 🤖 5 Specialized AI Agents

- **Turborepo Architect** - Optimize builds, manage cache, fix dependencies
- **Next.js App Developer** - Build App Router pages, API routes, Server Components
- **Shadcn Component Builder** - Create and customize UI components
- **Service Developer** - Scaffold Hono microservices and APIs
- **Prisma Schema Manager** - Design schemas, create migrations, optimize queries

### 🛠️ 5 Practical Skills

- **Add Workspace Package** - Install dependencies correctly in monorepo
- **Create New Service** - Complete Hono service scaffolding
- **Shadcn Component Operations** - Add and customize Shadcn components
- **Turborepo Optimization** - Speed up builds and manage cache
- **Debug Build Issues** - Systematic troubleshooting guide

### 📚 Complete Documentation

- **QUICK_REFERENCE.md** - One-page cheat sheet ⭐
- **AGENTS_AND_SKILLS.md** - Complete guide with examples
- **PORTABILITY_GUIDE.md** - Use across multiple projects
- **README.md** - Getting started guide

### 🔧 Helper Scripts

- **export-agents.sh** - Export to other projects

## 💡 Usage

### In Your AI Assistant

Once installed, reference agents by name:

```
"Use the Turborepo Architect to optimize build performance"
"Ask the Next.js App Developer to create a dashboard page"
"Follow the debug-build-issues skill"
```

### Direct Access

All files are markdown - read them anytime:

```bash
cat QUICK_REFERENCE.md       # Your cheat sheet
ls agents/                   # Browse agents
ls skills/                   # Browse skills
```

## 🎨 Customizing for Your Project

After cloning, update these for your specific setup:

### 1. Workspace Names

```bash
# Replace @aah with your organization name
find . -name "*.md" -exec sed -i 's/@aah/@yourorg/g' {} +
```

### 2. Project Context

Edit `QUICK_REFERENCE.md` to update:
- Your app names and ports
- Your tech stack specifics
- Your custom commands
- Your team conventions

### 3. Critical Rules

Update the "Critical Rules" section with your project's requirements:
- Package manager (pnpm, npm, yarn)
- Build commands
- Database setup
- Authentication methods

## 📖 Example Workflows

### Building a New Feature

1. **Prisma Schema Manager** → Design data model
2. **Service Developer** → Create backend API
3. **Shadcn Component Builder** → Build UI
4. **Next.js App Developer** → Integrate frontend

### Optimizing Performance

1. **Turborepo Optimization** skill → Analyze builds
2. **Turborepo Architect** → Fix bottlenecks
3. Verify improvements

### Debugging Failures

1. **Debug Build Issues** skill → Diagnose
2. Relevant agent → Apply fix
3. Test and verify

## 📦 File Structure

```
.
├── README.md                    # This file
├── QUICK_REFERENCE.md           # One-page cheat sheet ⭐
├── AGENTS_AND_SKILLS.md         # Complete guide
├── PORTABILITY_GUIDE.md         # Multi-project usage
├── export-agents.sh             # Export helper
├── agents/                      # 5 specialized agents
│   ├── turborepo-architect.md
│   ├── nextjs-app-developer.md
│   ├── shadcn-component-builder.md
│   ├── service-developer.md
│   └── prisma-schema-manager.md
└── skills/                      # 5 practical skills
    ├── add-workspace-package.md
    ├── create-new-service.md
    ├── shadcn-component-operations.md
    ├── turborepo-optimization.md
    └── debug-build-issues.md
```

## 🔄 Keeping Up to Date

```bash
# If you kept git history
git pull origin main

# Or re-download template
cd your-project
rm -rf .claude
git clone https://github.com/your-org/turborepo-claude-template.git .claude
```

## 🎯 IDE Compatibility

These agents work in:
- ✅ VS Code
- ✅ Cursor
- ✅ JetBrains IDEs
- ✅ GitHub Copilot
- ✅ Claude Code
- ✅ Any AI coding assistant

## 🤝 Contributing

Improvements welcome!

1. Fork this template
2. Add your enhancements
3. Submit a pull request
4. Share with the community

## 🆘 Support

- [Documentation](https://github.com/your-org/turborepo-claude-template#readme)
- [Issues](https://github.com/your-org/turborepo-claude-template/issues)
- [Discussions](https://github.com/your-org/turborepo-claude-template/discussions)

## 📄 License

MIT - Use freely in your projects

## 🌟 Related

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [Claude Code](https://claude.ai/code)

---

**Happy coding with AI! 🚀**

⭐ Star this template if it helps your workflow!
