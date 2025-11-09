# API Gateway

The API Gateway is a centralized entry point for all microservices in the Academic Athletics SaaS platform. It handles authentication, rate limiting, logging, CORS, and request forwarding to backend services.

## Architecture

```
Client → API Gateway → Microservices
         │
         ├── Authentication (Clerk)
         ├── Rate Limiting
         ├── Logging
         ├── CORS
         └── Error Handling
```

## Gateway Routes

All routes follow the pattern: `/api/{service}/{...path}`

### Available Services

- **User Service**: `/api/user/*`
  - User management, authentication, roles

- **Compliance Service**: `/api/compliance/*`
  - NCAA eligibility validation, rule engine

- **Advising Service**: `/api/advising/*`
  - Course scheduling, degree progress, recommendations

- **Monitoring Service**: `/api/monitoring/*`
  - Performance tracking, alerts, interventions

- **Support Service**: `/api/support/*`
  - Tutoring, study halls, workshops, mentoring

- **Integration Service**: `/api/integration/*`
  - External integrations (email, calendar, LMS, SIS)

- **AI Service**: `/api/ai/*`
  - Conversational AI, RAG, predictive analytics (with streaming)

## Features

### 1. Authentication

All requests (except public endpoints) require Clerk authentication:

```typescript
// Automatic authentication via Clerk middleware
// Headers added:
// - X-User-Id: Clerk user ID
// - X-User-Role: User role from metadata
// - X-Correlation-Id: Request tracking ID
```

### 2. Rate Limiting

Service-specific rate limits (per user per minute):

- User Service: 100 req/min
- Compliance Service: 50 req/min
- Advising Service: 60 req/min
- Monitoring Service: 100 req/min
- Support Service: 80 req/min
- Integration Service: 40 req/min
- AI Service: 20 req/min (AI is expensive)

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800000
```

### 3. Error Handling

Consistent error responses across all services:

```typescript
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No authentication token provided",
    "timestamp": "2024-11-08T12:00:00Z",
    "requestId": "abc123"
  }
}
```

Error codes:
- `UNAUTHORIZED` (401): Missing or invalid auth token
- `FORBIDDEN` (403): Insufficient permissions
- `VALIDATION_ERROR` (400): Invalid request data
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `SERVICE_ERROR` (500+): Service failure
- `INTERNAL_ERROR` (500): Unexpected error

### 4. CORS

Configured CORS headers for web clients:
- Credentials: Allowed
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin

### 5. Logging

Structured logging for all requests:
```typescript
{
  "level": "INFO",
  "message": "Request completed",
  "timestamp": "2024-11-08T12:00:00Z",
  "correlationId": "abc123",
  "userId": "user_123",
  "metadata": {
    "statusCode": 200,
    "duration": "123ms"
  }
}
```

### 6. Streaming Support (AI Service)

The AI service supports streaming responses for chat endpoints:

```typescript
// Request with stream: true
{
  "message": "Help me choose courses",
  "stream": true
}

// Response: text/event-stream
data: {"content": "Based", "done": false}
data: {"content": " on your", "done": false}
data: {"content": " history...", "done": true}
```

## Usage

### Client-Side (React)

```typescript
import { aiService } from '@/lib/services';

// Non-streaming request
async function askQuestion(question: string) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: question,
      stream: false,
    }),
  });

  return await response.json();
}

// Streaming request
async function* streamChat(question: string) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: question,
      stream: true,
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        yield data;
      }
    }
  }
}
```

### Server-Side (Service Clients)

```typescript
import { userService, complianceService } from '@/lib/services';

// Get user profile
const profile = await userService.getProfile(userId, context);

// Check eligibility
const eligibility = await complianceService.checkEligibility(
  { studentId: 'student123' },
  context
);
```

## Health Check

Check gateway and all services health:

```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-08T12:00:00Z",
  "duration": 123,
  "services": {
    "user": { "status": "healthy" },
    "compliance": { "status": "healthy" },
    "advising": { "status": "healthy" },
    "monitoring": { "status": "healthy" },
    "support": { "status": "healthy" },
    "integration": { "status": "healthy" },
    "ai": { "status": "healthy" }
  }
}
```

## Configuration

Environment variables (`.env`):

```bash
# Service URLs (defaults to localhost in dev)
USER_SERVICE_URL=http://localhost:3001
COMPLIANCE_SERVICE_URL=http://localhost:3002
ADVISING_SERVICE_URL=http://localhost:3003
MONITORING_SERVICE_URL=http://localhost:3004
SUPPORT_SERVICE_URL=http://localhost:3005
INTEGRATION_SERVICE_URL=http://localhost:3006
AI_SERVICE_URL=http://localhost:3007

# App URL (for CORS)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Development

### Testing Locally

1. Start all microservices on their respective ports
2. Start the Next.js app: `npm run dev`
3. Gateway will be available at `http://localhost:3000/api/*`

### Testing with curl

```bash
# Health check
curl http://localhost:3000/api/health

# Get user profile (with auth)
curl http://localhost:3000/api/user/profile/user123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check eligibility
curl http://localhost:3000/api/compliance/check-eligibility \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"studentId":"student123"}'
```

## Performance

- **Request timeout**: 30s default (60s for AI service)
- **Retry logic**: 3 retries with exponential backoff
- **Connection pooling**: Enabled for all services
- **Response caching**: Coming soon

## Security

- All routes require authentication (Clerk JWT)
- Role-based access control via user metadata
- Rate limiting per user and service
- CORS protection
- Request/response logging for audit trail
- Correlation IDs for distributed tracing

## Monitoring

The gateway automatically logs:
- Request/response details
- Error stack traces
- Service call latencies
- Rate limit violations
- Authentication failures

Logs are structured JSON and can be sent to:
- Sentry (error tracking)
- Datadog (APM)
- CloudWatch (AWS)
- Vercel Analytics

## Next Steps

1. Implement response caching with Redis
2. Add circuit breaker for failing services
3. Implement request batching for bulk operations
4. Add GraphQL gateway option
5. Implement WebSocket support for real-time features
