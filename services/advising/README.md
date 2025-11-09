# Advising Service

Course selection, scheduling, conflict detection, and degree progress tracking for student-athletes.

## Overview

The Advising Service is a microservice that provides intelligent course scheduling and academic advising capabilities. It uses advanced algorithms including Constraint Satisfaction Problem (CSP) solving and graph-based conflict detection to generate optimal schedules while respecting athletic commitments.

## Features

- **Course Scheduling**: Generate conflict-free course schedules using CSP solver
- **Conflict Detection**: Identify time, athletic, prerequisite, and capacity conflicts
- **AI Recommendations**: Get intelligent course recommendations integrated with AI Service
- **Degree Progress Tracking**: Monitor progress toward degree requirements
- **Schedule Validation**: Validate proposed schedules against multiple constraints

## Architecture

### Algorithms

1. **CSP Solver** (`algorithms/cspSolver.ts`)
   - Backtracking search with forward checking
   - Minimum Remaining Values (MRV) heuristic for variable selection
   - Least Constraining Value (LCV) heuristic for value ordering
   - Domain reduction through constraint propagation

2. **Graph-Based Conflict Detection** (`services/conflictDetector.ts`)
   - Build conflict graphs from course sections
   - Detect time overlaps using graph edges
   - Athletic schedule integration
   - Multi-type conflict identification

### Services

- **SchedulingEngine**: Orchestrates CSP solver to generate schedules
- **ConflictDetector**: Detects and categorizes scheduling conflicts
- **DegreeAudit**: Tracks progress toward degree completion
- **RecommendationService**: Provides AI-powered course recommendations

## API Endpoints

### POST /api/advising/schedule
Generate an optimal course schedule.

**Request:**
```json
{
  "studentId": "student123",
  "sectionIds": ["sec1", "sec2", "sec3"],
  "term": "Fall",
  "academicYear": "2024",
  "preferences": {
    "preferredDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
    "avoidBackToBack": true,
    "maxDailyHours": 6,
    "respectAthleticSchedule": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scheduleId": "sched123",
    "studentId": "student123",
    "sections": [...],
    "totalCredits": 15,
    "conflicts": [],
    "status": "VALID",
    "warnings": []
  }
}
```

### GET /api/advising/conflicts/:studentId
Get all scheduling conflicts for a student.

**Query Parameters:**
- `scheduleId` (optional): Filter by specific schedule

**Response:**
```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "conflictType": "TIME_CONFLICT",
        "severity": "CRITICAL",
        "description": "Time conflict between CS101 and MATH201",
        "affectedCourses": ["CS101", "MATH201"],
        "suggestions": ["..."]
      }
    ]
  }
}
```

### POST /api/advising/recommend
Get AI-powered course recommendations.

**Request:**
```json
{
  "studentId": "student123",
  "term": "Spring",
  "academicYear": "2025",
  "goals": ["Complete major requirements", "Maintain eligibility"],
  "context": "Need courses that don't conflict with spring training"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "course": {...},
        "priority": 95,
        "reasoning": "Required for major completion",
        "availableSections": [...],
        "fitsSchedule": true,
        "meetsPrerequisites": true
      }
    ],
    "reasoning": "Based on your degree progress...",
    "alternativePaths": [...],
    "warnings": []
  }
}
```

### GET /api/advising/degree-progress/:id
Track degree progress for a student.

**Query Parameters:**
- `degreeProgram` (optional): Specific degree program

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "student123",
    "degreeProgram": "Computer Science",
    "totalCreditsRequired": 120,
    "totalCreditsCompleted": 60,
    "completionPercentage": 50,
    "requirements": [...],
    "estimatedGraduation": "Spring 2026",
    "onTrack": true,
    "warnings": []
  }
}
```

### POST /api/advising/validate-schedule
Validate a proposed course schedule.

**Request:**
```json
{
  "studentId": "student123",
  "sectionIds": ["sec1", "sec2", "sec3"],
  "term": "Fall",
  "academicYear": "2024",
  "checkPrerequisites": true,
  "checkConflicts": true,
  "checkCreditLimit": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "conflicts": [],
    "warnings": [],
    "totalCredits": 15,
    "creditLimitMin": 12,
    "creditLimitMax": 18,
    "suggestions": ["Schedule looks good! Ready for enrollment."]
  }
}
```

## Conflict Types

The service detects the following conflict types:

- **TIME_CONFLICT**: Overlapping class times
- **ATHLETIC_CONFLICT**: Conflicts with mandatory athletic events
- **PREREQUISITE_MISSING**: Required prerequisite courses not completed
- **CAPACITY_FULL**: Course section at or over capacity
- **CREDIT_HOUR_LIMIT**: Credit hours below minimum or above maximum
- **COREQUISITE_MISSING**: Required corequisite courses not in schedule

## Conflict Severity

- **CRITICAL**: Must be resolved before enrollment
- **HIGH**: Strongly recommended to resolve
- **MEDIUM**: Should be addressed if possible
- **LOW**: Minor issues or informational

## Development

### Prerequisites
- Node.js >= 18.0.0
- TypeScript 5.3+
- Access to shared database package

### Setup
```bash
npm install
```

### Development Mode
```bash
npm run dev
```
Server will start at `http://localhost:3002`

### Build
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

## Integration with Other Services

### AI Service
The Recommendation Service integrates with the AI Service for intelligent course recommendations:
- Endpoint: `POST /api/ai/advising/recommend`
- Provides context-aware suggestions based on degree progress and student goals

### Database
Uses shared Prisma client from `@aah/database` package:
- Course and CourseSection models
- Schedule and ScheduleConflict models
- DegreeProgress and DegreeRequirement models
- StudentProfile for athletic schedule integration

## Key Algorithms Explained

### CSP Solver
The Constraint Satisfaction Problem solver finds valid schedule assignments by:
1. Building variables (courses) with domains (available sections)
2. Defining constraints (time conflicts, athletic conflicts, etc.)
3. Using backtracking with forward checking to find solutions
4. Applying MRV and LCV heuristics for efficiency

### Conflict Detection
Graph-based conflict detection:
1. Build conflict graph with sections as nodes
2. Create edges between conflicting sections
3. Detect conflicts through graph traversal
4. Categorize conflicts by type and severity

### Degree Audit
Progress tracking algorithm:
1. Fetch degree requirements by category
2. Match completed courses to requirements
3. Calculate completion percentage
4. Estimate graduation date based on pace
5. Generate warnings for incomplete requirements

## Environment Variables

- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment mode (development/production)
- `AI_SERVICE_URL`: URL for AI Service integration
- `DATABASE_URL`: PostgreSQL connection string (from database package)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid"
}
```

## Performance Considerations

- CSP solver uses optimizations for large search spaces
- Forward checking reduces search tree size
- Graph-based detection is O(n²) for n sections
- Caching recommended for degree requirements
- Consider pagination for large result sets

## Future Enhancements

- [ ] Multi-term schedule planning
- [ ] What-if scenario analysis
- [ ] Machine learning for preference learning
- [ ] Integration with course waitlist management
- [ ] Advanced optimization (e.g., genetic algorithms)
- [ ] Real-time schedule availability updates

## License

Private - Athletic Academics Hub
