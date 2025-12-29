# @your-org/turborepo-claude-agents

> Reusable Claude Code agents and skills for Turborepo + Next.js + Shadcn development

Supercharge your Turborepo development with specialized AI agents and step-by-step skills for monorepo management, Next.js development, Shadcn components, microservices, and database operations.

## 🚀 Quick Start

```bash
# Install in your Turborepo project
pnpm add -D @your-org/turborepo-claude-agents

# Agents automatically install to .claude/ directory
# Start using immediately!
```

## ✨ What's Included

### 🤖 5 Specialized Agents

1. **Turborepo Architect** - Build optimization, caching, workspace dependencies
2. **Next.js App Developer** - App Router, Server Components, API routes
3. **Shadcn Component Builder** - UI components, design systems, accessibility
4. **Service Developer** - Hono microservices, API design, serverless
5. **Prisma Schema Manager** - Database schema, migrations, query optimization

### 🛠️ 5 Practical Skills

1. **Add Workspace Package** - Install dependencies in monorepo workspaces
2. **Create New Service** - Scaffold complete Hono microservices
3. **Shadcn Component Operations** - Add and customize UI components
4. **Turborepo Optimization** - Build performance and cache management
5. **Debug Build Issues** - Systematic troubleshooting workflows

### 📚 Complete Documentation

- **QUICK_REFERENCE.md** - One-page cheat sheet (print this!)
- **AGENTS_AND_SKILLS.md** - Comprehensive guide with examples
- **PORTABILITY_GUIDE.md** - Multi-project strategies
- **README.md** - Getting started guide

## 💡 Usage

### In Your AI Assistant

```
"Use the Turborepo Architect to optimize our build pipeline"
"Have the Next.js App Developer create a dashboard page"
"Follow the debug-build-issues skill - build is failing"
```

### Direct Access

All files are in your project's `.claude/` directory:

```bash
cat .claude/QUICK_REFERENCE.md    # Your cheat sheet
ls .claude/agents/                # Browse agents
ls .claude/skills/                # Browse skills
```

## 📖 Example Workflows

### Adding a New Feature

1. **Prisma Schema Manager** → Update database schema
2. **Service Developer** → Create backend service
3. **Shadcn Component Builder** → Build UI components
4. **Next.js App Developer** → Integrate in app

### Fixing Build Errors

1. **Debug Build Issues** skill → Diagnose error
2. **Turborepo Architect** → Fix build pipeline
3. **Turborepo Optimization** → Verify performance

### Creating Custom Components

1. **Shadcn Component Operations** skill → Add primitives
2. **Shadcn Component Builder** → Create custom components
3. **Next.js App Developer** → Use in application

## 🎨 Customization

After installation, customize for your project:

```bash
# Update workspace names
find .claude -name "*.md" -exec sed -i 's/@aah/@yourorg/g' {} +

# Update project-specific context
vim .claude/QUICK_REFERENCE.md
vim .claude/agents/turborepo-architect.md
```

## 🔄 Updates

```bash
# Get latest agents
pnpm update @your-org/turborepo-claude-agents

# Agents automatically update in .claude/
```

## 📦 What Gets Installed

```
.claude/
├── README.md                    # Getting started
├── QUICK_REFERENCE.md           # Cheat sheet ⭐
├── AGENTS_AND_SKILLS.md         # Complete guide
├── PORTABILITY_GUIDE.md         # Multi-project usage
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

## 🔧 Requirements

- Node.js >= 18.0.0
- Turborepo monorepo
- pnpm (recommended)

**Works with:**
- Next.js 14+ (App Router)
- Shadcn/UI
- Prisma ORM
- Hono framework
- Any AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.)

## 🎯 IDE Compatibility

These are IDE-agnostic markdown files that work across:
- ✅ VS Code
- ✅ Cursor
- ✅ JetBrains IDEs (WebStorm, IntelliJ, etc.)
- ✅ GitHub Copilot
- ✅ Claude Code (CLI and web)
- ✅ Any text editor with AI assistant

## 🤝 Contributing

Found an issue or have a suggestion?

1. Open an issue on GitHub
2. Submit a PR with improvements
3. Share your custom agents with the community

## 📄 License

MIT

## 🔗 Links

- [GitHub Repository](https://github.com/your-org/turborepo-claude-agents)
- [Documentation](https://github.com/your-org/turborepo-claude-agents#readme)
- [Issues](https://github.com/your-org/turborepo-claude-agents/issues)

## 🎓 Learn More

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Hono Docs](https://hono.dev)

---

**Made with ❤️ for Turborepo developers**

⭐ Star on GitHub if this helps your workflow!
