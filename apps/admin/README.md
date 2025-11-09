# Admin Portal

Administrative portal for Athletic Academics Hub program management and analytics.

## Overview

The Admin Portal is a Next.js zone application that provides staff and administrators with tools to manage student-athletes, support programs, and compliance tracking.

## Features

- **Dashboard**: Overview analytics including eligibility rates, at-risk students, and upcoming sessions
- **Student Management**: View and manage all student-athlete records with compliance status
- **Program Management**: Manage tutoring sessions, study halls, and support programs
- **Analytics**: Track key metrics and generate reports

## Access Control

This zone requires authentication and staff/admin role verification:
- Users must be authenticated via Clerk
- Users must have either `admin` or `staff` role
- Unauthorized access returns 403 Forbidden

## Development

```bash
# Run admin portal only
pnpm dev:admin

# Run all zones
pnpm dev

# Build admin portal
pnpm build:admin

# Type check
cd apps/admin && pnpm type-check
```

The admin portal runs on port 3002 by default.

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - Postgres database connection string
- `SENTRY_DSN` - Sentry error tracking (optional)

## Routes

- `/admin` - Redirects to dashboard
- `/admin/dashboard` - Main dashboard with analytics
- `/admin/students` - Student management interface
- `/admin/programs` - Program management interface
- `/admin/api/health` - Health check endpoint

## Multi-Zone Architecture

This app is part of a multi-zone Next.js architecture:
- **basePath**: `/admin`
- **Port**: 3002 (development)
- **Main App**: Proxies requests from `/admin/*` to this zone

## Dependencies

Shared packages:
- `@aah/ui` - Shared UI components
- `@aah/database` - Prisma client and schema
- `@aah/auth` - Authentication utilities
- `@aah/config` - Shared configuration

## Deployment

Deploy to Vercel as a separate project linked to the same domain as the main app. The main app will proxy requests to this zone.

See the root README for full deployment instructions.
