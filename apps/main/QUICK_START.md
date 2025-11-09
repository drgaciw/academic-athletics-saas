# API Gateway Quick Start Guide

Quick reference for using the API Gateway in your Next.js application.

## Table of Contents
- [Setup](#setup)
- [Making API Calls](#making-api-calls)
- [Using Service Clients](#using-service-clients)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Streaming Responses](#streaming-responses)

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set your service URLs (defaults work for local dev):

```bash
USER_SERVICE_URL=http://localhost:3001
COMPLIANCE_SERVICE_URL=http://localhost:3002
# ... etc
```

### 2. Start Services

Make sure all microservices are running on their respective ports before starting the gateway.

### 3. Start Gateway

```bash
npm run dev
# Gateway available at http://localhost:3000/api/*
```

## Making API Calls

### Client-Side (React Components)

```tsx
'use client';

import { useState } from 'react';

export function UserProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/profile/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... render component
}
```

### Server-Side (Server Components, API Routes)

```tsx
// Server Component
import { userService } from '@/lib/services';
import { validateAuth } from '@/lib/middleware';

export default async function ProfilePage({ userId }: { userId: string }) {
  // Get auth context
  const context = await validateAuth(request);

  // Fetch data
  const profile = await userService.getProfile(userId, context);

  return <div>{profile.firstName} {profile.lastName}</div>;
}
```

```typescript
// API Route
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/routeHandler';
import { userService } from '@/lib/services';

export const GET = createRouteHandler(
  async (request, context, params) => {
    const profile = await userService.getProfile(params.id, context);
    return NextResponse.json(profile);
  },
  { serviceName: 'user' }
);
```

## Using Service Clients

### Import Services

```typescript
import {
  userService,
  complianceService,
  advisingService,
  monitoringService,
  supportService,
  integrationService,
  aiService,
} from '@/lib/services';
```

### User Service Examples

```typescript
// Get user profile
const profile = await userService.getProfile(userId, context);

// Update profile
const updated = await userService.updateProfile(
  userId,
  { firstName: 'John', lastName: 'Doe' },
  context
);

// Get user roles
const roles = await userService.getRoles(userId, context);
```

### Compliance Service Examples

```typescript
// Check eligibility
const eligibility = await complianceService.checkEligibility(
  { studentId: 'student123', termId: 'fall_2024' },
  context
);

if (!eligibility.isEligible) {
  console.log('Violations:', eligibility.violations);
}

// Get compliance status
const status = await complianceService.getStatus('student123', context);
```

### Advising Service Examples

```typescript
// Generate schedule
const schedule = await advisingService.generateSchedule(
  {
    studentId: 'student123',
    termId: 'spring_2025',
    constraints: {
      maxCredits: 15,
      athleticSchedule: [/* ... */],
    },
  },
  context
);

// Get recommendations
const recommendations = await advisingService.getRecommendations(
  { studentId: 'student123', termId: 'spring_2025', useAI: true },
  context
);

// Track degree progress
const progress = await advisingService.getDegreeProgress('student123', context);
console.log(`${progress.percentComplete}% complete`);
```

### Monitoring Service Examples

```typescript
// Get performance metrics
const metrics = await monitoringService.getPerformance('student123', context);

// Submit progress report
const report = await monitoringService.submitProgressReport(
  {
    studentId: 'student123',
    courseId: 'MATH201',
    reportedBy: 'faculty456',
    currentGrade: 'B',
    attendance: 'GOOD',
    participation: 'EXCELLENT',
  },
  context
);

// Get alerts
const alerts = await monitoringService.getAlerts('student123', context);

// Create intervention
const intervention = await monitoringService.createIntervention(
  {
    studentId: 'student123',
    type: 'ACADEMIC',
    goals: ['Improve GPA to 3.0'],
    actions: [{ description: 'Weekly tutoring', dueDate: '2024-12-01' }],
  },
  context
);
```

### AI Service Examples

```typescript
// Non-streaming chat
const response = await aiService.chat(
  {
    message: 'What courses should I take?',
    context: { studentId: 'student123' },
    stream: false,
  },
  context
);

console.log(response.content);

// Get recommendations
const aiRecs = await aiService.getAdvisingRecommendations(
  {
    studentId: 'student123',
    termId: 'spring_2025',
    major: 'Computer Science',
  },
  context
);

// Analyze compliance
const analysis = await aiService.analyzeCompliance(
  {
    query: 'Can I take 9 credits if my GPA is 2.8?',
    contextType: 'CONTINUING',
  },
  context
);

// Predict risk
const risk = await aiService.predictRisk(
  { studentId: 'student123', includeAiPrediction: true },
  context
);
```

## Common Patterns

### Pattern 1: Fetch and Display

```tsx
'use client';

import { useEffect, useState } from 'react';

export function StudentDashboard({ studentId }: { studentId: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/user/profile/${studentId}`).then(r => r.json()),
      fetch(`/api/compliance/status/${studentId}`).then(r => r.json()),
      fetch(`/api/monitoring/performance/${studentId}`).then(r => r.json()),
    ])
      .then(([profile, compliance, performance]) => {
        setData({ profile, compliance, performance });
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div>Loading...</div>;
  return <div>{/* Render dashboard */}</div>;
}
```

### Pattern 2: Form Submission

```tsx
'use client';

import { useState } from 'react';

export function ProgressReportForm({ studentId }: { studentId: string }) {
  const [formData, setFormData] = useState({
    courseId: '',
    currentGrade: '',
    attendance: 'GOOD',
    participation: 'GOOD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/monitoring/progress-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        reportedBy: currentUserId,
        ...formData,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(`Report submitted! ${result.alertsGenerated.length} alerts generated`);
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Pattern 3: Server-Side Data Fetching

```tsx
// app/student/[id]/page.tsx
import { userService, complianceService } from '@/lib/services';
import { validateAuth } from '@/lib/middleware';

export default async function StudentPage({ params }: { params: { id: string } }) {
  const context = await validateAuth(request);

  // Fetch in parallel
  const [profile, compliance] = await Promise.all([
    userService.getProfile(params.id, context),
    complianceService.getStatus(params.id, context),
  ]);

  return (
    <div>
      <h1>{profile.firstName} {profile.lastName}</h1>
      <p>Eligibility: {compliance.isEligible ? 'Eligible' : 'Ineligible'}</p>
    </div>
  );
}
```

### Pattern 4: React Query Integration

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

function useStudentProfile(studentId: string) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });
}

export function StudentProfile({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useStudentProfile(studentId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.firstName} {data.lastName}</div>;
}
```

## Error Handling

### Client-Side Error Handling

```typescript
try {
  const response = await fetch('/api/user/profile/123');

  if (!response.ok) {
    const error = await response.json();

    switch (error.error.code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        window.location.href = '/login';
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Show rate limit message
        alert('Too many requests. Please try again later.');
        break;
      case 'NOT_FOUND':
        // Show 404 page
        break;
      default:
        // Show generic error
        alert(`Error: ${error.error.message}`);
    }

    return;
  }

  const data = await response.json();
  // Process data
} catch (err) {
  console.error('Network error:', err);
}
```

### Server-Side Error Handling

```typescript
import { ServiceError } from '@/lib/middleware';

try {
  const profile = await userService.getProfile(userId, context);
} catch (error) {
  if (error instanceof ServiceError) {
    console.error(`Service error: ${error.serviceName} - ${error.message}`);

    // Return appropriate response
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  throw error; // Re-throw unexpected errors
}
```

## Streaming Responses

### AI Chat with Streaming

```tsx
'use client';

import { useState } from 'react';

export function ChatInterface() {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [streaming, setStreaming] = useState(false);

  const sendMessage = async (message: string) => {
    setStreaming(true);
    setCurrentMessage('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, stream: true }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            accumulated += data.content;
            setCurrentMessage(accumulated);

            if (data.done) {
              setMessages(prev => [...prev, accumulated]);
              setCurrentMessage('');
            }
          }
        }
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
      {currentMessage && <div>{currentMessage}</div>}
      {/* Input field */}
    </div>
  );
}
```

## TypeScript Tips

### Import Types

```typescript
import type {
  UserProfile,
  StudentProfile,
  EligibilityCheckResponse,
  ScheduleResponse,
  Alert,
  ChatResponse,
} from '@/lib/types/services';
```

### Type-Safe Fetch

```typescript
async function fetchProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`/api/user/profile/${userId}`);
  return response.json();
}
```

### Type Guards

```typescript
function isEligible(status: EligibilityCheckResponse): boolean {
  return status.isEligible && status.violations.length === 0;
}
```

## Testing

### Testing with curl

```bash
# Health check
curl http://localhost:3000/api/health

# GET with auth
curl http://localhost:3000/api/user/profile/user123 \
  -H "Authorization: Bearer TOKEN"

# POST with auth
curl http://localhost:3000/api/compliance/check-eligibility \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"studentId":"student123"}'
```

### Testing with Postman

1. Create collection: "AAH API Gateway"
2. Set base URL: `http://localhost:3000/api`
3. Add auth header: `Authorization: Bearer {{token}}`
4. Test endpoints

## Debugging

### Enable Debug Logging

Set `NODE_ENV=development` to see detailed logs:

```bash
NODE_ENV=development npm run dev
```

### Check Rate Limits

Response headers show rate limit status:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699564800000
```

### Correlation IDs

Every request gets a correlation ID for tracing:

```
X-Request-Id: 1699564800123-abc123
```

Use this ID to search logs across services.

## Best Practices

1. **Always handle errors** - Don't assume requests will succeed
2. **Use TypeScript types** - Import types for better IDE support
3. **Implement loading states** - Show users when data is fetching
4. **Cache responses** - Use React Query or SWR for caching
5. **Handle rate limits** - Show friendly messages when rate limited
6. **Use correlation IDs** - Log them for debugging
7. **Test error cases** - Test what happens when services are down
8. **Optimize parallel requests** - Use Promise.all for independent requests

## Common Issues

### Issue: CORS errors
**Solution**: Make sure `NEXT_PUBLIC_APP_URL` is set correctly

### Issue: Rate limit exceeded
**Solution**: Reduce request frequency or request limit increase

### Issue: Authentication failed
**Solution**: Check Clerk configuration and token validity

### Issue: Service unreachable
**Solution**: Verify service URL and ensure service is running

### Issue: Slow responses
**Solution**: Check service health, optimize queries, enable caching

## Resources

- [API Gateway README](./app/api/README.md)
- [Service Clients README](./lib/services/README.md)
- [Full Documentation](./API_GATEWAY.md)
- [Design Document](../.kiro/specs/microservices-architecture/design.md)
