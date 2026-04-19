# Coach Management Service

The Coach Management Service provides functionality for managing coach profiles and accessing student athlete information for academic compliance monitoring.

## Features

### Coach Profile Management
- Create, read, update, and delete coach profiles
- Assign coaches to sports and teams
- Store contact information and office details
- Role-based access control (COACH role)

### Student Athlete Monitoring
- View assigned student athletes
- Monitor academic performance metrics (GPA, credit hours)
- Track eligibility status
- View compliance alerts
- Access detailed student information

### Team Analytics
- Team-level GPA statistics
- Eligibility rates
- At-risk student counts
- Active alerts monitoring

## API Endpoints

### Coach Profile Endpoints

```typescript
// Create coach (Admin only)
POST /api/coach/coaches
Body: CreateCoachRequest

// Get coach profile
GET /api/coach/coaches/:coachId

// Update coach profile
PUT /api/coach/coaches/:coachId
Body: UpdateCoachRequest

// Delete coach (Admin only)
DELETE /api/coach/coaches/:coachId

// List all coaches (Admin only)
GET /api/coach/coaches
```

### Student Athlete Endpoints

```typescript
// Get assigned student athletes
GET /api/coach/coaches/:coachId/students
Query params: sport, team, eligibilityStatus, academicStanding, limit, offset

// Get individual student details
GET /api/coach/coaches/:coachId/students/:studentId

// Get team analytics
GET /api/coach/coaches/:coachId/analytics
```

## Usage Example

```typescript
import { coachService } from '@/lib/services';

// Get coach profile
const profile = await coachService.getProfile('C001', context);

// Get student athletes
const students = await coachService.getStudentAthletes(
  'C001',
  {
    sport: 'Basketball',
    team: 'Men\'s Varsity',
    limit: 20,
    offset: 0,
  },
  context
);

// Get team analytics
const analytics = await coachService.getTeamAnalytics('C001', context);
console.log(`Eligibility Rate: ${analytics.eligibilityRate}%`);
console.log(`Average GPA: ${analytics.averageGpa}`);
```

## Dashboard Routes

### Coach Dashboard
- Route: `/coach/dashboard`
- Access: COACH role required
- Features:
  - Team overview statistics
  - Student athlete list with filtering
  - At-risk student alerts
  - Performance metrics

### Admin Coach Management
- Route: `/admin/coaches`
- Access: ADMIN role required
- Features:
  - List all coaches
  - Create new coach accounts
  - Edit coach profiles
  - Delete coach accounts

## Data Model

### CoachProfile
```prisma
model CoachProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(...)
  coachId        String   @unique
  sport          String
  teams          String[]
  title          String?
  department     String?
  phone          String?
  officeLocation String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Types

### CoachProfile
- `id`: Unique identifier
- `userId`: Reference to User model
- `coachId`: Coach-specific ID (e.g., "C001")
- `sport`: Primary sport
- `teams`: Array of team names
- `title`: Position (e.g., "Head Coach", "Assistant Coach")
- `department`: Department affiliation
- `phone`: Contact phone number
- `officeLocation`: Office location

### StudentAthleteInfo
- Basic info: name, studentId, sport, team
- Academic: GPA, credit hours, major
- Compliance: eligibility status, academic standing
- Alerts: active alerts and severity
- Performance: recent performance summary

### CoachTeamAnalytics
- Total students count
- Eligibility statistics
- Average GPA and credit hours
- Alert counts
- Performance by team

## Integration with Other Services

The Coach Management Service integrates with:

1. **Compliance Service**: For eligibility status and violations
2. **Monitoring Service**: For performance metrics and alerts
3. **User Service**: For authentication and user management

## Security

- Authentication required for all endpoints
- Role-based access control (COACH, ADMIN)
- Coaches can only access their assigned students
- Admins have full access to all coach data

## Testing

Run coach service tests:
```bash
pnpm test -- lib/services/__tests__/coachService.test.ts
```

## Environment Variables

```bash
COACH_SERVICE_URL=http://localhost:3008
```

In production on Vercel, the service URL is auto-configured.
