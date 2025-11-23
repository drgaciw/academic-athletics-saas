# Athletic Academics Hub - Monorepo Setup Guide

This document provides comprehensive information about the monorepo structure, setup, and development workflow.

## 📁 Project Structure

```
athletic-academics-hub/
├── apps/                          # Frontend applications
│   ├── main/                      # Main web application
│   ├── student/                   # Student portal
│   └── admin/                     # Admin dashboard
├── packages/                      # Shared packages
│   ├── auth/                      # Authentication & authorization
│   ├── database/                  # Prisma schema & client
│   ├── api-utils/                 # API utilities & helpers
│   ├── ui/                        # Shared UI components
│   ├── ai/                        # AI utilities & agents
│   └── config/                    # Shared configurations
├── services/                      # Microservices
│   ├── user/                      # User management service
│   ├── advising/                  # Course advising service
│   ├── compliance/                # NCAA compliance service
│   ├── monitoring/                # Performance monitoring service
│   ├── support/                   # Tutoring & support service
│   ├── integration/               # External integrations service
│   └── ai/                        # AI & ML service
├── docs/                          # Documentation
├── .kiro/                         # Kiro AI configuration
├── turbo.json                     # Turborepo configuration
├── pnpm-workspace.yaml            # PNPM workspace configuration
├── vercel.json                    # Vercel deployment configuration
└── package.json                   # Root package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (or Vercel Postgres)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd athletic-academics-hub
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   cd packages/database
   pnpm db:generate
   pnpm db:push
   ```

5. **Start development servers**
   ```bash
   # Start all services
   pnpm dev

   # Or start specific services
   pnpm dev:main        # Main web app
   pnpm dev:student     # Student portal
   pnpm dev:admin       # Admin dashboard
   ```

## 🏗️ Architecture

### Microservices Architecture

The platform uses a microservices architecture where each service is independently deployable:

- **User Service** (Port 3001): Authentication, authorization, user profiles
- **Advising Service** (Port 3002): Course scheduling, conflict detection
- **Compliance Service** (Port 3003): NCAA eligibility validation
- **Monitoring Service** (Port 3004): Performance tracking, alerts
- **Support Service** (Port 3005): Tutoring, study halls, workshops
- **Integration Service** (Port 3006): External system integrations
- **AI Service** (Port 3007): Conversational AI, predictive analytics

### Shared Packages

#### @aah/auth
Authentication and authorization utilities:
- JWT validation middleware
- RBAC (Role-Based Access Control)
- Clerk integration

#### @aah/database
Centralized database access:
- Prisma schema
- Type-safe database client
- Migration management

#### @aah/api-utils
Common API utilities:
- Error handling
- Response formatting
- Request validation (Zod)
- Logging utilities

#### @aah/config
Shared configurations:
- TypeScript configs
- ESLint configs
- Environment validation
- Tailwind configs

#### @aah/ui
Shared UI components:
- Shadcn/UI components
- Custom components
- Design system

#### @aah/ai
AI utilities and agents:
- LLM integrations
- RAG pipeline
- Specialized agents
- Tool registry

## 🛠️ Development Workflow

### Running Services

```bash
# Run all services in parallel
pnpm dev

# Run specific service
cd services/user
pnpm dev

# Run with Turborepo filtering
turbo run dev --filter=user-service
```

### Building

```bash
# Build all packages and services
pnpm build

# Build specific app with dependencies
pnpm build:main

# Build with Turborepo filtering
turbo run build --filter=@aah/database
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/auth
pnpm test

# Run tests with coverage
pnpm test -- --coverage
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint specific package
cd services/compliance
pnpm lint

# Auto-fix linting issues
pnpm lint --fix
```

### Type Checking

```bash
# Type check all packages
pnpm type-check

# Type check specific package
cd packages/database
pnpm type-check
```

## 📦 Package Management

### Adding Dependencies

```bash
# Add to root (dev dependencies)
pnpm add -D <package> -w

# Add to specific workspace
pnpm add <package> --filter=@aah/auth

# Add to all workspaces
pnpm add <package> -r
```

### Workspace Dependencies

To use a workspace package in another:

```json
{
  "dependencies": {
    "@aah/auth": "workspace:*",
    "@aah/database": "workspace:*"
  }
}
```

## 🔧 Configuration

### Environment Variables

Environment variables are validated using Zod schemas in `@aah/config/env`.

**Service-specific validation:**

```typescript
import { validateEnv, userServiceEnvSchema } from '@aah/config/env'

const env = validateEnv(userServiceEnvSchema)
```

### TypeScript Configuration

Each package extends the base TypeScript configuration:

```json
{
  "extends": "@aah/config/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### ESLint Configuration

```javascript
module.exports = {
  extends: ['@aah/config/eslint/base'],
}
```

## 🚢 Deployment

### Vercel Deployment

The project is configured for Vercel deployment with multi-zone support:

1. **Connect to Vercel**
   ```bash
   vercel link
   ```

2. **Set environment variables**
   - Go to Vercel dashboard
   - Add all required environment variables
   - Configure for production, preview, and development

3. **Deploy**
   ```bash
   # Deploy to preview
   vercel

   # Deploy to production
   vercel --prod
   ```

### Multi-Zone Configuration

Services are automatically routed via `vercel.json`:
- `/api/user/*` → User Service
- `/api/advising/*` → Advising Service
- `/api/compliance/*` → Compliance Service
- etc.

## 🔍 Monitoring & Observability

### Logging

All services use structured JSON logging:

```typescript
import { logger } from '@aah/api-utils/logging'

logger.info('User created', { userId, email })
logger.error('Database error', { error, context })
```

### Error Tracking

Sentry is configured for error tracking:

```typescript
import * as Sentry from '@sentry/node'

Sentry.captureException(error, {
  tags: { service: 'user-service' },
  extra: { userId, action }
})
```

### Performance Monitoring

- Vercel Analytics for frontend metrics
- Custom metrics for API performance
- Langfuse for AI observability

## 🧪 Testing Strategy

### Unit Tests

```bash
# Run unit tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Test specific service
cd services/compliance
pnpm test:integration
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run in headed mode
pnpm test:e2e --headed
```

## 📚 Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [PNPM Workspaces](https://pnpm.io/workspaces)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📝 License

[Your License Here]
