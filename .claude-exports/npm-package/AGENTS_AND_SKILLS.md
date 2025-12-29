# Claude Code Agents & Skills for Turborepo Monorepo

This directory contains specialized AI agents and skills designed to accelerate development in the Athletic Academics Hub (AAH) Turborepo monorepo with Next.js and Shadcn/UI.

## Table of Contents

- [Overview](#overview)
- [Agents](#agents)
- [Skills](#skills)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Cross-IDE Compatibility](#cross-ide-compatibility)
- [Contributing](#contributing)

---

## Overview

### What are Agents?

**Agents** are autonomous AI assistants specialized for specific domains. They work independently to solve complex, multi-step problems. Invoke agents when you need deep expertise in a particular area.

### What are Skills?

**Skills** are focused capabilities that can be invoked during a conversation. They provide step-by-step guidance for specific tasks. Use skills when you need a guided workflow.

### Project Context

This monorepo contains:
- **3 Next.js apps:** `@aah/main`, `@aah/student`, `@aah/admin`
- **7 Hono services:** `@aah/service-{user,advising,compliance,ai,support,monitoring,integration}`
- **6 shared packages:** `@aah/{database,ui,auth,ai,api-utils,ai-evals}`

**Tech Stack:**
- Turborepo with pnpm workspaces
- Next.js 14 App Router
- Shadcn/UI components
- Prisma ORM with Vercel Postgres
- Clerk authentication
- Vercel AI SDK

---

## Agents

### 1. Turborepo Architect (`agents/turborepo-architect.md`)

**Expertise:** Monorepo architecture, build optimization, caching, task orchestration

**When to use:**
- Optimizing build performance
- Debugging build pipeline issues
- Configuring task dependencies
- Managing workspace dependencies
- Analyzing build bottlenecks

**Example invocation:**
> "I need help optimizing our Turborepo build pipeline. Builds are taking too long."

**What it does:**
- Analyzes `turbo.json` configuration
- Identifies build bottlenecks
- Recommends caching strategies
- Fixes circular dependencies
- Optimizes task parallelization

---

### 2. Next.js App Developer (`agents/nextjs-app-developer.md`)

**Expertise:** Next.js 14 App Router, React Server Components, API routes, authentication

**When to use:**
- Building new Next.js features
- Implementing App Router pages
- Creating API routes
- Debugging client/server boundaries
- Integrating Clerk authentication

**Example invocation:**
> "Add a new dashboard page with data fetching using Server Components."

**What it does:**
- Creates App Router pages and layouts
- Implements data fetching patterns
- Handles client/server component boundaries
- Integrates authentication
- Follows Next.js 14 best practices

---

### 3. Shadcn Component Builder (`agents/shadcn-component-builder.md`)

**Expertise:** Shadcn/UI, Radix UI, component design, accessibility, theming

**When to use:**
- Adding Shadcn primitives
- Creating custom components
- Building design systems
- Implementing responsive layouts
- Ensuring accessibility

**Example invocation:**
> "Create a StudentCard component using Shadcn that shows eligibility status."

**What it does:**
- Adds Shadcn components to UI package
- Creates custom domain components
- Ensures accessibility compliance
- Implements responsive design
- Manages component exports

---

### 4. Service Developer (`agents/service-developer.md`)

**Expertise:** Hono framework, microservices, API design, serverless functions

**When to use:**
- Creating new backend services
- Building API endpoints
- Implementing business logic
- Designing microservice architecture
- Debugging service issues

**Example invocation:**
> "Create a new compliance service for tracking student eligibility."

**What it does:**
- Scaffolds Hono services
- Creates RESTful endpoints
- Implements authentication middleware
- Designs database operations
- Configures serverless deployment

---

### 5. Prisma Schema Manager (`agents/prisma-schema-manager.md`)

**Expertise:** Database design, Prisma ORM, migrations, query optimization

**When to use:**
- Modifying database schema
- Creating migrations
- Optimizing queries
- Fixing relation issues
- Understanding data models

**Example invocation:**
> "Add a new ComplianceViolation model that relates to StudentProfile."

**What it does:**
- Designs Prisma schemas
- Creates migrations
- Optimizes database queries
- Ensures data integrity
- Follows NCAA compliance patterns

---

## Skills

### 1. Add Workspace Package (`skills/add-workspace-package.md`)

**Purpose:** Add dependencies to specific workspaces in the monorepo

**Usage:**
```bash
# Add to specific app
pnpm add <package> --filter @aah/main

# Add to service
pnpm add <package> --filter @aah/service-user

# Add dev dependency to root
pnpm add -D <package> -w
```

**When to use:**
- Installing new packages
- Adding workspace dependencies
- Managing dev dependencies

---

### 2. Create New Service (`skills/create-new-service.md`)

**Purpose:** Scaffold a complete Hono microservice

**Includes:**
- Directory structure
- Hono app boilerplate
- Authentication middleware
- Error handling
- Build configuration

**When to use:**
- Creating new backend services
- Following service conventions
- Ensuring consistent architecture

---

### 3. Shadcn Component Operations (`skills/shadcn-component-operations.md`)

**Purpose:** Add and customize Shadcn/UI components

**Includes:**
- Adding Shadcn primitives
- Creating custom components
- Exporting from UI package
- Using in apps

**When to use:**
- Adding UI components
- Building custom components
- Managing component library

---

### 4. Turborepo Optimization (`skills/turborepo-optimization.md`)

**Purpose:** Optimize build performance and manage cache

**Includes:**
- Performance analysis
- Cache management
- Build optimization strategies
- Remote caching setup

**When to use:**
- Slow builds
- Cache issues
- Build performance tuning
- CI/CD optimization

---

### 5. Debug Build Issues (`skills/debug-build-issues.md`)

**Purpose:** Systematically troubleshoot build failures

**Includes:**
- Diagnostic workflows
- Common error patterns
- Targeted solutions
- Prevention strategies

**When to use:**
- Build failures
- Module not found errors
- Type errors
- Deployment issues

---

## Quick Start

### Using Agents

Agents are autonomous and work independently. Simply describe your problem:

```
"I need help optimizing our build pipeline"
→ Turborepo Architect agent will analyze and fix

"Add a new student dashboard page with real-time data"
→ Next.js App Developer agent will implement

"Create a compliance tracking service"
→ Service Developer agent will scaffold
```

### Using Skills

Skills provide step-by-step guidance. Reference them when needed:

```
"How do I add a new package to the main app?"
→ Follow add-workspace-package.md

"Walk me through creating a new service"
→ Follow create-new-service.md

"My build is failing with module errors"
→ Follow debug-build-issues.md
```

---

## Usage Examples

### Example 1: Adding a New Feature

**Scenario:** Add student attendance tracking

**Workflow:**
1. **Prisma Schema Manager** - Design database schema
2. **Service Developer** - Create attendance service
3. **Next.js App Developer** - Build attendance dashboard
4. **Shadcn Component Builder** - Create attendance UI components

**Commands:**
```bash
# 1. Update schema (Prisma Schema Manager)
# Edit packages/database/prisma/schema.prisma
pnpm run db:generate
pnpm run db:push

# 2. Create service (Service Developer)
# Follow create-new-service.md
mkdir -p services/attendance
# ... scaffold service

# 3. Build UI (Next.js App Developer + Shadcn Component Builder)
# Create pages, components, and integrate
```

---

### Example 2: Performance Optimization

**Scenario:** Builds are taking 10 minutes

**Workflow:**
1. **Turborepo Architect** - Analyze build pipeline
2. **Turborepo Optimization Skill** - Apply optimizations
3. **Debug Build Issues Skill** - Fix any blockers

**Commands:**
```bash
# 1. Analyze (Turborepo Architect)
pnpm run build --dry-run
pnpm run build --summarize

# 2. Optimize (Turborepo Optimization)
rm -rf .turbo
pnpm run build --force

# 3. Verify improvement
time pnpm run build
```

---

### Example 3: Fixing Build Errors

**Scenario:** "Cannot find module '@aah/database'"

**Workflow:**
1. **Debug Build Issues Skill** - Diagnose error
2. **Prisma Schema Manager** - Regenerate client
3. **Turborepo Architect** - Rebuild dependencies

**Commands:**
```bash
# 1. Diagnose (Debug Build Issues)
pnpm run build --verbose

# 2. Fix (Prisma Schema Manager)
pnpm run db:generate

# 3. Rebuild (Turborepo Architect)
pnpm run build --filter @aah/database
pnpm run build
```

---

### Example 4: Creating Custom Components

**Scenario:** Build a StudentGradeCard component

**Workflow:**
1. **Shadcn Component Builder** - Design component
2. **Shadcn Component Operations Skill** - Add primitives
3. **Next.js App Developer** - Integrate in app

**Commands:**
```bash
# 1. Add Shadcn primitives (Shadcn Component Operations)
cd packages/ui
npx shadcn-ui@latest add card badge

# 2. Create custom component (Shadcn Component Builder)
# Create packages/ui/src/components/custom/student-grade-card.tsx

# 3. Export and rebuild
# Add to packages/ui/src/index.ts
pnpm run build --filter @aah/ui

# 4. Use in app (Next.js App Developer)
import { StudentGradeCard } from '@aah/ui/student-grade-card';
```

---

## Cross-IDE Compatibility

These agents and skills are **IDE-agnostic markdown files** that work across:

### VS Code
- Use with Claude Code extension
- Copy skill content into prompts
- Reference agents by name

### Cursor
- Import as context files
- Reference in composer
- Use @ mentions for specific agents

### JetBrains IDEs
- Load as context documentation
- Reference in AI assistant
- Use for code generation prompts

### GitHub Copilot
- Include in workspace context
- Reference in comments
- Use for complex tasks

### Command Line (Claude CLI)
- Reference in prompts
- Pipe skill content
- Use for automated workflows

### Web IDEs (Replit, CodeSandbox, etc.)
- Include in project docs
- Reference in AI chat
- Use as development guides

---

## File Structure

```
.claude/
├── agents/
│   ├── turborepo-architect.md
│   ├── nextjs-app-developer.md
│   ├── shadcn-component-builder.md
│   ├── service-developer.md
│   └── prisma-schema-manager.md
├── skills/
│   ├── add-workspace-package.md
│   ├── create-new-service.md
│   ├── shadcn-component-operations.md
│   ├── turborepo-optimization.md
│   └── debug-build-issues.md
└── AGENTS_AND_SKILLS.md (this file)
```

---

## Best Practices

### When to Use Agents

Use agents for:
- ✅ Complex, multi-step problems
- ✅ Architecture decisions
- ✅ Deep domain expertise needed
- ✅ Autonomous problem solving

Don't use agents for:
- ❌ Simple one-off commands
- ❌ Quick questions
- ❌ Straightforward tasks

### When to Use Skills

Use skills for:
- ✅ Step-by-step guidance
- ✅ Learning new workflows
- ✅ Following best practices
- ✅ Systematic troubleshooting

Don't use skills for:
- ❌ High-level strategy
- ❌ Complex decision-making
- ❌ Architectural design

---

## Common Workflows

### Daily Development

```
Morning:
1. Debug Build Issues (if needed)
2. Turborepo Optimization (check cache)

Feature Work:
3. Next.js App Developer (build features)
4. Shadcn Component Builder (create UI)
5. Service Developer (backend logic)
6. Prisma Schema Manager (data model)

Before Commit:
7. Turborepo Architect (verify builds)
8. Debug Build Issues (fix any errors)
```

### Weekly Maintenance

```
1. Turborepo Optimization (analyze performance)
2. Turborepo Architect (review architecture)
3. Add Workspace Package (update dependencies)
```

### Monthly Reviews

```
1. All Agents (review codebase health)
2. Turborepo Optimization (full performance audit)
3. Service Developer (microservice health check)
```

---

## Troubleshooting the Agents/Skills

### If an agent isn't working:

1. Check file exists: `ls .claude/agents/`
2. Verify markdown syntax
3. Ensure proper context in prompt
4. Try rephrasing your request

### If a skill is unclear:

1. Read the entire skill file
2. Follow steps sequentially
3. Adapt to your specific case
4. Consult related agents if needed

---

## Contributing

### Adding New Agents

1. Create `.claude/agents/<name>.md`
2. Follow existing agent structure:
   - Your Expertise
   - Critical Project Context
   - Your Responsibilities
   - Common Tasks
   - Output Format
3. Update this README
4. Test with various prompts

### Adding New Skills

1. Create `.claude/skills/<name>.md`
2. Follow existing skill structure:
   - Usage
   - Commands/Workflow
   - Examples
   - Checklist
3. Update this README
4. Verify step-by-step accuracy

---

## Support & Feedback

For issues, improvements, or suggestions:
- Create an issue in the repository
- Update CLAUDE.md with common patterns
- Share learnings with the team

---

## Version History

**v1.0.0** (Initial Release)
- 5 specialized agents
- 5 practical skills
- Complete documentation
- Cross-IDE compatibility

---

## License

These agents and skills are part of the AAH project and follow the same license as the repository.

---

**Remember:** Agents solve problems autonomously. Skills guide you step-by-step. Use both to supercharge your Turborepo development! 🚀
