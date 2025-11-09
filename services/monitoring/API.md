# Monitoring Service API Reference

## Base URL
`/api/monitoring`

## Authentication
All endpoints require authentication via JWT token from Clerk (handled by API Gateway).

---

## Performance Metrics

### Get Performance Metrics
```http
GET /api/monitoring/performance/:studentId?term=FALL&academicYear=2024-2025
```

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "student123",
    "termGpa": 3.2,
    "cumulativeGpa": 3.1,
    "creditHours": 15,
    "attendance": 92,
    "studyHours": 18,
    "academicStanding": "GOOD_STANDING",
    "status": {
      "gpa": "ON_TARGET",
      "creditHours": "ABOVE_TARGET",
      "attendance": "ON_TARGET"
    },
    "trends": {
      "gpa": "IMPROVING",
      "attendance": "STABLE"
    }
  }
}
```

### Get Performance History
```http
GET /api/monitoring/performance/:studentId/history?metricType=GPA&limit=10
```

### Record Performance Metric
```http
POST /api/monitoring/performance/:studentId
Content-Type: application/json

{
  "metricType": "GPA",
  "value": 3.2,
  "term": "FALL",
  "academicYear": "2024-2025",
  "benchmark": 3.0,
  "notes": "End of term GPA"
}
```

---

## Progress Reports

### Submit Progress Report
```http
POST /api/monitoring/progress-report
Content-Type: application/json

{
  "studentId": "student123",
  "courseId": "CS101",
  "courseName": "Introduction to Computer Science",
  "instructor": "Dr. Smith",
  "term": "FALL",
  "academicYear": "2024-2025",
  "currentGrade": "B+",
  "attendance": "GOOD",
  "effort": "EXCELLENT",
  "comments": "Student is doing well overall.",
  "concerns": ["Missing some assignments"],
  "recommendations": "Meet with tutor for assignment help",
  "submittedBy": "faculty123"
}
```

### Get Student Progress Reports
```http
GET /api/monitoring/progress-report/student/:studentId?term=FALL&academicYear=2024-2025
```

### Get Progress Report
```http
GET /api/monitoring/progress-report/:reportId
```

### Review Progress Report
```http
PUT /api/monitoring/progress-report/:reportId/review
Content-Type: application/json

{
  "reviewerId": "admin123"
}
```

### Get Unreviewed Reports
```http
GET /api/monitoring/progress-report/unreviewed
```

### Get Report Summary
```http
GET /api/monitoring/progress-report/summary/:studentId/:term/:academicYear
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 5,
    "reportsWithConcerns": 2,
    "totalConcerns": 3,
    "gradeDistribution": {
      "A": 1,
      "B+": 2,
      "B": 2
    },
    "attendanceDistribution": {
      "EXCELLENT": 2,
      "GOOD": 3
    },
    "concernFrequency": {
      "Missing assignments": 2,
      "Low test scores": 1
    },
    "averageGrade": 3.3
  }
}
```

---

## Alerts

### Get Active Alerts
```http
GET /api/monitoring/alerts/:studentId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert123",
      "studentId": "student123",
      "alertType": "ACADEMIC",
      "severity": "HIGH",
      "title": "Low GPA Alert",
      "message": "GPA of 2.0 is at NCAA minimum requirement. Monitor closely.",
      "status": "ACTIVE",
      "metadata": {
        "gpa": 2.0,
        "threshold": 2.0
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Generate Alerts for Student
```http
POST /api/monitoring/alerts/generate/:studentId
```

### Create Alert Manually
```http
POST /api/monitoring/alerts
Content-Type: application/json

{
  "studentId": "student123",
  "alertType": "ATTENDANCE",
  "severity": "MEDIUM",
  "title": "Attendance Concern",
  "message": "Student has missed 3 classes this week",
  "metadata": {
    "missedClasses": 3,
    "week": "2024-W03"
  },
  "triggeredBy": "faculty123",
  "assignedTo": "advisor456"
}
```

### Acknowledge Alert
```http
PUT /api/monitoring/alerts/:alertId/acknowledge
Content-Type: application/json

{
  "userId": "staff123"
}
```

### Resolve Alert
```http
PUT /api/monitoring/alerts/:alertId/resolve
Content-Type: application/json

{
  "userId": "staff123",
  "resolution": "Met with student, created study plan"
}
```

### Dismiss Alert
```http
PUT /api/monitoring/alerts/:alertId/dismiss
```

---

## Intervention Plans

### Create Intervention Plan
```http
POST /api/monitoring/intervention
Content-Type: application/json

{
  "studentId": "student123",
  "planType": "ACADEMIC",
  "title": "Academic Success Plan",
  "description": "Comprehensive plan to improve GPA",
  "goals": [
    {
      "id": "goal1",
      "description": "Attend all tutoring sessions",
      "deadline": "2024-03-01",
      "status": "NOT_STARTED"
    },
    {
      "id": "goal2",
      "description": "Achieve B or higher on midterms",
      "deadline": "2024-03-15",
      "status": "NOT_STARTED"
    }
  ],
  "strategies": [
    {
      "id": "strategy1",
      "type": "TUTORING",
      "description": "Weekly math tutoring sessions",
      "assignedTo": "tutor123"
    }
  ],
  "timeline": {
    "startDate": "2024-01-20",
    "checkpoints": [
      {
        "date": "2024-02-15",
        "description": "Mid-plan review"
      }
    ],
    "endDate": "2024-05-01"
  },
  "assignedTo": "advisor123"
}
```

### Get Student Intervention Plans
```http
GET /api/monitoring/intervention/student/:studentId?status=ACTIVE
```

### Get Intervention Plan
```http
GET /api/monitoring/intervention/:planId
```

### Activate Intervention Plan
```http
PUT /api/monitoring/intervention/:planId/activate
```

### Update Intervention Plan
```http
PUT /api/monitoring/intervention/:planId
Content-Type: application/json

{
  "status": "ACTIVE",
  "outcomes": "Student attended all sessions"
}
```

### Complete Intervention Plan
```http
PUT /api/monitoring/intervention/:planId/complete
Content-Type: application/json

{
  "outcomes": "Student improved GPA to 2.8",
  "effectiveness": "EFFECTIVE"
}
```

### Cancel Intervention Plan
```http
PUT /api/monitoring/intervention/:planId/cancel
Content-Type: application/json

{
  "reason": "Student transferred to different program"
}
```

### Update Goal Status
```http
PUT /api/monitoring/intervention/:planId/goal/:goalId
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

### Get Intervention Statistics
```http
GET /api/monitoring/intervention/stats?planType=ACADEMIC
```

---

## Team Analytics

### Get Team Analytics
```http
GET /api/monitoring/analytics/team/:teamId?term=FALL&academicYear=2024-2025
```

**Response:**
```json
{
  "success": true,
  "data": {
    "teamId": "basketball",
    "teamName": "basketball",
    "totalStudents": 15,
    "metrics": {
      "averageGpa": 3.1,
      "averageCreditHours": 14.5,
      "averageAttendance": 92.3,
      "eligibilityRate": 93.3
    },
    "riskDistribution": {
      "critical": 0,
      "high": 1,
      "medium": 3,
      "low": 11
    },
    "trends": {
      "gpa": {
        "current": 3.1,
        "previous": 3.0,
        "change": 0.1
      },
      "eligibility": {
        "current": 93.3,
        "previous": 86.7,
        "change": 6.6
      }
    },
    "alerts": {
      "total": 8,
      "bySeverity": {
        "critical": 0,
        "high": 2,
        "medium": 4,
        "low": 2
      }
    },
    "topConcerns": [
      {
        "type": "ACADEMIC",
        "count": 5,
        "percentage": 62.5
      },
      {
        "type": "ATTENDANCE",
        "count": 3,
        "percentage": 37.5
      }
    ]
  }
}
```

### Compare Student to Team
```http
GET /api/monitoring/analytics/comparison/:studentId/:teamId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "gpa": 3.5,
      "creditHours": 15,
      "attendance": 95
    },
    "team": {
      "averageGpa": 3.1,
      "averageCreditHours": 14.5,
      "averageAttendance": 92.3
    },
    "comparison": {
      "gpa": 12.9,
      "creditHours": 3.4,
      "attendance": 2.9
    }
  }
}
```

### Get Team Trends
```http
GET /api/monitoring/analytics/trends/:teamId?numberOfTerms=4
```

---

## Risk Assessment (AI Integration)

### Perform Risk Assessment
```http
POST /api/monitoring/risk-assessment
Content-Type: application/json

{
  "studentId": "student123",
  "includeRecommendations": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "student123",
    "riskScore": 45,
    "riskLevel": "MEDIUM",
    "confidence": 0.85,
    "factors": [
      {
        "factor": "GPA",
        "impact": "NEGATIVE",
        "weight": 0.35,
        "value": 2.3
      },
      {
        "factor": "Attendance",
        "impact": "POSITIVE",
        "weight": 0.25,
        "value": 92
      },
      {
        "factor": "Study Hours",
        "impact": "NEGATIVE",
        "weight": 0.15,
        "value": 8
      }
    ],
    "recommendations": [
      "Schedule regular tutoring sessions",
      "Increase study hours to at least 15/week",
      "Meet with academic advisor"
    ],
    "generatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Batch Risk Assessment
```http
POST /api/monitoring/risk-assessment/batch
Content-Type: application/json

{
  "studentIds": ["student123", "student456", "student789"],
  "includeRecommendations": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "assessments": [
      {
        "studentId": "student123",
        "riskScore": 45,
        "riskLevel": "MEDIUM",
        "confidence": 0.85,
        "factors": [...],
        "generatedAt": "2024-01-15T10:00:00Z"
      },
      ...
    ],
    "errors": []
  }
}
```

---

## Real-time Events (Pusher)

### Channels

- `student-{studentId}` - Student-specific notifications
- `alerts-priority` - High/critical alerts for staff

### Events

#### Alert Event
```javascript
pusher.subscribe('student-123').bind('alert', (data) => {
  // data.alertId
  // data.type
  // data.severity
  // data.title
  // data.message
  // data.metadata
  // data.timestamp
});
```

#### Intervention Update Event
```javascript
pusher.subscribe('student-123').bind('intervention-update', (data) => {
  // data.interventionId
  // data.planType
  // data.status
  // data.title
  // data.timestamp
});
```

#### Progress Report Event
```javascript
pusher.subscribe('student-123').bind('progress-report', (data) => {
  // data.reportId
  // data.courseName
  // data.currentGrade
  // data.hasConcerns
  // data.timestamp
});
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
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid input data
- `NOT_FOUND` (404) - Resource not found
- `AI_SERVICE_UNAVAILABLE` (503) - AI Service is down
- `INTERNAL_SERVER_ERROR` (500) - Unexpected error

---

## Rate Limits

- Performance metrics: 100 requests/minute per student
- Alert generation: 10 requests/minute per student
- Risk assessment: 50 requests/minute total
- Batch risk assessment: 10 requests/minute total

---

## Best Practices

1. **Alert Generation**: Call `/alerts/generate/:studentId` after recording new performance metrics
2. **Batch Operations**: Use batch risk assessment for team-wide analysis
3. **Real-time Updates**: Subscribe to Pusher channels for live updates
4. **Error Handling**: Always check `success` field in responses
5. **Pagination**: Use `limit` and `offset` parameters for large datasets
