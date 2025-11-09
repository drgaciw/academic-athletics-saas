# Support Service

The Support Service manages all academic support resources for student-athletes, including tutoring, study halls, life skills workshops, and peer mentoring programs.

## Features

### 1. Tutoring Management
- Book one-on-one tutoring sessions
- Check tutor availability by subject and time
- View and manage tutoring sessions
- Cancel sessions with proper notifications

### 2. Study Hall Tracking
- Check-in/check-out system with timestamps
- Track mandatory study hall hours
- Monitor completion percentage
- Calculate session durations automatically
- View attendance history and statistics

### 3. Workshop Registration
- Browse available life skills workshops
- Register for workshops with capacity management
- Track workshop attendance
- Cancel registrations
- Categories: Academic Success, Life Skills, Career Development, Wellness

### 4. Peer Mentoring
- Intelligent mentor-mentee matching algorithm
- Compatibility scoring based on sport, major, year, and interests
- Schedule mentoring sessions
- Track mentoring relationships
- Session feedback and notes

### 5. Availability Engine
- Optimize scheduling across multiple calendars
- Detect scheduling conflicts with:
  - Athletic schedules (practices, games, travel)
  - Academic classes
  - Existing support sessions
- Suggest alternative time slots
- Find optimal meeting times between users

## API Endpoints

### Tutoring
```
POST   /api/support/tutoring/book                 - Book tutoring session
GET    /api/support/tutoring/availability         - Check tutor availability
GET    /api/support/tutoring/sessions/:studentId  - Get student sessions
DELETE /api/support/tutoring/:sessionId           - Cancel session
```

### Study Hall
```
POST   /api/support/study-hall/checkin            - Check in to study hall
POST   /api/support/study-hall/checkout           - Check out from study hall
GET    /api/support/study-hall/attendance/:studentId - Get attendance records
GET    /api/support/study-hall/stats/:studentId   - Get student statistics
```

### Workshops
```
POST   /api/support/workshop/register             - Register for workshop
GET    /api/support/workshop/available            - Get available workshops
GET    /api/support/workshop/registrations/:studentId - Get registrations
DELETE /api/support/workshop/:registrationId      - Cancel registration
```

### Mentoring
```
GET    /api/support/mentoring/matches/:studentId  - Get mentor matches
GET    /api/support/mentoring/matches             - Get matches (query param)
POST   /api/support/mentoring/session             - Schedule session
GET    /api/support/mentoring/sessions/:userId    - Get sessions
DELETE /api/support/mentoring/session/:sessionId  - Cancel session
```

## Technology Stack

- **Framework**: Hono (lightweight, fast, type-safe)
- **Database**: Prisma with Vercel Postgres
- **Validation**: Zod for runtime type checking
- **Deployment**: Vercel Serverless Functions

## Development

### Prerequisites
- Node.js 18+
- PNPM package manager
- Prisma CLI

### Installation
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```

The service will start on port 3005.

### Build
```bash
pnpm build
```

### Type Checking
```bash
pnpm type-check
```

## Architecture

### Service Layer
- **TutoringService**: Manages tutor bookings, availability, and sessions
- **StudyHallService**: Tracks attendance, calculates hours, monitors compliance
- **WorkshopService**: Handles registrations, capacity management
- **MentoringService**: Matches mentors/mentees, schedules sessions
- **AvailabilityEngine**: Centralized scheduling logic and conflict detection

### Key Algorithms

#### Availability Engine
- Checks multiple calendar sources for conflicts
- Generates optimal time slots based on constraints
- Considers:
  - Athletic schedule (practices, games, travel)
  - Academic class schedule
  - Existing support commitments
  - Preferred days and times

#### Mentor Matching
- Calculates compatibility scores based on:
  - Same sport (30% weight)
  - Similar major (20% weight)
  - Common interests and goals (50% weight)
- Maintains active mentoring relationships
- Tracks session history and feedback

#### Study Hall Compliance
- Tracks total hours vs. required hours
- Calculates completion percentage
- Monitors session patterns
- Generates alerts for students falling behind

## Data Models

### TutoringSession
- Student and tutor information
- Subject and time range
- Status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- Session notes

### StudyHallAttendance
- Check-in/check-out timestamps
- Duration calculation
- Location tracking
- Completion status

### Workshop
- Title, description, category
- Schedule and location
- Capacity management
- Instructor information

### MentorMatch
- Mentor and mentee profiles
- Compatibility score
- Common interests
- Match status

### MentoringSession
- Scheduled time and duration
- Session topic and notes
- Status and feedback

## Error Handling

All errors follow a consistent format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "timestamp": "2025-11-08T12:00:00Z",
    "requestId": "uuid"
  }
}
```

Common error codes:
- `VALIDATION_ERROR` (400): Invalid request data
- `STUDENT_NOT_FOUND` (404): Student doesn't exist
- `SCHEDULING_CONFLICT` (409): Time slot already occupied
- `WORKSHOP_FULL` (409): Workshop at capacity
- `DATABASE_ERROR` (500): Internal server error

## Future Enhancements

1. **AI-Powered Scheduling**
   - Predict optimal study times based on performance patterns
   - Recommend tutors based on learning style compatibility

2. **Advanced Analytics**
   - Track correlation between support usage and academic performance
   - Identify at-risk students early
   - Generate insights for program improvement

3. **Mobile App Integration**
   - QR code check-in/check-out
   - Push notifications for upcoming sessions
   - Real-time availability updates

4. **Virtual Support**
   - Video conferencing integration
   - Virtual study halls
   - Online workshop delivery

5. **Gamification**
   - Reward points for study hall attendance
   - Achievement badges for workshop completion
   - Leaderboards for peer motivation

## Contributing

This service follows the microservices architecture defined in `.kiro/specs/microservices-architecture/design.md`.

## License

Private - Athletic Academics Hub (AAH)
