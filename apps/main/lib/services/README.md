# Service Clients

Type-safe client libraries for all microservices. These clients handle HTTP communication, error handling, retries, and request/response typing.

## Overview

Each service has a dedicated client with fully typed methods:

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

## Usage Examples

### User Service

```typescript
import { userService } from '@/lib/services';
import { UserRole } from '@/lib/types/services';

// Create user
const user = await userService.createUser(
  {
    clerkId: 'user_123',
    email: 'student@university.edu',
    role: UserRole.STUDENT,
    firstName: 'John',
    lastName: 'Doe',
  },
  context
);

// Get profile
const profile = await userService.getProfile('user_123', context);

// Update profile
const updated = await userService.updateProfile(
  'user_123',
  { aiOptIn: true },
  context
);

// Get roles
const roles = await userService.getRoles('user_123', context);
```

### Compliance Service

```typescript
import { complianceService } from '@/lib/services';

// Check eligibility
const eligibility = await complianceService.checkEligibility(
  {
    studentId: 'student_123',
    termId: 'fall_2024',
  },
  context
);

console.log(eligibility.isEligible); // true/false
console.log(eligibility.violations); // Array of violations

// Get current status
const status = await complianceService.getStatus('student_123', context);

// Check initial eligibility (freshmen)
const initial = await complianceService.checkInitialEligibility(
  {
    studentId: 'student_123',
    coreCoursesCount: 16,
    coreGpa: 3.2,
    satScore: 1100,
  },
  context
);

// Get audit log
const auditLog = await complianceService.getAuditLog('student_123', context);
```

### Advising Service

```typescript
import { advisingService } from '@/lib/services';

// Generate schedule
const schedule = await advisingService.generateSchedule(
  {
    studentId: 'student_123',
    termId: 'spring_2025',
    preferredCourses: ['MATH201', 'ENGL102'],
    constraints: {
      maxCredits: 15,
      athleticSchedule: [
        {
          dayOfWeek: 'MON',
          startTime: '14:00',
          endTime: '17:00',
          type: 'PRACTICE',
        },
      ],
    },
  },
  context
);

console.log(schedule.schedule); // Array of courses
console.log(schedule.conflicts); // Array of conflicts
console.log(schedule.totalCredits); // 15

// Get recommendations
const recommendations = await advisingService.getRecommendations(
  {
    studentId: 'student_123',
    termId: 'spring_2025',
    major: 'Computer Science',
    useAI: true,
  },
  context
);

// Track degree progress
const progress = await advisingService.getDegreeProgress(
  'student_123',
  context
);

console.log(`${progress.percentComplete}% complete`);
console.log(`${progress.creditsCompleted}/${progress.totalCreditsRequired} credits`);
```

### Monitoring Service

```typescript
import { monitoringService } from '@/lib/services';

// Get performance metrics
const metrics = await monitoringService.getPerformance('student_123', context);

console.log(`GPA: ${metrics.cumulativeGpa}`);
console.log(`Attendance: ${metrics.attendanceRate}%`);

// Submit progress report
const report = await monitoringService.submitProgressReport(
  {
    studentId: 'student_123',
    courseId: 'MATH201',
    reportedBy: 'faculty_456',
    currentGrade: 'C',
    attendance: 'FAIR',
    participation: 'GOOD',
    concerns: 'Student is struggling with recent material',
  },
  context
);

console.log('Alerts generated:', report.alertsGenerated);

// Get alerts
const alerts = await monitoringService.getAlerts('student_123', context);

// Create intervention plan
const intervention = await monitoringService.createIntervention(
  {
    studentId: 'student_123',
    type: 'ACADEMIC',
    goals: ['Improve math grade to B', 'Attend tutoring sessions'],
    actions: [
      {
        description: 'Schedule weekly tutoring',
        assignedTo: 'tutor_789',
        dueDate: '2024-12-01',
      },
    ],
  },
  context
);

// Get team analytics
const analytics = await monitoringService.getTeamAnalytics(
  'football',
  context
);

console.log(`Team GPA: ${analytics.averageGpa}`);
console.log(`Eligibility Rate: ${analytics.eligibilityRate}%`);

// Assess risk
const risk = await monitoringService.assessRisk(
  {
    studentId: 'student_123',
    includeAiPrediction: true,
  },
  context
);

console.log(`Risk Level: ${risk.riskLevel}`);
console.log(`Risk Score: ${risk.riskScore}`);
```

### Support Service

```typescript
import { supportService } from '@/lib/services';

// Book tutoring session
const session = await supportService.bookTutoring(
  {
    studentId: 'student_123',
    courseId: 'MATH201',
    preferredDate: '2024-11-10',
    preferredTime: '15:00',
    duration: 60,
    notes: 'Need help with derivatives',
  },
  context
);

// Check tutor availability
const availability = await supportService.getTutorAvailability(
  'MATH201',
  context
);

// Check in to study hall
const checkin = await supportService.checkInStudyHall(
  {
    studentId: 'student_123',
    location: 'Library Room 201',
  },
  context
);

// Get attendance records
const attendance = await supportService.getAttendance('student_123', context);

console.log(`${attendance.totalHours}/${attendance.requiredHours} hours`);

// Register for workshop
const registration = await supportService.registerWorkshop(
  {
    studentId: 'student_123',
    workshopId: 'workshop_456',
  },
  context
);

// Get workshops
const workshops = await supportService.getWorkshops(context);

// Get mentor matches
const matches = await supportService.getMentorMatches('student_123', context);
```

### Integration Service

```typescript
import { integrationService } from '@/lib/services';

// Generate travel letter
const travelLetter = await integrationService.generateTravelLetter(
  {
    studentId: 'student_123',
    travelDates: {
      departureDate: '2024-11-15',
      returnDate: '2024-11-17',
    },
    destination: 'University of Michigan',
    courses: ['MATH201', 'ENGL102'],
    reason: 'Basketball game',
  },
  context
);

console.log('Download:', travelLetter.documentUrl);

// Send absence notification
await integrationService.sendAbsenceNotification(
  {
    studentId: 'student_123',
    facultyId: 'faculty_456',
    courseId: 'MATH201',
    absenceDates: ['2024-11-15', '2024-11-16'],
    reason: 'Athletic travel',
    expectedReturn: '2024-11-18',
  },
  context
);

// Send email
const emailResult = await integrationService.sendEmail(
  {
    to: 'student@university.edu',
    subject: 'Tutoring Session Scheduled',
    html: '<p>Your tutoring session is scheduled for tomorrow at 3 PM.</p>',
  },
  context
);

// Sync with LMS
const lmsData = await integrationService.syncLMS(
  {
    provider: 'CANVAS',
    studentId: 'student_123',
  },
  context
);

console.log('Courses:', lmsData.courses);
console.log('Assignments:', lmsData.assignments);
console.log('Grades:', lmsData.grades);

// Get transcript
const transcript = await integrationService.getTranscript(
  'student_123',
  'PDF',
  context
);

console.log('Download:', transcript.documentUrl);
```

### AI Service

```typescript
import { aiService } from '@/lib/services';

// Chat (non-streaming)
const chat = await aiService.chat(
  {
    message: 'What courses should I take next semester?',
    context: {
      studentId: 'student_123',
      pageContext: 'course-selection',
    },
    stream: false,
  },
  context
);

console.log(chat.content);
console.log('Sources:', chat.sources);

// Chat (streaming)
const stream = await aiService.chat(
  {
    message: 'Explain NCAA eligibility rules',
    stream: true,
  },
  context
);

// Handle stream (ReadableStream<Uint8Array>)
const reader = stream.getReader();
// ... process stream chunks

// Get conversation history
const history = await aiService.getConversationHistory(
  'conv_123',
  context
);

// AI course recommendations
const aiRecommendations = await aiService.getAdvisingRecommendations(
  {
    studentId: 'student_123',
    termId: 'spring_2025',
    major: 'Computer Science',
    academicHistory: {
      completedCourses: ['CS101', 'MATH151'],
      currentCourses: ['CS201'],
      gpa: 3.5,
      creditHours: 45,
    },
  },
  context
);

console.log('AI Recommendations:', aiRecommendations.recommendations);
console.log('Reasoning:', aiRecommendations.reasoning);
console.log('Confidence:', aiRecommendations.confidence);

// Compliance analysis
const complianceAnalysis = await aiService.analyzeCompliance(
  {
    query: 'Can I take 9 credits this semester if my GPA is 2.8?',
    studentId: 'student_123',
    contextType: 'CONTINUING',
  },
  context
);

console.log('Answer:', complianceAnalysis.answer);
console.log('Relevant Rules:', complianceAnalysis.relevantRules);

// Generate report
const report = await aiService.generateReport(
  {
    reportType: 'STUDENT_SUMMARY',
    parameters: { studentId: 'student_123' },
    format: 'MARKDOWN',
  },
  context
);

// Predict risk
const prediction = await aiService.predictRisk(
  {
    studentId: 'student_123',
    timeframe: 'NEXT_TERM',
    includeFactors: true,
  },
  context
);

console.log(`Risk: ${prediction.riskLevel} (${prediction.riskScore})`);
console.log('Predictions:', prediction.predictions);

// Submit agentic task
const task = await aiService.submitAgentTask(
  {
    taskType: 'SCHEDULE_OPTIMIZATION',
    parameters: {
      studentId: 'student_123',
      termId: 'spring_2025',
    },
    priority: 'HIGH',
  },
  context
);

// Check task status
const taskStatus = await aiService.getAgentTaskStatus(task.taskId, context);

console.log(`Status: ${taskStatus.status} (${taskStatus.progress}%)`);

// Search knowledge base
const knowledge = await aiService.searchKnowledge(
  {
    query: 'NCAA academic eligibility requirements',
    limit: 5,
  },
  context
);

console.log('Results:', knowledge.results);

// Submit feedback
await aiService.submitFeedback(
  {
    messageId: 'msg_123',
    conversationId: 'conv_456',
    rating: 5,
    helpful: true,
    feedback: 'Very helpful explanation!',
  },
  context
);
```

## Request Context

All service methods require a `RequestContext` object that contains:

```typescript
interface RequestContext {
  userId: string;        // User ID
  clerkId: string;       // Clerk user ID
  role: UserRole;        // User role (STUDENT, ADVISOR, etc.)
  correlationId: string; // Request tracking ID
  timestamp: Date;       // Request timestamp
}
```

This context is automatically provided by the API Gateway's authentication middleware.

## Error Handling

All service methods throw typed errors:

```typescript
try {
  const profile = await userService.getProfile('user_123', context);
} catch (error) {
  if (error instanceof ServiceError) {
    console.error('Service error:', error.message);
    console.error('Status code:', error.statusCode);
    console.error('Service:', error.serviceName);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration

Service URLs are automatically configured from environment variables:

```bash
USER_SERVICE_URL=http://localhost:3001
COMPLIANCE_SERVICE_URL=http://localhost:3002
# ... etc
```

In production on Vercel, these are auto-configured based on the deployment URL.

## Features

- Type-safe requests and responses
- Automatic retry with exponential backoff
- Request timeout handling
- Error handling and logging
- Correlation ID tracking
- Health checks for all services
- Streaming support for AI service

## Best Practices

1. Always pass request context for proper logging and tracking
2. Handle errors gracefully with try-catch
3. Use streaming for AI chat for better UX
4. Check service health before critical operations
5. Use typed imports for better IDE support
