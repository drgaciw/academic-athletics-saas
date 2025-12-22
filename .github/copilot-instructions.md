# GitHub Copilot Instructions for Athletic Academics Hub (AAH)

## Project Overview

Athletic Academics Hub (AAH) is an NCAA Division I academic support platform designed to help student-athletes manage their academic requirements while maintaining athletic eligibility. This is a comprehensive SaaS platform built with a modern monorepo architecture.

**Key Features:**
- Academic progress tracking and advising
- NCAA compliance monitoring and reporting
- AI-powered study assistance and tutoring
- Multi-role support (students, advisors, administrators, compliance officers)
- Real-time notifications and alerts
- Integration with external systems

## Tech Stack

### Frontend
- **Framework:** Next.js 14 with App Router
- **UI Library:** React 18.2
- **Styling:** Tailwind CSS with Shadcn/UI components
- **State Management:** Zustand for global state, React Query for server state
- **Forms:** React Hook Form with Zod validation
- **Authentication:** Clerk

### Backend
- **API Framework:** Hono (for services), Next.js API routes
- **Runtime:** Vercel Serverless Functions, Nitro for microservices
- **Database:** Vercel Postgres with Prisma ORM
- **AI Services:** Vercel AI SDK, OpenAI, Anthropic

### Monorepo & Tooling
- **Monorepo Manager:** Turborepo with pnpm workspaces
- **Package Manager:** pnpm 8.15.0 (required)
- **TypeScript:** v5.6.3 with strict mode enabled
- **Node Version:** >=18.0.0
- **Code Quality:** ESLint, Prettier
- **Testing:** Jest for unit/integration tests

## Project Structure

```
/
├── apps/                    # Frontend applications
│   ├── main/               # Main application (port 3000)
│   ├── student/            # Student portal
│   └── admin/              # Admin dashboard
├── packages/               # Shared packages
│   ├── ui/                 # Shared UI components (Shadcn/UI)
│   ├── database/           # Prisma schema and client
│   ├── auth/               # Clerk authentication utilities
│   ├── ai/                 # AI service utilities and types
│   ├── api-utils/          # Shared API utilities
│   ├── config/             # Shared TypeScript configuration
│   └── ai-evals/           # AI evaluation framework
├── services/               # Backend microservices
│   ├── user/               # User management service
│   ├── advising/           # Academic advising service
│   ├── compliance/         # NCAA compliance service
│   ├── ai/                 # AI service
│   ├── support/            # Support ticket service
│   ├── monitoring/         # Monitoring and observability
│   └── integration/        # External system integrations
└── docs/                   # Documentation
    ├── prd.md              # Product Requirements
    ├── tech-spec.md        # Technical Specification
    └── frontend-ui-tech-spec.md  # Frontend UI Spec
```

## Development Workflow

### Setting Up the Project

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables:**
   ```bash
   cp .env.example .env
   # Configure all required environment variables
   ```

3. **Initialize Database:**
   ```bash
   pnpm run db:generate
   pnpm run db:push
   ```

### Running the Application

- **Start all apps:** `pnpm run dev`
- **Start specific app:** 
  - `pnpm run dev:main` (port 3000)
  - `pnpm run dev:student`
  - `pnpm run dev:admin`
- **Start services:** `pnpm run dev:services`

### Building and Testing

- **Build all:** `pnpm run build`
- **Build specific app:** `pnpm run build:main`, `pnpm run build:student`, etc.
- **Run tests:** `pnpm run test`
- **Watch mode:** `pnpm run test:watch`
- **Coverage:** `pnpm run test:coverage`
- **Type check:** `pnpm run type-check`

### Code Quality

- **Lint:** `pnpm run lint`
- **Lint fix:** `pnpm run lint:fix`
- **Format:** `pnpm run format`
- **Format check:** `pnpm run format:check`

### Database Operations

- **Generate Prisma Client:** `pnpm run db:generate`
- **Push schema to DB:** `pnpm run db:push`
- **Run migrations:** `pnpm run db:migrate`
- **Open Prisma Studio:** `pnpm run db:studio`

## Coding Standards and Best Practices

### TypeScript

- **Always use TypeScript** for all new code
- **Enable strict mode** - all code must pass TypeScript strict checks
- **Define proper types** - avoid `any`, use `unknown` when type is truly unknown
- **Use type inference** where possible to reduce verbosity
- **Export types** from appropriate package locations for shared types

### Code Organization

- **Monorepo packages:** Use workspace aliases like `@aah/ui`, `@aah/database`, `@aah/auth`
- **Import paths:** Use configured path aliases from tsconfig.json
- **Shared code:** Extract reusable logic to packages, not apps
- **Service separation:** Keep microservices independent and loosely coupled

### React/Next.js Conventions

- **Use App Router** (Next.js 14) - no Pages Router code
- **Server Components by default** - use Client Components only when needed (add `"use client"` directive)
- **File naming:** 
  - Components: PascalCase (e.g., `StudentDashboard.tsx`)
  - Utilities: camelCase (e.g., `formatDate.ts`)
  - API routes: lowercase (e.g., `route.ts`)
- **Component structure:**
  ```tsx
  // Imports
  // Types/Interfaces
  // Component definition
  // Helper functions (if small and component-specific)
  // Export
  ```

### UI Components

- **Use Shadcn/UI components** from `@aah/ui` package
- **Tailwind for styling** - use utility classes, avoid custom CSS when possible
- **Responsive design** - always consider mobile, tablet, and desktop viewports
- **Accessibility** - follow WCAG 2.1 AA standards:
  - Proper ARIA labels
  - Keyboard navigation support
  - Color contrast compliance
  - Screen reader compatibility

### API Design

- **RESTful conventions** for API routes
- **Error handling:** Always return proper HTTP status codes and error messages
- **Validation:** Use Zod schemas for request/response validation
- **Authentication:** Protect routes with Clerk middleware
- **Rate limiting:** Consider rate limiting for public endpoints

### Database Patterns

- **Prisma for all DB operations** - no raw SQL unless absolutely necessary
- **Transactions:** Use Prisma transactions for multi-step operations
- **Migrations:** Always create migrations for schema changes (don't just push)
- **Soft deletes:** Use soft deletes for user-facing data
- **Indexing:** Add indexes for frequently queried fields

### AI Integration

- **Use Vercel AI SDK** for AI features
- **Streaming responses** when appropriate for better UX
- **Error handling:** Gracefully handle AI service failures
- **Rate limiting:** Implement proper rate limiting for AI endpoints
- **Evaluation:** Use AI-evals package for testing AI features

### Testing

- **Write tests for:**
  - All business logic functions
  - API endpoints
  - Complex React components
  - Database operations
  - AI service integrations
- **Test structure:**
  - Use Jest for testing framework
  - Place tests in `__tests__` directories or co-locate with `.test.ts` suffix
  - Mock external services and API calls
  - Test error cases, not just happy paths
- **Test naming:** Use descriptive test names: `should [expected behavior] when [condition]`

### Security Best Practices

- **Never commit secrets** - use environment variables
- **Validate all inputs** - use Zod schemas for validation
- **Sanitize user data** before displaying or storing
- **Authentication:** Use Clerk for all authentication needs
- **Authorization:** Implement proper role-based access control (RBAC)
- **Rate limiting:** Protect endpoints from abuse
- **HTTPS only** in production

### NCAA Compliance Considerations

- **Data privacy:** Handle student data according to FERPA regulations
- **Audit logging:** Log compliance-related actions for audit trails
- **Data retention:** Follow NCAA retention policies
- **Access controls:** Strict role-based permissions for compliance data

### Performance

- **Code splitting:** Leverage Next.js automatic code splitting
- **Image optimization:** Use Next.js Image component
- **Lazy loading:** Lazy load heavy components
- **Caching:** Use React Query caching for API data
- **Database queries:** Optimize queries, use pagination for large datasets
- **Bundle size:** Monitor and minimize bundle sizes

### Error Handling

- **User-friendly errors:** Display helpful error messages to users
- **Error boundaries:** Use React error boundaries for component errors
- **Logging:** Log errors for debugging (use monitoring service in production)
- **Graceful degradation:** App should remain functional when non-critical services fail

### Documentation

- **JSDoc comments** for complex functions and public APIs
- **README files** in each package/service for local documentation
- **Code comments:** Add comments for complex business logic, not obvious code
- **Type documentation:** Use TypeScript for self-documenting code

## Common Patterns

### Creating a New API Route

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';

const requestSchema = z.object({
  // Define schema
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = requestSchema.parse(body);
    
    // Business logic here
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### Creating a New React Component

```typescript
// components/MyComponent.tsx
'use client'; // Only if client-side features needed

import { useState } from 'react';
import { Button } from '@aah/ui';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      await onAction();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>{title}</h2>
      <Button onClick={handleAction} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  );
}
```

### Database Query Pattern

```typescript
// lib/db/students.ts
import { prisma } from '@aah/database';

export async function getStudentById(id: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        courses: true,
        advisor: true,
      },
    });
    return student;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch student');
  }
}
```

## Issue Resolution Guidelines

When working on issues:

1. **Understand the context:** Read the issue description, related docs, and existing code
2. **Minimal changes:** Make the smallest possible changes to fix the issue
3. **Test thoroughly:** Run tests, type-check, and lint before submitting
4. **Update documentation:** If behavior changes, update relevant docs
5. **Follow conventions:** Match existing code style and patterns
6. **Security check:** Consider security implications of changes
7. **NCAA compliance:** Ensure changes don't violate compliance requirements

## Resources

- **Documentation:** `/docs` directory
- **Product Requirements:** `/docs/prd.md`
- **Technical Spec:** `/docs/tech-spec.md`
- **UI Spec:** `/docs/frontend-ui-tech-spec.md`
- **Testing Guide:** `/docs/testing-with-testsprite.md`
- **Turborepo Docs:** https://turbo.build/repo/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Shadcn/UI:** https://ui.shadcn.com
- **Clerk Docs:** https://clerk.com/docs

## Notes for AI Agents

- This is a monorepo - changes may affect multiple packages
- Always use `pnpm` (not npm or yarn)
- Run tests and type-checks before finalizing changes
- Follow established patterns in the codebase
- When in doubt, ask for clarification rather than making assumptions
- NCAA compliance is critical - be cautious with student data handling
- Performance matters - this serves real users with time-sensitive needs
