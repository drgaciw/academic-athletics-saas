# User Service

The User Service is responsible for authentication, authorization, user profile management, and RBAC (Role-Based Access Control) in the Academic Athletics Hub platform.

## Features

- User profile management (CRUD operations)
- Role-based access control with permissions
- Clerk authentication integration
- Webhook handling for user synchronization
- Student athlete profile management

## Technology Stack

- **Framework**: Hono (lightweight, fast API framework)
- **Database**: Prisma with PostgreSQL
- **Authentication**: Clerk
- **Validation**: Zod

## API Endpoints

### Profile Management

- `GET /api/user/profile/:id` - Get user profile
- `PUT /api/user/profile/:id` - Update user profile

### Roles & Permissions

- `GET /api/user/roles/:id` - Get user roles and permissions

### Clerk Synchronization

- `POST /api/user/sync-clerk` - Webhook endpoint for Clerk user sync

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk API secret key
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret
- `PORT` - Service port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS

## Development

### Type Checking
```bash
npm run type-check
```

### Building
```bash
npm run build
```

## Architecture

### Services

- **ProfileService**: Handles user profile CRUD operations
- **RBACService**: Manages roles and permissions
- **ClerkSyncService**: Synchronizes users from Clerk

### Middleware

- **authMiddleware**: Validates JWT tokens from Clerk
- **validateRequest**: Validates request bodies using Zod schemas
- **errorHandler**: Centralizes error handling and response formatting

### Role Permissions

- **STUDENT_ATHLETE**: Can manage own profile, view schedule, access support
- **ADMIN**: Full access to all resources
- **COACH**: Can manage team profiles and view team data
- **FACULTY**: Can view assigned students and submit progress reports
- **MENTOR**: Can view mentee profiles and schedule sessions

## Error Handling

All errors follow a consistent format:

```typescript
{
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}
```

## Security

- JWT token validation on all protected endpoints
- Role-based access control (RBAC)
- Request validation with Zod
- CORS configuration for trusted origins
- Webhook signature verification

## Integration

### Clerk Webhooks

Configure the following webhook in your Clerk dashboard:

- **URL**: `https://your-domain.com/api/user/sync-clerk`
- **Events**: `user.created`, `user.updated`, `user.deleted`

The service will automatically sync user data when these events occur.
