# Integration Service

The Integration Service handles all external system integrations, faculty liaison, and automated notifications for the Academic Athletics Hub platform.

## Overview

This microservice provides:

- **Email Notifications**: Faculty travel notifications and absence alerts via Resend
- **Calendar Sync**: Google Calendar and Outlook integration
- **LMS Integration**: Canvas and Blackboard grade/course synchronization
- **SIS Integration**: Student Information System data import
- **Travel Letters**: Automated PDF generation with Vercel Blob storage
- **Transcript Services**: Parchment and NSC integration for official transcripts

## Architecture

Built with:
- **Framework**: Hono (lightweight, fast, serverless-optimized)
- **Language**: TypeScript
- **Validation**: Zod schemas
- **External APIs**: Resend, Google APIs, Microsoft Graph, Canvas, Blackboard
- **Storage**: Vercel Blob
- **Document Generation**: PDFKit

## API Endpoints

### Travel Letters

```
POST   /api/integration/travel-letter          # Generate travel letter
POST   /api/integration/travel-letter/preview  # Generate preview
POST   /api/integration/travel-letter/bulk     # Bulk generation
```

### Absence Notifications

```
POST   /api/integration/absence-notification        # Send absence notification
POST   /api/integration/absence-notification/bulk  # Bulk notifications
POST   /api/integration/absence-notification/travel # Travel notification with letter
```

### Email

```
POST   /api/integration/email/send              # Send single email
POST   /api/integration/email/send-bulk         # Send multiple emails
GET    /api/integration/email/health            # Check email service health
```

### Calendar

```
POST   /api/integration/calendar/sync           # Sync calendar event
PUT    /api/integration/calendar/update         # Update calendar event
DELETE /api/integration/calendar/delete         # Delete calendar event
GET    /api/integration/calendar/health         # Check calendar configuration
```

### LMS (Learning Management System)

```
POST   /api/integration/lms/sync                # Sync student LMS data
POST   /api/integration/lms/sync/batch          # Batch sync multiple students
GET    /api/integration/lms/courses/:studentId  # Get student courses
GET    /api/integration/lms/grades/:studentId   # Get student grades
GET    /api/integration/lms/assignments/:courseId # Get course assignments
GET    /api/integration/lms/health              # Check LMS connection
```

### SIS (Student Information System)

```
POST   /api/integration/sis/import                  # Import all student data
POST   /api/integration/sis/import/student          # Import student profile
POST   /api/integration/sis/import/enrollments      # Import enrollments
POST   /api/integration/sis/import/transcript       # Import transcript
POST   /api/integration/sis/import/batch            # Batch import students
POST   /api/integration/sis/import/term             # Import term enrollments
POST   /api/integration/sis/verify-eligibility      # Verify eligibility data
GET    /api/integration/sis/health                  # Check SIS connection
```

### Transcripts

```
POST   /api/integration/transcript/request                # Request transcript
POST   /api/integration/transcript/request/electronic     # Electronic delivery
POST   /api/integration/transcript/request/physical       # Physical delivery
POST   /api/integration/transcript/request/batch          # Batch requests
GET    /api/integration/transcript/:id                    # Get request status
GET    /api/integration/transcript/history/:studentId     # Get request history
DELETE /api/integration/transcript/:id                    # Cancel request
POST   /api/integration/transcript/verify/enrollment      # Verify enrollment (NSC)
POST   /api/integration/transcript/verify/degree          # Verify degree (NSC)
GET    /api/integration/transcript/health                 # Check service health
```

## Environment Variables

### Required

```env
# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@academicathleticshub.com

# Google Calendar (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### Optional (External Integrations)

```env
# Canvas LMS
CANVAS_API_URL=https://your-institution.instructure.com
CANVAS_API_TOKEN=your_canvas_token

# Blackboard LMS
BLACKBOARD_API_URL=https://your-blackboard-instance.com
BLACKBOARD_API_TOKEN=your_blackboard_token

# Student Information System
SIS_API_URL=https://your-sis-api.com
SIS_API_KEY=your_sis_api_key

# Parchment (Transcript Service)
PARCHMENT_API_URL=https://api.parchment.com
PARCHMENT_API_KEY=your_parchment_api_key

# National Student Clearinghouse
NSC_API_URL=https://api.studentclearinghouse.org
NSC_API_KEY=your_nsc_api_key
```

## Services

### EmailService

Handles email delivery via Resend with support for:
- Single and bulk emails
- Travel notifications with PDF attachments
- Absence notifications
- Custom HTML/text content
- CC/BCC support
- File attachments

### CalendarService

Syncs events to:
- Google Calendar (via googleapis)
- Outlook Calendar (via Microsoft Graph)
- Supports create, update, delete operations
- Handles multiple calendars per user

### LMSConnector

Integrates with Learning Management Systems:
- **Canvas**: Full API support for courses, grades, assignments
- **Blackboard**: Course and grade synchronization
- Batch synchronization for multiple students
- Rate limiting and error handling

### SISConnector

Imports data from Student Information Systems:
- Student profiles
- Current enrollments
- Historical transcripts
- GPA and credit hour tracking
- Eligibility data verification
- Batch imports for multiple students

### TravelLetterGenerator

Generates professional PDF travel letters:
- University letterhead
- Travel details and dates
- Affected courses and instructors
- Faculty contact information
- Vercel Blob storage integration
- Preview generation without storage

### TranscriptService

Manages official transcript requests:
- **Parchment**: Official transcript ordering
- **NSC**: Enrollment and degree verification
- Electronic and physical delivery
- Request tracking and status updates
- Bulk request processing

## Error Handling

All endpoints return consistent error responses:

```typescript
{
  error: {
    code: string;           // Error code (e.g., VALIDATION_ERROR)
    message: string;        // Human-readable message
    details?: any;          // Additional error details
    timestamp: string;      // ISO 8601 timestamp
    requestId?: string;     // Request correlation ID
  }
}
```

### Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `MISSING_TOKEN`: Required authentication token missing
- `SYNC_ERROR`: Failed to sync data
- `GENERATION_ERROR`: Failed to generate document
- `EMAIL_SEND_ERROR`: Failed to send email
- `IMPORT_ERROR`: Failed to import data
- `INTERNAL_ERROR`: Unexpected server error

## External API Failure Handling

The service implements robust error handling for external API failures:

### Retry Logic
- Exponential backoff for transient failures
- Configurable retry attempts (default: 3)
- Rate limiting awareness

### Circuit Breaker
- Prevents cascading failures
- Opens after consecutive failures
- Auto-recovery with half-open state

### Fallback Strategies
- Graceful degradation when services unavailable
- Cached data when appropriate
- Clear error messages to users

### Timeout Handling
- 30-second timeout for standard API calls
- 60-second timeout for bulk operations
- Configurable per integration

## Usage Examples

### Generate Travel Letter

```typescript
const response = await fetch('/api/integration/travel-letter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentName: 'John Smith',
    studentId: 'SA123456',
    sport: 'Basketball',
    travelDates: {
      start: '2024-03-15',
      end: '2024-03-18'
    },
    destination: 'Los Angeles, CA',
    event: 'NCAA Regional Tournament',
    courses: [
      {
        code: 'MATH 201',
        name: 'Calculus II',
        instructor: 'Dr. Jane Doe',
        meetingTimes: 'MWF 10:00-11:00 AM'
      }
    ],
    advisor: {
      name: 'Sarah Johnson',
      title: 'Academic Advisor',
      email: 'sjohnson@university.edu',
      phone: '555-123-4567'
    }
  })
});

const { url } = await response.json();
```

### Sync LMS Data

```typescript
const response = await fetch('/api/integration/lms/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'canvas_user_123',
    provider: 'canvas'
  })
});

const { courses, grades } = await response.json();
```

### Send Calendar Event

```typescript
const response = await fetch('/api/integration/calendar/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'google',
    accessToken: 'user_google_token',
    event: {
      title: 'Team Meeting',
      description: 'Weekly team meeting',
      startTime: '2024-03-20T14:00:00Z',
      endTime: '2024-03-20T15:00:00Z',
      location: 'Athletic Center Room 101',
      attendees: ['coach@university.edu', 'athlete@university.edu']
    }
  })
});
```

### Request Transcript

```typescript
const response = await fetch('/api/integration/transcript/request/electronic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'SA123456',
    recipientEmail: 'admissions@graduate-school.edu',
    purpose: 'Graduate school application'
  })
});

const { requestId, status } = await response.json();
```

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The service will start on port 3006 by default.

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

## Testing

Integration tests should cover:

1. **Email Service**
   - Email delivery success/failure
   - Template rendering
   - Attachment handling

2. **Calendar Integration**
   - Event creation/update/deletion
   - OAuth token validation
   - Multi-calendar support

3. **LMS Integration**
   - Data synchronization accuracy
   - Rate limiting compliance
   - Error recovery

4. **SIS Integration**
   - Data import correctness
   - Batch processing
   - Eligibility verification

5. **Document Generation**
   - PDF rendering quality
   - Blob storage upload
   - Preview generation

## Deployment

This service deploys as Vercel Serverless Functions:

```bash
vercel deploy
```

Each endpoint becomes an independent serverless function with:
- Auto-scaling based on demand
- Cold start optimization via Hono
- Edge caching where appropriate
- Request/response logging

## Monitoring

Monitor the following metrics:

- Email delivery success rate
- External API response times
- LMS sync success rate
- Document generation failures
- API rate limit violations
- Error rates by integration

## Security

- API keys stored as environment variables
- No credentials in code or version control
- OAuth tokens encrypted in transit
- Input validation on all endpoints
- Rate limiting on external API calls
- CORS configured appropriately

## Support

For issues or questions:
- Check service health endpoints
- Review error logs in Vercel dashboard
- Verify environment variables are set
- Test external API connectivity
- Consult integration provider documentation
