# Monitoring Service

The Monitoring Service is responsible for academic performance tracking, progress reports, early intervention alerts, and team analytics for the Academic Athletics Hub (AAH) platform.

## Features

- **Performance Tracking**: Track GPA, credit hours, attendance, and study hours
- **Progress Reports**: Faculty progress report submission and management
- **Alert Engine**: Threshold-based alert generation with severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- **Intervention Plans**: Create and track intervention plans for at-risk students
- **Team Analytics**: Aggregate analytics for teams and sports
- **Risk Assessment**: AI-powered risk assessment integration
- **Real-time Notifications**: WebSocket notifications via Pusher

## Architecture

### Technology Stack

- **Framework**: Hono (lightweight, fast, serverless-optimized)
- **Database**: Prisma with Vercel Postgres
- **Real-time**: Pusher for WebSocket notifications
- **Validation**: Zod for input validation
- **AI Integration**: Calls AI Service for risk predictions
- **Deployment**: Vercel Serverless Functions

### Service Components

```
monitoring/
├── src/
│   ├── index.ts              # Main application
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── lib/
│   │   ├── pusher.ts         # Pusher integration
│   │   └── thresholds.ts     # Alert threshold configurations
│   ├── services/
│   │   ├── performanceTracker.ts   # GPA, credit hours, attendance metrics
│   │   ├── alertEngine.ts          # Alert generation and management
│   │   ├── progressReport.ts       # Faculty progress reports
│   │   ├── interventionService.ts  # Intervention plan management
│   │   └── analyticsService.ts     # Team analytics aggregation
│   └── routes/
│       ├── performance.ts    # Performance metrics API
│       ├── reports.ts        # Progress reports API
│       ├── alerts.ts         # Alerts API
│       ├── intervention.ts   # Intervention plans API
│       ├── analytics.ts      # Team analytics API
│       └── risk.ts           # Risk assessment API (AI integration)
```

## API Endpoints

### Performance Metrics

- `GET /api/monitoring/performance/:studentId` - Get student performance metrics
- `GET /api/monitoring/performance/:studentId/history` - Get performance history
- `POST /api/monitoring/performance/:studentId` - Record performance metric

### Progress Reports

- `POST /api/monitoring/progress-report` - Submit faculty progress report
- `GET /api/monitoring/progress-report/student/:studentId` - Get student reports
- `GET /api/monitoring/progress-report/:reportId` - Get specific report
- `PUT /api/monitoring/progress-report/:reportId/review` - Review report
- `GET /api/monitoring/progress-report/instructor/:instructorId` - Get instructor reports
- `GET /api/monitoring/progress-report/unreviewed` - Get unreviewed reports
- `GET /api/monitoring/progress-report/summary/:studentId/:term/:academicYear` - Get report summary

### Alerts

- `GET /api/monitoring/alerts/:studentId` - Get active alerts
- `POST /api/monitoring/alerts/generate/:studentId` - Generate alerts
- `POST /api/monitoring/alerts` - Create alert manually
- `PUT /api/monitoring/alerts/:alertId/acknowledge` - Acknowledge alert
- `PUT /api/monitoring/alerts/:alertId/resolve` - Resolve alert
- `PUT /api/monitoring/alerts/:alertId/dismiss` - Dismiss alert

### Intervention Plans

- `POST /api/monitoring/intervention` - Create intervention plan
- `GET /api/monitoring/intervention/student/:studentId` - Get student plans
- `GET /api/monitoring/intervention/:planId` - Get specific plan
- `PUT /api/monitoring/intervention/:planId/activate` - Activate plan
- `PUT /api/monitoring/intervention/:planId` - Update plan
- `PUT /api/monitoring/intervention/:planId/complete` - Complete plan
- `PUT /api/monitoring/intervention/:planId/cancel` - Cancel plan
- `GET /api/monitoring/intervention/assignee/:assigneeId` - Get assignee plans
- `GET /api/monitoring/intervention/stats` - Get intervention statistics
- `PUT /api/monitoring/intervention/:planId/goal/:goalId` - Update goal status

### Team Analytics

- `GET /api/monitoring/analytics/team/:teamId` - Get team analytics
- `GET /api/monitoring/analytics/comparison/:studentId/:teamId` - Compare student to team
- `GET /api/monitoring/analytics/trends/:teamId` - Get team trends

### Risk Assessment

- `POST /api/monitoring/risk-assessment` - Perform risk assessment (AI)
- `POST /api/monitoring/risk-assessment/batch` - Batch risk assessment

## Alert System

### Alert Severity Levels

- **CRITICAL**: Immediate eligibility risk (GPA < 1.8, credit hours < 6)
- **HIGH**: Performance below NCAA minimums (GPA < 2.0, attendance < 75%)
- **MEDIUM**: Below target thresholds (GPA < 2.3, attendance < 85%)
- **LOW**: Informational alerts

### Alert Types

- **ACADEMIC**: GPA, coursework, academic standing
- **ELIGIBILITY**: NCAA eligibility concerns
- **ATTENDANCE**: Class attendance issues
- **BEHAVIORAL**: Conduct or behavioral concerns

### Threshold Configuration

Default thresholds are defined in `src/lib/thresholds.ts`:

```typescript
{
  gpa: {
    critical: 1.8,  // Below NCAA minimum
    high: 2.0,      // At NCAA minimum
    medium: 2.3,    // Below initial eligibility
  },
  attendance: {
    critical: 60,   // Below 60%
    high: 75,       // Below 75%
    medium: 85,     // Below 85%
  },
  creditHours: {
    critical: 6,    // Below eligibility minimum
    high: 9,        // Below recommended pace
  }
}
```

## Real-time Notifications

The service uses Pusher for real-time WebSocket notifications:

### Channels

- `student-{studentId}` - Student-specific notifications
- `alerts-priority` - High/critical alerts for staff

### Event Types

- `alert` - New alert notification
- `intervention-update` - Intervention plan update
- `progress-report` - New progress report

## Integration with Other Services

### AI Service Integration

The risk assessment endpoint calls the AI Service:

```typescript
POST /api/ai/predict/risk
{
  "studentId": "student123",
  "includeRecommendations": true
}
```

### Compliance Service Integration

Alert generation checks compliance records to determine eligibility alerts.

## Development

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run in development mode
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

### Environment Variables

See `.env.example` for required environment variables.

### Database Models

The service uses the following Prisma models:

- `PerformanceMetric` - Performance tracking data
- `ProgressReport` - Faculty progress reports
- `Alert` - Alert notifications
- `InterventionPlan` - Intervention plans
- `StudentProfile` - Student information
- `ComplianceRecord` - Compliance history

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

The service will be available at `/api/monitoring/*` routes.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Invalid input data (400)
- `NOT_FOUND` - Resource not found (404)
- `AI_SERVICE_UNAVAILABLE` - AI Service is down (503)
- `INTERNAL_SERVER_ERROR` - Unexpected error (500)

## Performance Considerations

- Database queries are optimized with proper indexes
- Pusher notifications are async and non-blocking
- Batch risk assessments run in parallel
- Alert generation is throttled to prevent spam

## Security

- Input validation with Zod schemas
- Database queries use Prisma (SQL injection protection)
- CORS configuration for allowed origins
- Environment variables for sensitive data

## Future Enhancements

- Alert rule customization per institution
- Predictive analytics for early warning system
- Integration with LMS for automatic grade imports
- Mobile push notifications
- Advanced reporting and data visualization
