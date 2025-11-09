# Compliance Service - Usage Examples

This document provides comprehensive examples of using the Compliance Service API endpoints.

## Table of Contents

1. [Initial Eligibility Checks](#initial-eligibility-checks)
2. [Continuing Eligibility Checks](#continuing-eligibility-checks)
3. [Status Monitoring](#status-monitoring)
4. [Violation Tracking](#violation-tracking)
5. [Audit Logging](#audit-logging)
6. [Rule Management](#rule-management)

---

## Initial Eligibility Checks

### Example 1: Successful Freshman Eligibility

A high school senior applying as a freshman with excellent academics and test scores.

**Request:**
```bash
curl -X POST http://localhost:3003/api/compliance/initial-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-001",
    "coreCourses": [
      {
        "id": "eng-1",
        "subject": "English",
        "courseNumber": "101",
        "name": "English Literature I",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "ENGLISH",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "eng-2",
        "subject": "English",
        "courseNumber": "102",
        "name": "English Literature II",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "ENGLISH",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "math-1",
        "subject": "Mathematics",
        "courseNumber": "101",
        "name": "Algebra I",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "MATH",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "math-2",
        "subject": "Mathematics",
        "courseNumber": "102",
        "name": "Geometry",
        "grade": "B",
        "gradePoints": 3.0,
        "creditHours": 1.0,
        "category": "MATH",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "sci-1",
        "subject": "Science",
        "courseNumber": "101",
        "name": "Biology",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "SCIENCE",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "sci-2",
        "subject": "Science",
        "courseNumber": "102",
        "name": "Chemistry",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "SCIENCE",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "sci-3",
        "subject": "Science",
        "courseNumber": "103",
        "name": "Physics",
        "grade": "B",
        "gradePoints": 3.0,
        "creditHours": 1.0,
        "category": "SCIENCE",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "hist-1",
        "subject": "History",
        "courseNumber": "101",
        "name": "US History",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "SOCIAL_SCIENCE",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "hist-2",
        "subject": "History",
        "courseNumber": "102",
        "name": "World History",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "SOCIAL_SCIENCE",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "hist-3",
        "subject": "History",
        "courseNumber": "103",
        "name": "Government",
        "grade": "B",
        "gradePoints": 3.0,
        "creditHours": 1.0,
        "category": "SOCIAL_SCIENCE",
        "completedBeforeSeniorYear": true
      },
      {
        "id": "lang-1",
        "subject": "Spanish",
        "courseNumber": "101",
        "name": "Spanish I",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "ADDITIONAL_ACADEMIC",
        "completedBeforeSeniorYear": false
      },
      {
        "id": "lang-2",
        "subject": "Spanish",
        "courseNumber": "102",
        "name": "Spanish II",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "ADDITIONAL_ACADEMIC",
        "completedBeforeSeniorYear": false
      },
      {
        "id": "math-3",
        "subject": "Mathematics",
        "courseNumber": "201",
        "name": "Algebra II",
        "grade": "B",
        "gradePoints": 3.0,
        "creditHours": 1.0,
        "category": "ADDITIONAL_ENGLISH_MATH_SCIENCE",
        "completedBeforeSeniorYear": false
      },
      {
        "id": "eng-3",
        "subject": "English",
        "courseNumber": "201",
        "name": "Creative Writing",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "ADDITIONAL_ENGLISH_MATH_SCIENCE",
        "completedBeforeSeniorYear": false
      },
      {
        "id": "art-1",
        "subject": "Art",
        "courseNumber": "101",
        "name": "Art History",
        "grade": "A",
        "gradePoints": 4.0,
        "creditHours": 1.0,
        "category": "ADDITIONAL_ACADEMIC",
        "completedBeforeSeniorYear": false
      },
      {
        "id": "music-1",
        "subject": "Music",
        "courseNumber": "101",
        "name": "Music Theory",
        "grade": "B",
        "gradePoints": 3.0,
        "creditHours": 1.0,
        "category": "ADDITIONAL_ACADEMIC",
        "completedBeforeSeniorYear": false
      }
    ],
    "testScores": {
      "satTotal": 1250,
      "actComposite": 27
    }
  }'
```

**Response:**
```json
{
  "studentId": "student-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "result": {
    "isEligible": true,
    "status": "ELIGIBLE",
    "violations": [],
    "warnings": [],
    "recommendations": [],
    "metadata": {
      "checkType": "initial_eligibility",
      "coreGpa": 3.688,
      "totalCoreCourses": 16
    }
  },
  "coreGpa": "3.688",
  "totalCoreCourses": 16,
  "rulesApplied": [
    "NCAA-DI-16-CORE",
    "NCAA-DI-10-7-RULE",
    "NCAA-DI-CORE-GPA",
    "NCAA-DI-SLIDING-SCALE"
  ]
}
```

### Example 2: Failed Initial Eligibility (Insufficient Core Courses)

Student completed only 14 core courses instead of required 16.

**Request:**
```bash
curl -X POST http://localhost:3003/api/compliance/initial-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-002",
    "coreCourses": [
      // ... 14 courses instead of 16
    ],
    "testScores": {
      "satTotal": 1100
    }
  }'
```

**Response:**
```json
{
  "studentId": "student-002",
  "timestamp": "2025-01-15T10:35:00Z",
  "result": {
    "isEligible": false,
    "status": "INELIGIBLE",
    "violations": [
      {
        "id": "v-core-courses-1705318500000",
        "ruleId": "NCAA-DI-16-CORE",
        "ruleName": "16 Core Courses Requirement",
        "category": "INITIAL_ELIGIBILITY",
        "severity": "CRITICAL",
        "message": "Must complete 16 NCAA-approved core courses",
        "details": "Student has completed 14 core courses, needs 2 more",
        "threshold": 16,
        "actualValue": 14,
        "timestamp": "2025-01-15T10:35:00Z"
      }
    ],
    "warnings": [],
    "recommendations": []
  }
}
```

---

## Continuing Eligibility Checks

### Example 3: Sophomore with Good Standing

Second-year student maintaining eligibility.

**Request:**
```bash
curl -X POST http://localhost:3003/api/compliance/continuing \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-003",
    "academicYear": 2,
    "cumulativeGpa": 3.2,
    "termGpa": 3.1,
    "totalCreditHours": 48,
    "creditHoursThisTerm": 15,
    "creditHoursPreviousTerm": 18,
    "progressTowardDegree": 42,
    "degreeRequirementHours": 120
  }'
```

**Response:**
```json
{
  "studentId": "student-003",
  "timestamp": "2025-01-15T11:00:00Z",
  "result": {
    "isEligible": true,
    "status": "ELIGIBLE",
    "violations": [],
    "warnings": [],
    "recommendations": [],
    "nextReviewDate": "2025-04-15T11:00:00Z",
    "metadata": {
      "checkType": "continuing_eligibility",
      "academicYear": 2,
      "cumulativeGpa": 3.2,
      "progressTowardDegree": 42
    }
  },
  "academicYear": 2,
  "rulesApplied": [
    "NCAA-DI-24-18-RULE",
    "NCAA-DI-40-60-80-RULE",
    "NCAA-DI-GPA-THRESHOLDS",
    "NCAA-DI-FULL-TIME",
    "NCAA-DI-6-HOUR"
  ]
}
```

### Example 4: Junior Failing Progress Requirements

Third-year student behind on degree progress (needs 60%, only has 50%).

**Request:**
```bash
curl -X POST http://localhost:3003/api/compliance/continuing \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-004",
    "academicYear": 3,
    "cumulativeGpa": 2.5,
    "termGpa": 2.3,
    "totalCreditHours": 60,
    "creditHoursThisTerm": 12,
    "creditHoursPreviousTerm": 15,
    "progressTowardDegree": 50,
    "degreeRequirementHours": 120
  }'
```

**Response:**
```json
{
  "studentId": "student-004",
  "timestamp": "2025-01-15T11:15:00Z",
  "result": {
    "isEligible": false,
    "status": "INELIGIBLE",
    "violations": [
      {
        "id": "v-progress-1705319700000",
        "ruleId": "NCAA-DI-40-60-80-RULE",
        "ruleName": "60% Progress Toward Degree Requirement",
        "category": "ACADEMIC_PROGRESS",
        "severity": "CRITICAL",
        "message": "Must complete 60% of degree requirements by end of year 3",
        "details": "Student at 50.0% progress, needs 10.0% more",
        "threshold": 60,
        "actualValue": 50.0,
        "timestamp": "2025-01-15T11:15:00Z"
      },
      {
        "id": "v-18-hours-1705319700000",
        "ruleId": "NCAA-DI-24-18-RULE",
        "ruleName": "18 Credit Hours Previous Year Requirement",
        "category": "CONTINUING_ELIGIBILITY",
        "severity": "CRITICAL",
        "message": "Must have completed 18 semester/quarter hours in previous academic year",
        "details": "Student completed 15 hours in previous year, short by 3 hours",
        "threshold": 18,
        "actualValue": 15,
        "timestamp": "2025-01-15T11:15:00Z"
      }
    ],
    "warnings": [],
    "recommendations": [
      "Complete approximately 12 more credit hours toward degree requirements",
      "Student must complete additional coursework to meet 18-hour requirement"
    ]
  }
}
```

---

## Status Monitoring

### Example 5: Check Current Eligibility Status

**Request:**
```bash
curl -X GET http://localhost:3003/api/compliance/status/student-003
```

**Response:**
```json
{
  "studentId": "student-003",
  "student": {
    "firstName": "John",
    "lastName": "Athlete",
    "sport": "Basketball"
  },
  "currentStatus": {
    "eligibilityStatus": "ELIGIBLE",
    "isEligible": true,
    "gpa": 3.2,
    "creditHours": 48,
    "progressPercent": 42,
    "lastChecked": "2025-01-15T11:00:00Z",
    "ruleVersion": "2025.1"
  },
  "latestCheck": {
    "checkId": "check-1705319400000-abc123",
    "checkedAt": "2025-01-15T11:00:00Z",
    "isEligible": true,
    "violations": null,
    "termGpa": 3.1,
    "cumulativeGpa": 3.2
  },
  "summary": {
    "totalChecks": 8,
    "eligibleChecks": 8,
    "ineligibleChecks": 0,
    "complianceRate": "100.0"
  },
  "recentHistory": [
    {
      "checkId": "check-1705319400000-abc123",
      "checkedAt": "2025-01-15T11:00:00Z",
      "isEligible": true,
      "cumulativeGpa": 3.2,
      "creditHours": 48,
      "progressPercent": 42
    }
  ]
}
```

---

## Violation Tracking

### Example 6: Get Violation History

**Request:**
```bash
curl -X GET "http://localhost:3003/api/compliance/violations/student/student-004/history"
```

**Response:**
```json
{
  "studentId": "student-004",
  "totalViolations": 15,
  "violationsByRule": [
    {
      "ruleId": "NCAA-DI-40-60-80-RULE",
      "count": 8,
      "firstOccurrence": "2024-09-01T10:00:00Z",
      "lastOccurrence": "2025-01-15T11:15:00Z",
      "violations": [
        {
          "date": "2025-01-15T11:15:00Z",
          "ruleId": "NCAA-DI-40-60-80-RULE",
          "severity": "CRITICAL",
          "message": "Must complete 60% of degree requirements by end of year 3"
        }
      ]
    },
    {
      "ruleId": "NCAA-DI-24-18-RULE",
      "count": 7,
      "firstOccurrence": "2024-09-01T10:00:00Z",
      "lastOccurrence": "2025-01-15T11:15:00Z",
      "violations": [
        {
          "date": "2025-01-15T11:15:00Z",
          "ruleId": "NCAA-DI-24-18-RULE",
          "severity": "CRITICAL",
          "message": "Must have completed 18 semester/quarter hours in previous academic year"
        }
      ]
    }
  ]
}
```

### Example 7: Check for Recurring Violations

**Request:**
```bash
curl -X GET "http://localhost:3003/api/compliance/violations/student/student-004/recurring?ruleId=NCAA-DI-GPA-THRESHOLDS&timeWindowDays=90"
```

**Response:**
```json
{
  "studentId": "student-004",
  "ruleId": "NCAA-DI-GPA-THRESHOLDS",
  "timeWindowDays": 90,
  "hasRecurringViolations": true,
  "occurrences": 4,
  "firstOccurrence": "2024-10-20T10:00:00Z",
  "lastOccurrence": "2025-01-15T11:15:00Z"
}
```

---

## Audit Logging

### Example 8: Get Complete Audit Log

**Request:**
```bash
curl -X GET "http://localhost:3003/api/compliance/audit-log/student-003?limit=10&offset=0"
```

**Response:**
```json
{
  "studentId": "student-003",
  "summary": {
    "totalChecks": 25,
    "eligibleChecks": 23,
    "ineligibleChecks": 2,
    "totalViolations": 3,
    "totalWarnings": 5,
    "lastCheckDate": "2025-01-15T11:00:00Z",
    "lastCheckResult": "ELIGIBLE"
  },
  "logs": [
    {
      "id": "audit-1705319400000-xyz789",
      "studentId": "student-003",
      "checkType": "continuing_eligibility",
      "result": "ELIGIBLE",
      "violations": 0,
      "warnings": 0,
      "performedBy": "user-123",
      "timestamp": "2025-01-15T11:00:00Z",
      "metadata": {
        "isEligible": true,
        "violationDetails": [],
        "warningDetails": []
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### Example 9: Get Filtered Audit Log

**Request:**
```bash
curl -X GET "http://localhost:3003/api/compliance/audit-log/student-003/filtered?checkType=continuing_eligibility&result=ELIGIBLE&limit=5"
```

**Response:**
```json
{
  "studentId": "student-003",
  "filters": {
    "checkType": "continuing_eligibility",
    "result": "ELIGIBLE"
  },
  "total": 15,
  "logs": [
    // ... filtered logs
  ]
}
```

---

## Rule Management

### Example 10: Update GPA Thresholds (Admin Only)

**Request:**
```bash
curl -X POST http://localhost:3003/api/compliance/rules/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "ruleId": "NCAA-DI-GPA-THRESHOLDS",
    "parameters": {
      "year1Minimum": 1.8,
      "year2Minimum": 1.9,
      "year3Minimum": 2.0,
      "year4Minimum": 2.0
    },
    "reason": "Updated to reflect 2025 NCAA policy changes for progressive GPA requirements"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Rule configuration updated successfully",
  "config": {
    "id": "config-1705320000000-def456",
    "ruleId": "NCAA-DI-GPA-THRESHOLDS",
    "parameters": {
      "year1Minimum": 1.8,
      "year2Minimum": 1.9,
      "year3Minimum": 2.0,
      "year4Minimum": 2.0
    },
    "isActive": true,
    "updatedAt": "2025-01-15T12:00:00Z",
    "updatedBy": "admin-user-456"
  },
  "reason": "Updated to reflect 2025 NCAA policy changes for progressive GPA requirements"
}
```

### Example 11: Get All NCAA Rules

**Request:**
```bash
curl -X GET http://localhost:3003/api/compliance/rules/list
```

**Response:**
```json
{
  "total": 9,
  "rules": [
    {
      "id": "NCAA-DI-16-CORE",
      "name": "16 Core Courses Requirement",
      "category": "INITIAL_ELIGIBILITY",
      "description": "Must complete 16 NCAA-approved core courses"
    },
    {
      "id": "NCAA-DI-10-7-RULE",
      "name": "10/7 Rule",
      "category": "INITIAL_ELIGIBILITY",
      "description": "10 core courses before senior year (7 in English/Math/Science)"
    },
    {
      "id": "NCAA-DI-CORE-GPA",
      "name": "Core Course GPA",
      "category": "INITIAL_ELIGIBILITY",
      "description": "Minimum 2.3 GPA in 16 core courses"
    }
    // ... more rules
  ]
}
```

### Example 12: Get Rule Configuration History

**Request:**
```bash
curl -X GET "http://localhost:3003/api/compliance/rules/NCAA-DI-GPA-THRESHOLDS/history?limit=5"
```

**Response:**
```json
{
  "ruleId": "NCAA-DI-GPA-THRESHOLDS",
  "total": 5,
  "history": [
    {
      "id": "config-1705320000000-def456",
      "ruleId": "NCAA-DI-GPA-THRESHOLDS",
      "parameters": {
        "year1Minimum": 1.8,
        "year2Minimum": 1.9,
        "year3Minimum": 2.0,
        "year4Minimum": 2.0
      },
      "isActive": true,
      "updatedAt": "2025-01-15T12:00:00Z",
      "updatedBy": "admin-user-456"
    },
    {
      "id": "config-1702728000000-abc123",
      "ruleId": "NCAA-DI-GPA-THRESHOLDS",
      "parameters": {
        "year1Minimum": 1.8,
        "year2Minimum": 1.8,
        "year3Minimum": 1.9,
        "year4Minimum": 2.0
      },
      "isActive": false,
      "updatedAt": "2024-12-16T10:00:00Z",
      "updatedBy": "admin-user-789"
    }
  ]
}
```

---

## Integration Examples

### Example 13: Complete Workflow - New Freshman

```javascript
// 1. Check initial eligibility
const initialCheck = await fetch('http://localhost:3003/api/compliance/initial-eligibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'new-student-001',
    coreCourses: [...], // 16 core courses
    testScores: { satTotal: 1200 }
  })
});

const initialResult = await initialCheck.json();

if (initialResult.result.isEligible) {
  console.log('Student is eligible to compete as freshman');

  // 2. Monitor status throughout the year
  const statusCheck = await fetch('http://localhost:3003/api/compliance/status/new-student-001');
  const status = await statusCheck.json();

  // 3. Run continuing eligibility at end of year
  const continuingCheck = await fetch('http://localhost:3003/api/compliance/continuing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: 'new-student-001',
      academicYear: 1,
      cumulativeGpa: 2.8,
      totalCreditHours: 30,
      creditHoursPreviousTerm: 15,
      progressTowardDegree: 25
    })
  });
}
```

---

## Testing with cURL

### Health Check
```bash
curl http://localhost:3003/health
```

### Quick Eligibility Check
```bash
curl -X POST http://localhost:3003/api/compliance/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{"studentId": "test-student", "checkType": "full"}'
```

These examples demonstrate the full capabilities of the Compliance Service for NCAA Division I eligibility validation.
