# Compliance Service

NCAA Division I eligibility validation microservice for the Athletic Academics Hub platform.

## Overview

The Compliance Service provides comprehensive NCAA Division I eligibility validation, audit logging, and rule management capabilities. It implements all major NCAA rules including initial eligibility (16 core courses, 2.3 GPA, 10/7 rule, sliding scale) and continuing eligibility (24/18 rule, 40/60/80 rule, GPA thresholds).

## Features

- **Initial Eligibility Validation**: Freshmen eligibility checks
  - 16 core course requirement
  - 10/7 rule (10 courses before senior year, 7 in English/Math/Science)
  - Minimum 2.3 core GPA
  - NCAA Division I sliding scale (GPA vs SAT/ACT)

- **Continuing Eligibility Validation**: Student-athlete progression
  - 24/18 rule (24 hours per year, 18 in previous year)
  - 40/60/80 rule (progress toward degree)
  - GPA thresholds by academic year
  - Full-time enrollment (12 hours minimum)
  - 6-hour rule for term eligibility

- **Audit Logging**: Complete compliance audit trail
  - All checks logged with timestamp and results
  - Violation history tracking
  - Recurring violation detection
  - Audit summaries and reports

- **Dynamic Rule Management**: Update rules without deployment
  - Configurable rule parameters
  - Version control for rule changes
  - Admin-only rule updates
  - Configuration history tracking

## API Endpoints

### Eligibility Checks

#### `POST /api/compliance/check-eligibility`
General eligibility check - runs appropriate rules based on student status.

**Request:**
```json
{
  "studentId": "student-123",
  "checkType": "full" // "full", "initial", or "continuing"
}
```

**Response:**
```json
{
  "studentId": "student-123",
  "checkId": "check-1234567890",
  "timestamp": "2025-01-15T10:30:00Z",
  "result": {
    "isEligible": true,
    "status": "ELIGIBLE",
    "violations": [],
    "warnings": [],
    "recommendations": []
  },
  "rulesApplied": ["NCAA-DI-24-18-RULE", "NCAA-DI-GPA-THRESHOLDS"],
  "ruleVersion": "2025.1"
}
```

#### `POST /api/compliance/initial-eligibility`
Initial eligibility check for incoming freshmen.

**Request:**
```json
{
  "studentId": "student-123",
  "coreCourses": [
    {
      "id": "course-1",
      "subject": "English",
      "courseNumber": "101",
      "name": "English Literature",
      "grade": "A",
      "gradePoints": 4.0,
      "creditHours": 1.0,
      "category": "ENGLISH",
      "completedBeforeSeniorYear": true
    }
  ],
  "testScores": {
    "satTotal": 1200,
    "actComposite": 25
  }
}
```

#### `POST /api/compliance/continuing`
Continuing eligibility check for current student-athletes.

**Request:**
```json
{
  "studentId": "student-123",
  "academicYear": 2,
  "cumulativeGpa": 3.2,
  "termGpa": 3.0,
  "totalCreditHours": 48,
  "creditHoursThisTerm": 15,
  "creditHoursPreviousTerm": 18,
  "progressTowardDegree": 45,
  "degreeRequirementHours": 120
}
```

### Status and Monitoring

#### `GET /api/compliance/status/:studentId`
Get current eligibility status and compliance history.

**Response:**
```json
{
  "studentId": "student-123",
  "currentStatus": {
    "eligibilityStatus": "ELIGIBLE",
    "isEligible": true,
    "gpa": 3.2,
    "creditHours": 48,
    "lastChecked": "2025-01-15T10:30:00Z"
  },
  "summary": {
    "totalChecks": 10,
    "eligibleChecks": 9,
    "ineligibleChecks": 1,
    "complianceRate": "90.0"
  }
}
```

#### `GET /api/compliance/violations/:id`
Get violations for a specific compliance check.

#### `GET /api/compliance/violations/student/:studentId/history`
Get violation history for a student.

### Audit Trail

#### `GET /api/compliance/audit-log/:studentId`
Get complete audit log for a student.

**Query Parameters:**
- `limit`: Number of records to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "studentId": "student-123",
  "summary": {
    "totalChecks": 25,
    "eligibleChecks": 23,
    "ineligibleChecks": 2,
    "totalViolations": 5,
    "totalWarnings": 8,
    "lastCheckDate": "2025-01-15T10:30:00Z"
  },
  "logs": [
    {
      "id": "audit-123",
      "checkType": "continuing_eligibility",
      "result": "ELIGIBLE",
      "violations": 0,
      "warnings": 1,
      "performedBy": "user-456",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Rule Management (Admin Only)

#### `POST /api/compliance/rules/update`
Update rule configuration.

**Request:**
```json
{
  "ruleId": "NCAA-DI-GPA-THRESHOLDS",
  "parameters": {
    "year1Minimum": 1.8,
    "year2Minimum": 1.8,
    "year3Minimum": 1.9,
    "year4Minimum": 2.0
  },
  "reason": "Updated to reflect 2025 NCAA policy changes"
}
```

#### `GET /api/compliance/rules`
Get all active rule configurations.

#### `GET /api/compliance/rules/list`
Get list of all NCAA rules.

#### `GET /api/compliance/rules/:ruleId/history`
Get configuration history for a specific rule.

## NCAA Rules Implemented

### Initial Eligibility

1. **16 Core Courses** (`NCAA-DI-16-CORE`)
   - Must complete 16 NCAA-approved core courses

2. **10/7 Rule** (`NCAA-DI-10-7-RULE`)
   - 10 core courses before senior year
   - 7 of those 10 must be in English, Math, or Science

3. **Core GPA** (`NCAA-DI-CORE-GPA`)
   - Minimum 2.3 GPA in 16 core courses

4. **Sliding Scale** (`NCAA-DI-SLIDING-SCALE`)
   - Test score requirements based on core GPA
   - Higher GPA = lower test score requirement

### Continuing Eligibility

1. **24/18 Rule** (`NCAA-DI-24-18-RULE`)
   - 24 semester hours per academic year
   - 18 hours earned in previous academic year

2. **40/60/80 Rule** (`NCAA-DI-40-60-80-RULE`)
   - 40% of degree by end of year 2
   - 60% of degree by end of year 3
   - 80% of degree by end of year 4

3. **GPA Thresholds** (`NCAA-DI-GPA-THRESHOLDS`)
   - Year 1-2: 1.8 minimum
   - Year 3: 1.9 minimum
   - Year 4+: 2.0 minimum

4. **Full-Time Enrollment** (`NCAA-DI-FULL-TIME`)
   - Minimum 12 credit hours per term

5. **6-Hour Rule** (`NCAA-DI-6-HOUR`)
   - Must pass at least 6 hours in previous term

## Architecture

### Services

- **RuleEngine**: Core rule execution engine
- **InitialEligibility**: Freshman eligibility validation
- **ContinuingEligibility**: Ongoing eligibility validation
- **AuditLogger**: Compliance audit trail recording
- **RuleConfig**: Dynamic rule configuration management

### Data Flow

```
Request → Route → Service → Rule Engine → Validation
                                ↓
                        Audit Logger → Database
                                ↓
                            Response
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

### Build for Production
```bash
npm run build
```

### Type Check
```bash
npm run type-check
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
PORT=3003
NODE_ENV=development
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {},
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req-123"
  }
}
```

### Error Codes

- `VALIDATION_ERROR` (400): Invalid input data
- `NOT_FOUND` (404): Resource not found
- `FORBIDDEN` (403): Insufficient permissions
- `INTERNAL_SERVER_ERROR` (500): Unexpected error

## Testing

### Example Test Cases

1. **Initial Eligibility - Pass**
   - 16 core courses
   - 2.5 core GPA
   - SAT 1200 / ACT 25

2. **Initial Eligibility - Fail**
   - 14 core courses (needs 2 more)
   - 2.1 core GPA (below 2.3)

3. **Continuing Eligibility - Pass**
   - Year 2 student
   - 3.0 cumulative GPA
   - 42 total credit hours
   - 45% degree progress

4. **Continuing Eligibility - Fail**
   - Year 3 student
   - 1.7 cumulative GPA (needs 1.9)
   - 50% degree progress (needs 60%)

## Compliance Notes

- All eligibility checks are logged for NCAA audit requirements
- Violation history is maintained for trend analysis
- Rule configurations are versioned and tracked
- Admin actions require appropriate role permissions

## Future Enhancements

- Academic Progress Rate (APR) calculation
- Transfer eligibility validation
- Medical hardship waivers
- Appeals process tracking
- Integration with NCAA Eligibility Center
- Automated alerts for at-risk students
- Predictive analytics for eligibility trends

## License

Private - Athletic Academics Hub
