# Claude Code Development Resources

Welcome to the Claude Code development resources for the Athletic Academics Hub (AAH) Turborepo monorepo!

## 📚 Documentation

### Start Here
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - One-page cheat sheet (print this!)
- **[AGENTS_AND_SKILLS.md](./AGENTS_AND_SKILLS.md)** - Complete guide to agents & skills

### Project Documentation
- **[../CLAUDE.md](../CLAUDE.md)** - Project-specific instructions and patterns

## 🤖 Specialized Agents

Located in `agents/` directory:

1. **[turborepo-architect.md](./agents/turborepo-architect.md)**
   - Monorepo architecture and build optimization
   - Use for: Build performance, caching, workspace dependencies

2. **[nextjs-app-developer.md](./agents/nextjs-app-developer.md)**
   - Next.js 14 App Router development
   - Use for: Pages, API routes, Server Components

3. **[shadcn-component-builder.md](./agents/shadcn-component-builder.md)**
   - Shadcn/UI component design
   - Use for: UI components, design system, accessibility

4. **[service-developer.md](./agents/service-developer.md)**
   - Hono microservice development
   - Use for: Backend services, API endpoints, serverless

5. **[prisma-schema-manager.md](./agents/prisma-schema-manager.md)**
   - Database schema and Prisma ORM
   - Use for: Schema changes, migrations, queries

## 🛠️ Practical Skills

Located in `skills/` directory:

1. **[add-workspace-package.md](./skills/add-workspace-package.md)**
   - Installing dependencies in monorepo workspaces

2. **[create-new-service.md](./skills/create-new-service.md)**
   - Scaffolding new Hono microservices

3. **[shadcn-component-operations.md](./skills/shadcn-component-operations.md)**
   - Adding and customizing Shadcn components

4. **[turborepo-optimization.md](./skills/turborepo-optimization.md)**
   - Build performance and cache management

5. **[debug-build-issues.md](./skills/debug-build-issues.md)**
   - Systematic build troubleshooting

## 🚀 Quick Start

### For New Developers

1. Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (5 min)
2. Skim [AGENTS_AND_SKILLS.md](./AGENTS_AND_SKILLS.md) (10 min)
3. Reference [../CLAUDE.md](../CLAUDE.md) for project patterns
4. Start coding! Ask agents for help when needed

### For Experienced Developers

1. Bookmark [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. Reference agents when facing complex problems
3. Use skills for step-by-step workflows

## 💡 How to Use

### In Your AI Assistant

**Invoke agents:**
```
"I need help from the Turborepo Architect to optimize builds"
"Ask the Next.js App Developer to add a new dashboard"
"Have the Shadcn Component Builder create a StudentCard"
```

**Reference skills:**
```
"Follow the add-workspace-package skill to install React Query"
"Use the debug-build-issues skill - my build is failing"
"Walk me through the create-new-service skill"
```

### In Your IDE

- **VS Code**: Load as workspace docs
- **Cursor**: Use @ mentions for context
- **JetBrains**: Reference in AI assistant
- **GitHub Copilot**: Include in comments

## 📊 Resource Map

```
.claude/
├── README.md (this file)           # Navigation guide
├── QUICK_REFERENCE.md              # Cheat sheet ⭐
├── AGENTS_AND_SKILLS.md            # Complete guide ⭐
│
├── agents/                         # Autonomous problem solvers
│   ├── turborepo-architect.md
│   ├── nextjs-app-developer.md
│   ├── shadcn-component-builder.md
│   ├── service-developer.md
│   └── prisma-schema-manager.md
│
└── skills/                         # Step-by-step guides
    ├── add-workspace-package.md
    ├── create-new-service.md
    ├── shadcn-component-operations.md
    ├── turborepo-optimization.md
    └── debug-build-issues.md
```

## 🎯 Common Scenarios

### "I need to add a new feature"
1. **Prisma Schema Manager** - Design data model
2. **Service Developer** - Build backend
3. **Shadcn Component Builder** - Create UI
4. **Next.js App Developer** - Integrate frontend

### "Builds are slow"
1. **Turborepo Optimization** skill - Analyze
2. **Turborepo Architect** - Fix bottlenecks

### "Build is failing"
1. **Debug Build Issues** skill - Diagnose
2. Relevant agent - Fix root cause

### "Need to add UI component"
1. **Shadcn Component Operations** skill - Add primitive
2. **Shadcn Component Builder** - Customize

## 🔗 External Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Hono Docs](https://hono.dev)

## 📝 Contributing

Found an issue or have a suggestion?
1. Update the relevant agent/skill file
2. Add to AGENTS_AND_SKILLS.md
3. Update this README if needed
4. Test with real scenarios

## 🆘 Need Help?

1. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) first
2. Search relevant agent/skill
3. Reference [../CLAUDE.md](../CLAUDE.md) for project patterns
4. Ask your AI assistant to invoke the appropriate agent

## 📈 Version

**Current Version:** 1.0.0

**Last Updated:** December 2024

---

**Tip:** Keep [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) open while coding! 🚀
