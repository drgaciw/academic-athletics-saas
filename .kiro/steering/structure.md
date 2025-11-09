---
inclusion: always
---

# Project Structure

## Monorepo Organization

The project uses a **Turborepo monorepo** structure with the following organization:

```
/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utility functions and helpers
│   │   └── public/             # Static assets
│   └── mobile/                 # Mobile app (future)
├── packages/
│   ├── ui/                     # Shared UI components (Shadcn/UI)
│   ├── database/               # Prisma schema and migrations
│   ├── auth/                   # Authentication utilities (Clerk)
│   ├── ai/                     # AI service utilities and types
│   └── config/                 # Shared configuration (ESLint, TypeScript)
├── services/
│   ├── user/                   # User Service microservice
│   ├── advising/               # Advising Service microservice
│   ├── compliance/             # Compliance Service microservice
│   ├── monitoring/             # Monitoring Service microservice
│   ├── support/                # Support Service microservice
│   ├── integration/            # Integration Service microservice
│   └── ai/                     # AI Service microservice
├── docs/                       # Documentation (PRD, tech specs)
├── .kiro/                      # Kiro configuration and steering
└── turbo.json                  # Turborepo configuration
```

## Key Directories

### `/apps/web` - Frontend Application
- **app/**: Next.js App Router pages and layouts
- **components/**: Reusable React components organized by feature
- **lib/**: Utility functions, API clients, and helpers
- **public/**: Static assets (images, fonts, etc.)

### `/packages` - Shared Code
- **ui/**: Shared UI component library (Shadcn/UI components)
- **database/**: Prisma schema, migrations, and database utilities
- **auth/**: Authentication helpers and Clerk integration
- **ai/**: AI service types, utilities, and SDK wrappers
- **config/**: Shared ESLint, TypeScript, and build configurations

### `/services` - Microservices
Each service follows a consistent structure:
```
service-name/
├── src/
│   ├── routes/         # API route handlers (Hono)
│   ├── lib/            # Service-specific logic
│   ├── models/         # Data models and types
│   └── utils/          # Utility functions
├── tests/              # Service tests
└── package.json        # Service dependencies
```

### `/docs` - Documentation
- **prd.md**: Product Requirements Document
- **tech-spec.md**: Technical Specification
- Additional design documents and API documentation

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `StudentDashboard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **API Routes**: kebab-case (e.g., `check-eligibility.ts`)
- **Types**: PascalCase with `.types.ts` suffix (e.g., `Student.types.ts`)

### Code
- **Variables/Functions**: camelCase (e.g., `checkEligibility`)
- **Types/Interfaces**: PascalCase (e.g., `StudentRecord`, `ComplianceStatus`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `API_TIMEOUT`)
- **React Components**: PascalCase (e.g., `EligibilityChecker`)

## Data Models

### Core Entities
- **User**: Student-athletes, staff, coaches, faculty with role-based access
- **Course/Schedule**: Academic courses with athletic conflict detection
- **Compliance Record**: NCAA Division I eligibility tracking (GPA, credits, progress-toward-degree)
- **Session**: Tutoring and study hall bookings with attendance
- **Report**: Progress reports, alerts, and analytics

### AI-Specific Entities
- **Conversation**: Chat history with user context
- **Message**: Individual chat messages with metadata
- **VectorEmbedding**: Semantic embeddings for RAG pipeline
- **KnowledgeDocument**: NCAA rules, policies, learning resources
- **AIAuditLog**: Comprehensive AI interaction logging
- **PredictionModel**: ML models for risk prediction
- **StudentPrediction**: Risk scores with explainability
- **AgentTask**: Agentic workflow task tracking

## Configuration Files

- **turbo.json**: Turborepo build pipeline configuration
- **package.json**: Root dependencies and workspace configuration
- **.env**: Environment variables (API keys, database URLs)
- **prisma/schema.prisma**: Database schema definition
- **tsconfig.json**: TypeScript configuration
- **next.config.js**: Next.js configuration
- **.kiro/steering/**: AI assistant steering rules

## Development Workflow

1. **Feature Development**: Work in feature branches; create in appropriate service/app
2. **Database Changes**: Update Prisma schema, run migrations, generate client
3. **Testing**: Write tests alongside code; run via Turborepo
4. **Deployment**: Push to GitHub; Vercel auto-deploys previews and production
5. **AI Updates**: Update knowledge base via admin interface; embeddings regenerate automatically
