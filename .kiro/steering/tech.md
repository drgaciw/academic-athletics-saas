---
inclusion: always
---

# Technical Stack

## Architecture

**Microservices architecture** deployed as a monorepo on Vercel using Turborepo for build management. All components run under a single domain via Vercel's multi-zone support.

## Core Technologies

### Frontend
- **Framework**: Next.js (latest stable) with App Router for SSR, SSG, and client-side interactivity
- **UI Components**: Shadcn/UI with Tailwind CSS for styling
- **State Management**: Zustand or Jotai for client state; React Query (TanStack Query) for data fetching

### Backend
- **API Framework**: Next.js Route Handlers for simple APIs; Hono for lightweight microservices; Nitro for universal serverless deployment
- **ORM**: Prisma for type-safe database queries and schema migrations
- **Authentication**: Clerk for user auth, RBAC, and session management

### Database & Storage
- **Primary Database**: Vercel Postgres (Neon-based) with pgvector extension for vector embeddings
- **File Storage**: Vercel Blob or AWS S3 for secure document uploads
- **Caching**: Vercel Edge Functions for caching; Vercel KV (Redis) for task queues

### AI Infrastructure
- **LLM Providers**: OpenAI (GPT-4, GPT-4-mini), Anthropic (Claude Opus, Sonnet, Haiku) via Vercel AI SDK
- **Vector Database**: Vercel Postgres with pgvector (initial); scalable to Pinecone or Qdrant
- **Embedding Models**: OpenAI text-embedding-3-large (1536 dimensions)
- **AI Observability**: Langfuse or Helicone for tracking performance, costs, and quality

### Communication
- **Email**: Resend or SendGrid for automated notifications
- **Real-Time**: Pusher or Supabase Realtime for WebSockets (live chat, AI streaming)
- **SMS**: Third-party gateways for urgent notifications

### Monitoring & Analytics
- **Performance**: Vercel Analytics for insights; Vercel Logs for debugging
- **Error Tracking**: Sentry for exceptions and performance monitoring
- **AI Monitoring**: Custom dashboards for token usage, accuracy, and cost tracking

## Microservices

- **User Service**: Authentication, roles, profiles
- **Advising Service**: Course selection, scheduling, conflict detection
- **Compliance Service**: NCAA Division I eligibility checks with internal rule engine
- **Monitoring Service**: Academic performance tracking, progress reports, alerts
- **Support Service**: Tutoring, study halls, life skills workshops
- **Integration Service**: Faculty liaisons, external API connections
- **AI Service**: Conversational interfaces, RAG pipelines, predictive analytics, agentic workflows

## Development Tools

- **Version Control**: Git with GitHub; Vercel Git Integration for auto-deployments
- **Build Tools**: Turborepo for monorepo management
- **Testing**: Jest and React Testing Library (unit/integration); Cypress (E2E)
- **CI/CD**: Vercel CLI and GitHub Actions

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Lint code

# Deployment
vercel                   # Deploy to preview
vercel --prod            # Deploy to production

# Database
npx prisma migrate dev   # Run migrations in development
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio

# Monorepo (Turborepo)
turbo run build          # Build all packages
turbo run test           # Test all packages
turbo run dev --filter=@app/web  # Run specific package
```

## Key Integrations

- **University Systems**: LMS/ERP (Canvas, Blackboard), SIS for enrollment data
- **NCAA Compliance**: File-based data exchange (CSV, XML); potential vendor APIs (Teamworks, Honest Game, Spry)
- **Transcript Services**: Parchment, National Student Clearinghouse for automated retrieval
- **Calendar**: Google Calendar, Outlook for scheduling

## Security & Compliance

- **Data Protection**: HTTPS, at-rest encryption in Vercel Postgres, FERPA/GDPR compliance
- **Access Control**: Role-based access control (RBAC) via Clerk
- **AI Security**: PII filtering, prompt injection prevention, conversation encryption, audit logging
- **Monitoring**: Comprehensive audit logs for NCAA compliance and FERPA requirements
