# Service Client Guide

Quick reference for using the service client library in AI tools.

## Installation

```typescript
import { 
  userService,
  monitoringService,
  complianceService,
  advisingService,
  integrationService,
  supportService
} from '@aah/ai'
```

## User Service

### Get Profile
```typescript
const profile = await userService.getProfile(userId, context)
// Returns: { id, clerkId, email, role, firstName, lastName, studentProfile, ... }
```

### Get Roles
```typescript
const roles = await userService.getRoles(userId, context)
// Returns: { userId, role, permissions[], studentProfile }
```

### Update Profile
```typescript
const updated = await userService.updateProfile(
  userId,
  { firstName: 'Jane', lastName: 'Doe' },
  context
)
```

## Monitoring Service

### Get Academic Records
```typescript
const records = await monitoringService.getAcademicRecords(
  studentId,
  {
    semester: 'Fall 2024',      // optional
    includeInProgress: true      // optional
  },
  context
)
```

### Get Performance Metrics
```typescript
const metrics = await monitoringService.getPerformanceMetrics(
  studentId,
  'semester',  // 'current' | 'semester' | 'year' | 'all'
  context
)
```

### Get Attendance
```typescript
const attendance = await monitoringService.getAttendance(studentId, context)
```

## Compliance Service

### Check Eligibility
```typescript
const eligibility = await complianceService.checkEligibility(studentId, context)
```

### Search NCAA Rules
```typescript
const rules = await complianceService.searchRules(
  'academic eligibility',
  {
    category: 'academic',  // optional
    limit: 10              // optional
  },
  context
)
```

### Simulate Scenario
```typescript
const simulation = await complianceService.simulateScenario(
  studentId,
  {
    hypotheticalGPA: 3.5,
    hypotheticalCredits: 90,
    plannedCourses: ['BUS401', 'MATH301']
  },
  context
)
```

### Get Compliance History
```typescript
const history = await complianceService.getHistory(studentId, context)
```

## Advising Service

### Search Courses
```typescript
const courses = await advisingService.searchCourses(
  {
    term: 'calculus',
    subject: 'MATH',
    level: '300',
    credits: 3
  },
  context
)
```

### Check Conflicts
```typescript
const conflicts = await advisingService.checkConflicts(
  studentId,
  ['BUS401', 'MATH301', 'ENG201'],
  context
)
```

### Get Degree Requirements
```typescript
const requirements = await advisingService.getDegreeRequirements(studentId, context)
```

### Calculate Progress
```typescript
const progress = await advisingService.calculateProgress(studentId, context)
```

### Get Prerequisites
```typescript
const prereqs = await advisingService.getPrerequisites('BUS401', context)
```

### Get Recommendations
```typescript
const recommendations = await advisingService.getRecommendations(
  studentId,
  {
    semester: 'Spring 2025',
    maxCredits: 15
  },
  context
)
```

## Integration Service

### Send Email
```typescript
const result = await integrationService.sendEmail(
  {
    to: 'student@university.edu',
    subject: 'Academic Update',
    body: 'Your progress report is ready...',
    cc: ['advisor@university.edu'],
    bcc: ['admin@university.edu']
  },
  context
)
```

### Generate Travel Letter
```typescript
const letter = await integrationService.generateTravelLetter(
  studentId,
  {
    startDate: '2024-11-20',
    endDate: '2024-11-22',
    destination: 'State University',
    courses: ['BUS401', 'MATH301']
  },
  context
)
```

### Schedule Event
```typescript
const event = await integrationService.scheduleEvent(
  {
    title: 'Academic Advising Session',
    description: 'Discuss spring semester courses',
    startTime: '2024-11-15T14:00:00Z',
    endTime: '2024-11-15T15:00:00Z',
    attendees: ['student@university.edu', 'advisor@university.edu'],
    location: 'Academic Center, Room 201'
  },
  context
)
```

### Get Athletic Schedule
```typescript
const schedule = await integrationService.getAthleticSchedule(
  studentId,
  {
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    eventType: 'game'  // 'all' | 'practice' | 'game' | 'travel'
  },
  context
)
```

## Support Service

### Create Support Request
```typescript
const request = await supportService.createRequest(
  {
    studentId: 'S12345',
    type: 'tutoring',
    priority: 'high',
    description: 'Need help with calculus'
  },
  context
)
```

### Schedule Tutoring
```typescript
const session = await supportService.scheduleTutoring(
  {
    studentId: 'S12345',
    subject: 'Mathematics',
    date: '2024-11-15',
    duration: 60  // minutes
  },
  context
)
```

### Get Resources
```typescript
const resources = await supportService.getResources('academic', context)
```

## Error Handling

All service methods can throw `ServiceClientError`:

```typescript
import { ServiceClientError } from '@aah/ai'

try {
  const profile = await userService.getProfile(userId, context)
  return profile
} catch (error) {
  if (error instanceof ServiceClientError) {
    console.error(`Service: ${error.service}`)
    console.error(`Status: ${error.statusCode}`)
    console.error(`Message: ${error.message}`)
    console.error(`Details:`, error.details)
  }
  
  // Return error object instead of throwing
  return {
    error: true,
    message: 'Failed to retrieve profile',
    details: error.message
  }
}
```

## Context Parameter

The `context` parameter provides authentication and user information:

```typescript
interface ToolExecutionContext {
  userId: string           // Current user ID
  permissions: string[]    // User permissions
  metadata?: Record<string, any>
}

// Example
const context = {
  userId: 'user123',
  permissions: ['read:student', 'read:grades']
}
```

## Environment Variables

Configure service URLs in `.env`:

```bash
USER_SERVICE_URL=http://localhost:3001
MONITORING_SERVICE_URL=http://localhost:3004
COMPLIANCE_SERVICE_URL=http://localhost:3002
ADVISING_SERVICE_URL=http://localhost:3003
INTEGRATION_SERVICE_URL=http://localhost:3006
SUPPORT_SERVICE_URL=http://localhost:3005
```

## Best Practices

### 1. Always Handle Errors
```typescript
try {
  const data = await service.method(params, context)
  return data
} catch (error) {
  return { error: true, message: 'Operation failed', details: error.message }
}
```

### 2. Use Type Safety
```typescript
// TypeScript will catch errors
const profile: UserProfile = await userService.getProfile(userId, context)
```

### 3. Pass Context
```typescript
// Always pass context for authentication
const data = await service.method(params, context)
```

### 4. Validate Responses
```typescript
const data = await service.method(params, context)
if ('error' in data) {
  // Handle error response
}
```

## Testing

### Mock Service Responses
```typescript
import { userService } from '@aah/ai'

// Mock for testing
jest.mock('@aah/ai', () => ({
  userService: {
    getProfile: jest.fn().mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      // ...
    })
  }
}))
```

### Integration Testing
```bash
# Start all services
turbo run dev

# Run tests
npm test
```

## Common Patterns

### Fetch Multiple Related Data
```typescript
async function getStudentOverview(studentId: string, context: ToolExecutionContext) {
  const [profile, records, schedule] = await Promise.all([
    userService.getProfile(studentId, context),
    monitoringService.getAcademicRecords(studentId, {}, context),
    integrationService.getAthleticSchedule(studentId, {}, context)
  ])
  
  return { profile, records, schedule }
}
```

### Conditional Data Fetching
```typescript
async function getStudentData(studentId: string, includeHistory: boolean, context: ToolExecutionContext) {
  const profile = await userService.getProfile(studentId, context)
  
  let history
  if (includeHistory) {
    history = await monitoringService.getAcademicRecords(studentId, {}, context)
  }
  
  return { profile, history }
}
```

### Error Recovery
```typescript
async function getDataWithFallback(studentId: string, context: ToolExecutionContext) {
  try {
    return await userService.getProfile(studentId, context)
  } catch (error) {
    // Try alternative source
    console.warn('Primary service failed, trying fallback')
    return await fallbackService.getProfile(studentId, context)
  }
}
```

## Troubleshooting

### Service Not Responding
```bash
# Check if service is running
curl http://localhost:3001/health

# Check logs
turbo run dev --filter=@aah/service-user
```

### Authentication Errors
```typescript
// Ensure context has userId
const context = {
  userId: 'user123',
  permissions: ['read:student']
}
```

### Type Errors
```bash
# Rebuild package
turbo run build --filter=@aah/ai

# Check types
npx tsc --noEmit
```

## Support

- Documentation: `packages/ai/README.md`
- Examples: `packages/ai/examples/`
- Issues: GitHub Issues
- Slack: #ai-development
