# Athletic Academics Hub (AAH)

NCAA Division I Academic Support Platform - Version 2.0

## Project Structure

```
/
├── apps/
│   └── web/                    # Next.js frontend application
├── packages/
│   ├── ui/                     # Shared UI components (Shadcn/UI)
│   ├── database/               # Prisma schema and client
│   ├── auth/                   # Clerk authentication utilities
│   ├── ai/                     # AI service utilities and types
│   └── config/                 # Shared TypeScript configuration
├── services/
│   ├── user/                   # User Service microservice
│   ├── advising/               # Advising Service microservice
│   ├── compliance/             # Compliance Service microservice
│   └── ai/                     # AI Service microservice
└── docs/                       # Documentation
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Initialize database:
```bash
cd packages/database
npm run db:push
```

4. Run development server:
```bash
npm run dev
```

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn/UI
- **Backend**: Hono, Nitro, Vercel Serverless Functions
- **Database**: Vercel Postgres with Prisma ORM
- **Auth**: Clerk
- **AI**: Vercel AI SDK, OpenAI, Anthropic
- **Monorepo**: Turborepo

## Documentation

See `/docs` for detailed specifications:
- Product Requirements Document (PRD)
- Technical Specification
