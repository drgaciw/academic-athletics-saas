# User Service Architecture

## Overview

The User Service is a microservice responsible for authentication, authorization, and user profile management in the Academic Athletics Hub platform.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SERVICE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    HTTP Layer (Hono)                      │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  • CORS Middleware                                        │ │
│  │  • Logger Middleware                                      │ │
│  │  • Error Handler Middleware                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Route Handlers                          │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  • /api/user/profile/:id  (GET, PUT)                     │ │
│  │  • /api/user/roles/:id    (GET)                          │ │
│  │  • /api/user/sync-clerk   (POST)                         │ │
│  │  • /health                (GET)                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Middleware Layer                       │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Authentication → Validation → Authorization              │ │
│  │       ↓               ↓               ↓                   │ │
│  │   JWT Verify      Zod Schema      RBAC Check             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Service Layer                          │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  ┌─────────────────┐  ┌─────────────────┐               │ │
│  │  │ ProfileService  │  │  RBACService    │               │ │
│  │  ├─────────────────┤  ├─────────────────┤               │ │
│  │  │ • getProfile    │  │ • getUserRoles  │               │ │
│  │  │ • updateProfile │  │ • checkPerms    │               │ │
│  │  │ • createStudent │  │ • requireRole   │               │ │
│  │  └─────────────────┘  └─────────────────┘               │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────┐                │ │
│  │  │      ClerkSyncService                │                │ │
│  │  ├──────────────────────────────────────┤                │ │
│  │  │ • syncUser                           │                │ │
│  │  │ • handleWebhook                      │                │ │
│  │  │ • deleteUser                         │                │ │
│  │  └──────────────────────────────────────┘                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ↓                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Data Layer                             │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Prisma ORM ←→ PostgreSQL (Vercel Postgres)             │ │
│  │                                                           │ │
│  │  Models:                                                  │ │
│  │  • User                                                   │ │
│  │  • StudentProfile                                         │ │
│  │  • ComplianceRecord                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  • Clerk Authentication (JWT verification, webhooks)            │
│  • Vercel Postgres (database)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. Authenticated Request Flow

```
Client Request
    ↓
[Authorization: Bearer JWT]
    ↓
┌─────────────────────┐
│  CORS Middleware    │ ← Validate origin
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Logger Middleware  │ ← Log request
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Auth Middleware    │ ← Verify JWT with Clerk
└─────────────────────┘
    ↓
┌─────────────────────┐
│ Validation Middleware│ ← Validate with Zod
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Route Handler      │ ← Process request
└─────────────────────┘
    ↓
┌─────────────────────┐
│  RBAC Check         │ ← Check permissions
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Service Layer      │ ← Business logic
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Database (Prisma)  │ ← Data operations
└─────────────────────┘
    ↓
Response to Client
```

### 2. Webhook Request Flow

```
Clerk Webhook Event
    ↓
[POST /api/user/sync-clerk]
    ↓
┌─────────────────────┐
│  Signature Verify   │ ← Validate Clerk signature
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Webhook Handler    │ ← Parse event
└─────────────────────┘
    ↓
┌─────────────────────┐
│ ClerkSyncService    │ ← Process event
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Database (Prisma)  │ ← Upsert/Delete user
└─────────────────────┘
    ↓
Success Response
```

## Component Details

### Main Application (index.ts)

**Responsibilities:**
- Initialize Hono app
- Configure global middleware
- Register routes
- Set up CORS
- Handle errors
- Provide health check

**Key Features:**
- Lightweight and fast
- Serverless-ready
- Hot reload in development

### Routes Layer

#### Profile Routes (`/api/user/profile`)
- **GET /:id** - Retrieve user profile
- **PUT /:id** - Update user profile

**Security:**
- Requires authentication
- Owner or admin access only
- Request validation

#### Roles Routes (`/api/user/roles`)
- **GET /:id** - Get user roles and permissions

**Security:**
- Requires authentication
- Owner or admin access only

#### Sync Routes (`/api/user/sync-clerk`)
- **POST /sync-clerk** - Process Clerk webhooks

**Security:**
- Signature verification
- Event validation
- Idempotent operations

### Middleware Layer

#### Authentication Middleware
```typescript
authMiddleware(context, next) {
  1. Extract Bearer token
  2. Verify with Clerk
  3. Decode user info
  4. Set context.auth
  5. Continue or reject
}
```

#### Validation Middleware
```typescript
validateRequest(schema) {
  1. Parse request body
  2. Validate against Zod schema
  3. Set context.validatedData
  4. Continue or return errors
}
```

#### Error Handler
```typescript
errorHandler(context, next) {
  try {
    await next()
  } catch (error) {
    Format error response
    Return standardized error
  }
}
```

### Service Layer

#### ProfileService
**Methods:**
- `getUserProfile(userId)` - Fetch user with profile
- `updateUserProfile(userId, data)` - Update user details
- `createStudentProfile(data)` - Create athlete profile

**Features:**
- Transaction support
- Validation before DB operations
- Detailed error messages

#### RBACService
**Methods:**
- `getUserRoles(userId)` - Get roles and permissions
- `checkPermission(userId, permission)` - Verify access
- `requirePermission(userId, permission)` - Enforce access
- `getPermissionsForRole(role)` - List role permissions

**Permissions Matrix:**
```
Role              | Permissions
------------------|----------------------------------
STUDENT_ATHLETE   | read:own_*, update:own_profile
ADMIN             | read:all_*, update:all_*, manage:*
COACH             | read:team_*, update:team_*
FACULTY           | read:student_*, submit:progress
MENTOR            | read:mentee_*, create:mentoring
```

#### ClerkSyncService
**Methods:**
- `syncUser(clerkData)` - Upsert user from Clerk
- `handleWebhook(webhookData)` - Process webhook events
- `deleteUser(clerkId)` - Remove user and data

**Webhook Events:**
- `user.created` → Create new user
- `user.updated` → Update existing user
- `user.deleted` → Delete user cascade

### Data Layer

#### Prisma Models

**User:**
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  role      UserRole
  firstName String?
  lastName  String?
}
```

**StudentProfile:**
```prisma
model StudentProfile {
  id                String  @id @default(cuid())
  userId            String  @unique
  studentId         String  @unique
  sport             String
  gpa               Float?
  creditHours       Int
  eligibilityStatus String
}
```

## Security Architecture

### Authentication Flow
```
1. User logs in via Clerk
2. Clerk issues JWT token
3. Token contains user ID and metadata
4. Service validates token on each request
5. User context injected into request
```

### Authorization Flow
```
1. Extract user ID from token
2. Lookup user role from database
3. Get permissions for role
4. Check if required permission exists
5. Allow or deny access
```

### Data Protection
- **In Transit**: HTTPS/TLS 1.3
- **At Rest**: Database encryption
- **Tokens**: Short-lived JWT (1 hour)
- **Webhooks**: HMAC signature verification

## Error Handling Strategy

### Error Types
1. **Validation Errors** (400)
   - Invalid input data
   - Schema violations
   - Type mismatches

2. **Authentication Errors** (401)
   - Missing token
   - Invalid token
   - Expired token

3. **Authorization Errors** (403)
   - Insufficient permissions
   - Wrong role

4. **Resource Errors** (404)
   - User not found
   - Profile not found

5. **Conflict Errors** (409)
   - Email already exists
   - Student ID duplicate

6. **Server Errors** (500)
   - Database failures
   - External service errors

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* Additional context */ },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "unique-id"
  }
}
```

## Performance Considerations

### Database Optimization
- **Indexes**: clerkId, email, studentId
- **Connection Pooling**: Max 10 connections
- **Query Optimization**: Select only needed fields
- **Transactions**: Use for multi-table operations

### Caching Strategy
- **User Profiles**: Cache for 5 minutes
- **Permissions**: Cache for 15 minutes
- **Webhook Events**: No caching (always fresh)

### Serverless Optimization
- **Cold Start**: Keep dependencies minimal
- **Bundle Size**: Use tree-shaking
- **Memory**: 1024 MB allocated
- **Timeout**: 10 seconds max

## Deployment Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓
Vercel Build
    ↓
Serverless Functions
    ↓
Edge Network (Global)
    ↓
Users Worldwide
```

### Multi-Zone Integration
```
Client Request
    ↓
Main Domain (aah.vercel.app)
    ↓
API Gateway (Next.js rewrites)
    ↓
/api/user/* → User Service
/api/ai/* → AI Service
/api/compliance/* → Compliance Service
```

## Monitoring & Observability

### Metrics Tracked
- Request count
- Response time (p50, p95, p99)
- Error rate
- Database query time
- JWT verification time

### Logging
- Structured JSON logs
- Request/response logs
- Error logs with stack traces
- Audit logs for sensitive operations

### Alerting
- Error rate > 1%
- Response time > 1000ms
- Database connection failures
- Webhook delivery failures

## Testing Strategy

### Unit Tests
- Service layer methods
- Middleware functions
- Utility functions
- RBAC logic

### Integration Tests
- API endpoints
- Database operations
- Clerk integration
- Webhook processing

### E2E Tests
- Complete user flows
- Multi-service interactions
- Error scenarios
- Security validations
