# API Gateway Implementation

Complete Next.js API Gateway implementation for the Academic Athletics SaaS microservices architecture.

## Overview

The API Gateway serves as the single entry point for all frontend-to-backend communication, providing:

- **Authentication & Authorization**: Clerk-based JWT validation
- **Rate Limiting**: Per-user, per-service rate limits
- **Request/Response Logging**: Structured logging with correlation IDs
- **Error Handling**: Consistent error responses across all services
- **CORS**: Configured cross-origin resource sharing
- **Service Health Monitoring**: Health checks for all microservices
- **Streaming Support**: Server-Sent Events for AI chat responses

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Next.js)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Middleware Stack                                       │ │
│  │  • Authentication (Clerk)                              │ │
│  │  • Rate Limiting                                       │ │
│  │  • Logging                                             │ │
│  │  • CORS                                                │ │
│  │  • Error Handling                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │  User   │    │Compliance│   │Advising │
    │ Service │    │ Service  │   │ Service │
    └─────────┘    └─────────┘    └─────────┘
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │Monitoring│   │ Support │   │Integration│
    │ Service │    │ Service │   │ Service  │
    └─────────┘    └─────────┘    └─────────┘
                      ▼
                 ┌─────────┐
                 │   AI    │
                 │ Service │
                 └─────────┘
```

## Directory Structure

```
apps/web/
├── app/
│   └── api/                          # API Gateway Routes
│       ├── user/[...path]/route.ts   # User Service Gateway
│       ├── compliance/[...path]/route.ts
│       ├── advising/[...path]/route.ts
│       ├── monitoring/[...path]/route.ts
│       ├── support/[...path]/route.ts
│       ├── integration/[...path]/route.ts
│       ├── ai/[...path]/route.ts     # AI Service with streaming
│       ├── health/route.ts           # Health check endpoint
│       └── README.md
│
├── lib/
│   ├── api/
│   │   └── routeHandler.ts           # Route handler utilities
│   │
│   ├── middleware/                   # Middleware Layer
│   │   ├── authentication.ts         # Clerk auth validation
│   │   ├── logging.ts                # Structured logging
│   │   ├── rateLimit.ts              # Rate limiting logic
│   │   ├── errorHandler.ts           # Error handling
│   │   ├── cors.ts                   # CORS configuration
│   │   └── index.ts
│   │
│   ├── services/                     # Service Clients
│   │   ├── serviceClient.ts          # Base HTTP client
│   │   ├── userService.ts            # User Service client
│   │   ├── complianceService.ts      # Compliance Service client
│   │   ├── advisingService.ts        # Advising Service client
│   │   ├── monitoringService.ts      # Monitoring Service client
│   │   ├── supportService.ts         # Support Service client
│   │   ├── integrationService.ts     # Integration Service client
│   │   ├── aiService.ts              # AI Service client (streaming)
│   │   ├── index.ts
│   │   └── README.md
│   │
│   └── types/
│       └── services/                 # TypeScript Types
│           ├── common.ts             # Shared types
│           ├── user.ts               # User Service types
│           ├── compliance.ts         # Compliance Service types
│           ├── advising.ts           # Advising Service types
│           ├── monitoring.ts         # Monitoring Service types
│           ├── support.ts            # Support Service types
│           ├── integration.ts        # Integration Service types
│           ├── ai.ts                 # AI Service types
│           └── index.ts
│
└── middleware.ts                     # Next.js middleware
```

## Implementation Details

### 1. Middleware Stack

#### Authentication (`lib/middleware/authentication.ts`)
- Validates Clerk JWT tokens
- Extracts user context (ID, role, correlation ID)
- Supports optional authentication for public routes
- Role-based access control

```typescript
const context = await validateAuth(request);
// Returns: { userId, clerkId, role, correlationId, timestamp }
```

#### Rate Limiting (`lib/middleware/rateLimit.ts`)
- Per-user, per-service rate limits
- In-memory store (Redis for production)
- Automatic cleanup of expired entries
- Rate limit headers in responses

Service limits (per minute):
- User: 100, Compliance: 50, Advising: 60
- Monitoring: 100, Support: 80, Integration: 40
- AI: 20 (expensive operations)

#### Logging (`lib/middleware/logging.ts`)
- Structured JSON logging
- Request/response logging
- Service call tracking
- Performance timing
- Error logging with stack traces

#### Error Handling (`lib/middleware/errorHandler.ts`)
- Consistent error response format
- Custom error classes
- Automatic error logging
- HTTP status code mapping

#### CORS (`lib/middleware/cors.ts`)
- Configured allowed origins
- Credentials support
- Preflight request handling
- Security headers

### 2. Service Clients

Base HTTP client with:
- Automatic retries (3 attempts with exponential backoff)
- Timeout handling (30s default, 60s for AI)
- Request/response logging
- Error handling
- Correlation ID tracking
- Health checks

Each service client provides type-safe methods:

```typescript
// User Service
userService.createUser(data, context)
userService.getProfile(userId, context)
userService.updateProfile(userId, data, context)

// Compliance Service
complianceService.checkEligibility(data, context)
complianceService.getStatus(studentId, context)

// AI Service (with streaming)
aiService.chat({ message, stream: true }, context)
aiService.getAdvisingRecommendations(data, context)
```

### 3. Route Handlers

Dynamic catch-all routes for each service:
- `/api/{service}/[...path]/route.ts`
- Forwards all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Applies full middleware stack
- Adds correlation and rate limit headers
- Special streaming support for AI service

### 4. TypeScript Types

Complete type definitions for:
- Request/response payloads
- Error responses
- Service-specific entities
- Shared types (pagination, errors, etc.)

All types are exported from `lib/types/services/index.ts`

## Configuration

### Environment Variables (.env)

```bash
# Microservices URLs
USER_SERVICE_URL=http://localhost:3001
COMPLIANCE_SERVICE_URL=http://localhost:3002
ADVISING_SERVICE_URL=http://localhost:3003
MONITORING_SERVICE_URL=http://localhost:3004
SUPPORT_SERVICE_URL=http://localhost:3005
INTEGRATION_SERVICE_URL=http://localhost:3006
AI_SERVICE_URL=http://localhost:3007

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Service URL Resolution

1. Check environment variable (e.g., `USER_SERVICE_URL`)
2. Fallback to Vercel deployment pattern
3. Development fallback to localhost with default ports

## Usage Examples

### Client-Side API Calls

```typescript
// Standard fetch
const response = await fetch('/api/compliance/check-eligibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId: 'student123' }),
});

const data = await response.json();
```

### Server-Side Service Clients

```typescript
import { userService, complianceService } from '@/lib/services';

// In a server component or API route
const profile = await userService.getProfile(userId, context);
const eligibility = await complianceService.checkEligibility(
  { studentId },
  context
);
```

### Streaming AI Responses

```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Help me choose courses',
    stream: true,
  }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Process SSE data
}
```

## API Endpoints

### Gateway Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/api/health` | Health check all services | No |
| `/api/user/*` | User Service endpoints | Yes |
| `/api/compliance/*` | Compliance Service endpoints | Yes |
| `/api/advising/*` | Advising Service endpoints | Yes |
| `/api/monitoring/*` | Monitoring Service endpoints | Yes |
| `/api/support/*` | Support Service endpoints | Yes |
| `/api/integration/*` | Integration Service endpoints | Yes |
| `/api/ai/*` | AI Service endpoints (streaming) | Yes |

### Response Format

Success:
```json
{
  "data": { /* response data */ },
  "meta": {
    "requestId": "abc123",
    "timestamp": "2024-11-08T12:00:00Z"
  }
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { /* error details */ },
    "timestamp": "2024-11-08T12:00:00Z",
    "requestId": "abc123"
  }
}
```

### Response Headers

Standard headers on all responses:
```
X-Request-Id: abc123                    # Correlation ID
X-RateLimit-Limit: 100                  # Rate limit
X-RateLimit-Remaining: 95               # Remaining requests
X-RateLimit-Reset: 1699564800000        # Reset timestamp
Access-Control-Allow-Origin: *          # CORS
```

## Features

### Authentication
- Clerk JWT validation
- User context extraction
- Role-based access control
- Token propagation to services

### Rate Limiting
- Per-user, per-service limits
- Sliding window algorithm
- Rate limit headers
- Automatic cleanup

### Logging
- Structured JSON logs
- Correlation ID tracking
- Performance metrics
- Error tracking

### Error Handling
- Consistent error format
- Custom error classes
- Automatic logging
- User-friendly messages

### Streaming
- Server-Sent Events for AI
- Efficient token streaming
- Proper connection handling

### Health Monitoring
- Individual service health
- Aggregate health status
- Performance metrics

## Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Authenticated Request
```bash
curl http://localhost:3000/api/user/profile/user123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST Request
```bash
curl http://localhost:3000/api/compliance/check-eligibility \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"studentId":"student123"}'
```

## Performance

- Request timeout: 30s (60s for AI)
- Retry attempts: 3 with exponential backoff
- Rate limits: Service-specific (20-100 req/min)
- Connection pooling: Enabled
- Response streaming: Supported for AI

## Security

- JWT authentication required (except health)
- Role-based authorization
- Rate limiting per user
- CORS protection
- Request logging for audit
- No sensitive data in logs

## Monitoring

### Metrics Collected
- Request count by service
- Response times
- Error rates
- Rate limit violations
- Authentication failures

### Logging Destinations
- Console (development)
- Sentry (errors)
- Vercel Analytics (performance)
- Custom logging service (production)

## Deployment

### Development
```bash
npm run dev
# Gateway available at http://localhost:3000/api/*
```

### Production (Vercel)
1. Services auto-discover via VERCEL_URL
2. Automatic HTTPS
3. Global edge deployment
4. Auto-scaling

## Next Steps

1. **Response Caching**: Implement Redis-based caching
2. **Circuit Breaker**: Prevent cascading failures
3. **Request Batching**: Optimize bulk operations
4. **GraphQL Gateway**: Alternative to REST
5. **WebSocket Support**: Real-time bidirectional communication
6. **Metrics Dashboard**: Visualize gateway performance
7. **API Versioning**: Support multiple API versions
8. **Request Validation**: Schema validation with Zod

## Documentation

- [API Gateway README](./app/api/README.md)
- [Service Clients README](./lib/services/README.md)
- [Design Document](../../.kiro/specs/microservices-architecture/design.md)

## Files Created

### Types (8 files)
- `lib/types/services/common.ts`
- `lib/types/services/user.ts`
- `lib/types/services/compliance.ts`
- `lib/types/services/advising.ts`
- `lib/types/services/monitoring.ts`
- `lib/types/services/support.ts`
- `lib/types/services/integration.ts`
- `lib/types/services/ai.ts`

### Middleware (6 files)
- `lib/middleware/authentication.ts`
- `lib/middleware/logging.ts`
- `lib/middleware/rateLimit.ts`
- `lib/middleware/errorHandler.ts`
- `lib/middleware/cors.ts`
- `lib/middleware/index.ts`

### Service Clients (9 files)
- `lib/services/serviceClient.ts`
- `lib/services/userService.ts`
- `lib/services/complianceService.ts`
- `lib/services/advisingService.ts`
- `lib/services/monitoringService.ts`
- `lib/services/supportService.ts`
- `lib/services/integrationService.ts`
- `lib/services/aiService.ts`
- `lib/services/index.ts`

### API Routes (8 files)
- `app/api/user/[...path]/route.ts`
- `app/api/compliance/[...path]/route.ts`
- `app/api/advising/[...path]/route.ts`
- `app/api/monitoring/[...path]/route.ts`
- `app/api/support/[...path]/route.ts`
- `app/api/integration/[...path]/route.ts`
- `app/api/ai/[...path]/route.ts`
- `app/api/health/route.ts`

### Utilities (1 file)
- `lib/api/routeHandler.ts`

### Documentation (3 files)
- `app/api/README.md`
- `lib/services/README.md`
- `API_GATEWAY.md` (this file)

**Total: 35 files created**
