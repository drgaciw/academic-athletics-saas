# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Athletic Academics Hub (AAH) is an NCAA Division I academic support platform built as a microservices-based SaaS application. The platform helps manage student-athlete academics, compliance tracking, advising, and AI-powered support services.

**Tech Stack**: Next.js 14, Turborepo monorepo, Hono microservices, Vercel Postgres with Prisma, Clerk authentication, Vercel AI SDK, OpenAI/Anthropic LLMs.

## Development Commands

### Installation & Setup
```bash
# Install all dependencies across the monorepo
npm install

# Set up environment variables
cp .env.example .env

# Initialize database with Prisma
cd packages/database
npm run db:push

# Generate Prisma client (required after schema changes)
npm run db:generate
```

### Development
```bash
# Run all services in development mode (uses Turborepo)
npm run dev

# Run specific workspace
npm run dev --filter=@aah/web              # Frontend only
npm run dev --filter=@aah/service-user     # User service only

# Type checking across all packages
npm run type-check

# Linting across all packages
npm run lint
```

### Database Operations
```bash
# From packages/database directory:
npm run db:push       # Push schema changes to database (development)
npm run db:migrate    # Create and run migrations (production)
npm run db:generate   # Generate Prisma Client
npm run db:studio     # Open Prisma Studio GUI
```

### Building
```bash
# Build all packages and apps
npm run build

# Build specific workspace
npm run build --filter=@aah/web
```

### Testing
```bash
# Run all tests
npm run test

# Run tests for specific workspace
npm run test --filter=@aah/service-user
```

### Cleanup
```bash
# Clean all build artifacts and node_modules
npm run clean
```

## Architecture Overview

### Monorepo Structure
This is a **Turborepo monorepo** with three main sections:

1. **`apps/`** - Frontend applications
   - `web/` - Next.js 14 App Router frontend with React, Tailwind CSS, Shadcn/UI

2. **`packages/`** - Shared code libraries
   - `database/` - Prisma schema and client (shared across all services)
   - `ui/` - Shared Shadcn/UI components
   - `auth/` - Clerk authentication utilities
   - `ai/` - AI service utilities and shared types
   - `config/` - Shared TypeScript/ESLint configuration

3. **`services/`** - Backend microservices (Hono-based)
   - `user/` - User management, profiles, RBAC
   - `advising/` - Course scheduling, conflict detection
   - `compliance/` - NCAA Division I eligibility validation
   - `monitoring/` - Performance tracking, alerts
   - `support/` - Tutoring, study halls, workshops
   - `integration/` - External system integrations (LMS, SIS, email)
   - `ai/` - Conversational AI, RAG pipelines, intelligent agents

### Microservices Communication
- All services use **Hono** for lightweight, type-safe HTTP APIs
- Services are deployed as Vercel Serverless Functions
- Frontend communicates with services via Next.js API routes (API Gateway pattern)
- Shared database access through `@aah/database` package
- Authentication handled by Clerk with RBAC enforcement

### Database Architecture
- **Single Vercel Postgres database** with service-specific schemas
- **Prisma ORM** for type-safe queries and migrations
- **pgvector extension** enabled for AI semantic search
- All services import `@aah/database` package for database access
- Schema changes require running `npm run db:generate` from `packages/database`

### AI Service Architecture
The AI Service is the most complex microservice with:
- **Conversational interface** using Vercel AI SDK with streaming responses
- **RAG pipeline** with pgvector for semantic search and document retrieval
- **Intelligent agents** for advising, compliance analysis, and interventions
- **Predictive analytics** for student risk assessment
- **LLM providers**: OpenAI (GPT-4) and Anthropic (Claude) via Vercel AI SDK
- **Vector embeddings**: OpenAI text-embedding-3-large (1536 dimensions)

## Key Conventions

### Workspace Naming
All packages use scoped naming: `@aah/<package-name>`
- Apps: `@aah/web`
- Services: `@aah/service-<name>` (e.g., `@aah/service-user`)
- Packages: `@aah/<name>` (e.g., `@aah/database`)

### Import Paths
Internal packages are imported by their workspace name:
```typescript
import { prisma } from '@aah/database'
import { auth } from '@aah/auth'
import { Button } from '@aah/ui'
```

### Service Development
Each microservice in `services/` follows this pattern:
- Entry point: `src/index.ts`
- Built with **Hono** framework
- Uses `tsx watch` for development hot-reloading
- Built with `tsup` for production (ESM + CJS + type definitions)
- Imports shared database client from `@aah/database`

### Database Schema Changes
When modifying Prisma schema:
1. Edit `packages/database/prisma/schema.prisma`
2. Run `npm run db:push` (development) or `npm run db:migrate` (production)
3. Run `npm run db:generate` to update Prisma Client
4. Restart any running services to pick up the new types

## NCAA Compliance Implementation

The Compliance Service implements NCAA Division I eligibility rules:

### Initial Eligibility Requirements
- **16 core courses** (4 English, 3 Math, 2 Science, etc.)
- **2.3 minimum GPA** in core courses
- **10/7 rule**: 10 core courses before senior year, 7 in English/Math/Science
- **Sliding scale**: GPA vs SAT/ACT scores

### Continuing Eligibility Requirements
- **24/18 rule**: 24 semester hours before each season, 18 earned previous year
- **40/60/80 rule**: Progress toward degree (40% after year 2, 60% after year 3, 80% after year 4)
- **GPA thresholds**: Minimum GPA requirements based on year in program

### Rule Engine
The Compliance Service uses an internal rule engine (no external NCAA API exists):
- Rule versioning system for NCAA updates
- Validation result aggregation
- Alert generation for eligibility violations
- Recommendation engine for remediation steps

## AI Features Implementation

### Conversational AI
- Streaming responses using Vercel AI SDK
- Conversation history management with context window optimization
- Multi-turn conversations with memory
- Function calling for tool use (course search, compliance checks, etc.)

### RAG Pipeline
- Document chunking and embedding generation
- Semantic search with pgvector
- Context retrieval with reranking
- Source citation in responses
- Fact-checking validation layer

### Security Considerations
- Prompt injection prevention
- PII detection and filtering
- Output validation for hallucinations
- Rate limiting on AI endpoints
- Conversation encryption for FERPA compliance

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - Vercel Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `OPENAI_API_KEY` - OpenAI API key (for AI Service)
- `ANTHROPIC_API_KEY` - Anthropic API key (for AI Service)
- `VERCEL_URL` - Auto-populated by Vercel

## Deployment

### Vercel Deployment
- Frontend (`apps/web`) deploys to root domain
- Microservices deploy as Vercel Serverless Functions
- Multi-zone architecture for service routing
- Automatic deployments via GitHub integration
- Preview deployments for all pull requests

### Production Checklist
1. Ensure all environment variables are set in Vercel dashboard
2. Run database migrations: `npm run db:migrate`
3. Verify Clerk production environment configuration
4. Configure custom domain and SSL
5. Enable Vercel Analytics and monitoring

## Documentation

Detailed specifications are in:
- [`/docs/prd.md`](docs/prd.md) - Product Requirements Document
- [`/docs/tech-spec.md`](docs/tech-spec.md) - Technical Specification
- [`/.kiro/specs/microservices-architecture/tasks.md`](.kiro/specs/microservices-architecture/tasks.md) - Implementation plan and task breakdown
- [`/.kiro/steering/structure.md`](.kiro/steering/structure.md) - Project structure details

## Implementation Status

This is a **greenfield project** currently in development. Refer to [`/.kiro/specs/microservices-architecture/tasks.md`](.kiro/specs/microservices-architecture/tasks.md) for the detailed implementation plan with 17 major phases covering infrastructure setup, all microservices, AI implementation, security, and deployment.
