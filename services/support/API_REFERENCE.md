# Support Service API Reference

## Base URL
```
http://localhost:3005 (development)
https://aah.vercel.app/api/support (production)
```

## Authentication
All endpoints (except health checks) require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Tutoring Endpoints

### Book Tutoring Session
**POST** `/api/support/tutoring/book`

Book a one-on-one tutoring session.

**Request Body:**
```json
{
  "studentId": "string",
  "tutorId": "string",
  "subject": "string",
  "startTime": "2025-11-10T14:00:00Z",
  "endTime": "2025-11-10T15:00:00Z",
  "notes": "string (optional)"
}
```

**Response (201):**
```json
{
  "message": "Tutoring session booked successfully",
  "session": {
    "id": "uuid",
    "studentId": "string",
    "tutorId": "string",
    "subject": "string",
    "startTime": "2025-11-10T14:00:00Z",
    "endTime": "2025-11-10T15:00:00Z",
    "status": "SCHEDULED",
    "notes": "string",
    "createdAt": "2025-11-08T12:00:00Z",
    "updatedAt": "2025-11-08T12:00:00Z"
  }
}
```

### Check Tutor Availability
**GET** `/api/support/tutoring/availability`

Check available tutors and time slots.

**Query Parameters:**
- `startDate` (required): ISO 8601 datetime
- `endDate` (required): ISO 8601 datetime
- `tutorId` (optional): Filter by specific tutor
- `subject` (optional): Filter by subject

**Response (200):**
```json
{
  "availability": [
    {
      "tutorId": "string",
      "tutorName": "string",
      "subject": "string",
      "availableSlots": [
        {
          "startTime": "2025-11-10T14:00:00Z",
          "endTime": "2025-11-10T15:00:00Z",
          "isAvailable": true
        }
      ],
      "totalSessions": 45,
      "averageRating": 4.8
    }
  ],
  "count": 2
}
```

### Get Student Sessions
**GET** `/api/support/tutoring/sessions/:studentId`

Get all tutoring sessions for a student.

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "studentId": "string",
      "tutorId": "string",
      "subject": "Mathematics",
      "startTime": "2025-11-10T14:00:00Z",
      "endTime": "2025-11-10T15:00:00Z",
      "status": "SCHEDULED",
      "createdAt": "2025-11-08T12:00:00Z",
      "updatedAt": "2025-11-08T12:00:00Z"
    }
  ],
  "count": 1
}
```

### Cancel Tutoring Session
**DELETE** `/api/support/tutoring/:sessionId`

Cancel a scheduled tutoring session.

**Request Body:**
```json
{
  "studentId": "string"
}
```

**Response (200):**
```json
{
  "message": "Tutoring session cancelled successfully",
  "session": {
    "id": "uuid",
    "status": "CANCELLED",
    "updatedAt": "2025-11-08T12:00:00Z"
  }
}
```

---

## Study Hall Endpoints

### Check In
**POST** `/api/support/study-hall/checkin`

Check in to a study hall session.

**Request Body:**
```json
{
  "studentId": "string",
  "location": "Main Study Hall"
}
```

**Response (201):**
```json
{
  "message": "Successfully checked in to study hall",
  "attendance": {
    "id": "uuid",
    "studentId": "string",
    "location": "Main Study Hall",
    "checkInTime": "2025-11-08T14:00:00Z",
    "wasCompleted": false,
    "createdAt": "2025-11-08T14:00:00Z",
    "updatedAt": "2025-11-08T14:00:00Z"
  }
}
```

### Check Out
**POST** `/api/support/study-hall/checkout`

Check out from a study hall session.

**Request Body:**
```json
{
  "attendanceId": "uuid",
  "studentId": "string"
}
```

**Response (200):**
```json
{
  "message": "Successfully checked out from study hall",
  "attendance": {
    "id": "uuid",
    "studentId": "string",
    "location": "Main Study Hall",
    "checkInTime": "2025-11-08T14:00:00Z",
    "checkOutTime": "2025-11-08T16:30:00Z",
    "duration": 150,
    "wasCompleted": true,
    "updatedAt": "2025-11-08T16:30:00Z"
  },
  "duration": 150
}
```

### Get Attendance Records
**GET** `/api/support/study-hall/attendance/:studentId`

Get attendance history for a student.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 10)

**Response (200):**
```json
{
  "records": [
    {
      "id": "uuid",
      "studentId": "string",
      "location": "Main Study Hall",
      "checkInTime": "2025-11-07T14:00:00Z",
      "checkOutTime": "2025-11-07T16:30:00Z",
      "duration": 150,
      "wasCompleted": true,
      "createdAt": "2025-11-07T14:00:00Z",
      "updatedAt": "2025-11-07T16:30:00Z"
    }
  ],
  "count": 5
}
```

### Get Student Statistics
**GET** `/api/support/study-hall/stats/:studentId`

Get comprehensive study hall statistics for a student.

**Response (200):**
```json
{
  "studentId": "string",
  "totalHours": 8.5,
  "requiredHours": 10,
  "completionPercentage": 85,
  "sessionsCount": 5,
  "averageSessionDuration": 102,
  "recentSessions": [
    {
      "id": "uuid",
      "location": "Main Study Hall",
      "checkInTime": "2025-11-07T14:00:00Z",
      "checkOutTime": "2025-11-07T16:30:00Z",
      "duration": 150
    }
  ]
}
```

---

## Workshop Endpoints

### Register for Workshop
**POST** `/api/support/workshop/register`

Register a student for a life skills workshop.

**Request Body:**
```json
{
  "studentId": "string",
  "workshopId": "string"
}
```

**Response (201):**
```json
{
  "message": "Successfully registered for workshop",
  "registration": {
    "id": "uuid",
    "studentId": "string",
    "workshopId": "string",
    "status": "REGISTERED",
    "registeredAt": "2025-11-08T12:00:00Z",
    "workshop": {
      "id": "string",
      "title": "Time Management for Student Athletes",
      "description": "string",
      "category": "Academic Success",
      "scheduledAt": "2025-11-15T14:00:00Z",
      "duration": 90,
      "location": "Athletic Center - Room 202",
      "capacity": 30,
      "registered": 19,
      "available": 11,
      "instructor": "Dr. Sarah Martinez"
    }
  }
}
```

### Get Available Workshops
**GET** `/api/support/workshop/available`

Get all workshops with available spots.

**Response (200):**
```json
{
  "workshops": [
    {
      "id": "string",
      "title": "Time Management for Student Athletes",
      "description": "Learn effective strategies to balance academics and athletics",
      "category": "Academic Success",
      "scheduledAt": "2025-11-15T14:00:00Z",
      "duration": 90,
      "location": "Athletic Center - Room 202",
      "capacity": 30,
      "registered": 18,
      "available": 12,
      "instructor": "Dr. Sarah Martinez",
      "createdAt": "2025-11-01T00:00:00Z",
      "updatedAt": "2025-11-08T12:00:00Z"
    }
  ],
  "count": 4
}
```

### Get Student Registrations
**GET** `/api/support/workshop/registrations/:studentId`

Get all workshop registrations for a student.

**Response (200):**
```json
{
  "registrations": [
    {
      "id": "uuid",
      "studentId": "string",
      "workshopId": "string",
      "status": "REGISTERED",
      "registeredAt": "2025-11-08T12:00:00Z",
      "updatedAt": "2025-11-08T12:00:00Z"
    }
  ],
  "count": 1
}
```

### Cancel Workshop Registration
**DELETE** `/api/support/workshop/:registrationId`

Cancel a workshop registration.

**Request Body:**
```json
{
  "studentId": "string"
}
```

**Response (200):**
```json
{
  "message": "Workshop registration cancelled successfully",
  "registration": {
    "id": "uuid",
    "status": "CANCELLED",
    "updatedAt": "2025-11-08T12:00:00Z"
  }
}
```

---

## Mentoring Endpoints

### Get Mentor Matches
**GET** `/api/support/mentoring/matches/:studentId`

or

**GET** `/api/support/mentoring/matches?studentId=xxx`

Get matched mentors for a student.

**Response (200):**
```json
{
  "matches": [
    {
      "id": "uuid",
      "mentorId": "string",
      "menteeId": "string",
      "matchedAt": "2025-10-08T00:00:00Z",
      "status": "ACTIVE",
      "compatibilityScore": 0.85,
      "commonInterests": ["Basketball", "Business Administration", "Leadership"],
      "mentorInfo": {
        "id": "string",
        "name": "Marcus Johnson",
        "sport": "Basketball",
        "year": "Senior",
        "major": "Business Administration"
      },
      "menteeInfo": {
        "id": "string",
        "name": "Student Name",
        "sport": "Basketball",
        "year": "Sophomore",
        "major": "Business"
      }
    }
  ],
  "count": 2
}
```

### Schedule Mentoring Session
**POST** `/api/support/mentoring/session`

Schedule a session between mentor and mentee.

**Request Body:**
```json
{
  "mentorId": "string",
  "menteeId": "string",
  "scheduledAt": "2025-11-12T15:00:00Z",
  "duration": 60,
  "topic": "Balancing academics and athletics (optional)",
  "notes": "First mentoring session (optional)"
}
```

**Response (201):**
```json
{
  "message": "Mentoring session scheduled successfully",
  "session": {
    "id": "uuid",
    "mentorId": "string",
    "menteeId": "string",
    "scheduledAt": "2025-11-12T15:00:00Z",
    "duration": 60,
    "status": "SCHEDULED",
    "topic": "Balancing academics and athletics",
    "notes": "First mentoring session",
    "createdAt": "2025-11-08T12:00:00Z",
    "updatedAt": "2025-11-08T12:00:00Z"
  }
}
```

### Get Mentoring Sessions
**GET** `/api/support/mentoring/sessions/:userId`

Get all mentoring sessions for a user (as mentor or mentee).

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "mentorId": "string",
      "menteeId": "string",
      "scheduledAt": "2025-11-12T15:00:00Z",
      "duration": 60,
      "status": "SCHEDULED",
      "topic": "Balancing academics and athletics",
      "notes": "First mentoring session",
      "createdAt": "2025-11-08T12:00:00Z",
      "updatedAt": "2025-11-08T12:00:00Z"
    }
  ],
  "count": 2
}
```

### Cancel Mentoring Session
**DELETE** `/api/support/mentoring/session/:sessionId`

Cancel a scheduled mentoring session.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Response (200):**
```json
{
  "message": "Mentoring session cancelled successfully",
  "session": {
    "id": "uuid",
    "status": "CANCELLED",
    "updatedAt": "2025-11-08T12:00:00Z"
  }
}
```

---

## Health & Status Endpoints

### Health Check
**GET** `/health`

Simple health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "service": "support-service",
  "timestamp": "2025-11-08T12:00:00Z",
  "version": "2.0.0"
}
```

### Service Status
**GET** `/api/support/status`

Detailed service status with all available endpoints.

**Response (200):**
```json
{
  "service": "support-service",
  "status": "operational",
  "version": "2.0.0",
  "features": {
    "tutoring": "enabled",
    "studyHall": "enabled",
    "workshops": "enabled",
    "mentoring": "enabled",
    "availabilityEngine": "enabled"
  },
  "endpoints": {
    "tutoring": [...],
    "studyHall": [...],
    "workshop": [...],
    "mentoring": [...]
  },
  "timestamp": "2025-11-08T12:00:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-11-08T12:00:00Z",
    "requestId": "uuid"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `MISSING_PARAMETERS` | 400 | Required parameters missing |
| `INVALID_TIME_RANGE` | 400 | Invalid time range provided |
| `STUDENT_NOT_FOUND` | 404 | Student does not exist |
| `WORKSHOP_NOT_FOUND` | 404 | Workshop does not exist |
| `SCHEDULING_CONFLICT` | 409 | Time slot conflict exists |
| `ALREADY_CHECKED_IN` | 409 | Student already checked in |
| `WORKSHOP_FULL` | 409 | Workshop at capacity |
| `ALREADY_REGISTERED` | 409 | Already registered for workshop |
| `TUTOR_UNAVAILABLE` | 409 | Tutor not available |
| `DATABASE_ERROR` | 500 | Internal database error |
| `SCHEDULING_ERROR` | 500 | Internal scheduling error |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected error |

---

## Rate Limiting

- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## CORS

Allowed origins:
- `http://localhost:3000` (development)
- `http://localhost:3001` (development)
- `https://aah.vercel.app` (production)

Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Duration is measured in minutes
- Session statuses: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `RESCHEDULED`
- Workshop categories: `Academic Success`, `Life Skills`, `Career Development`, `Wellness`
- Match statuses: `ACTIVE`, `INACTIVE`, `COMPLETED`
