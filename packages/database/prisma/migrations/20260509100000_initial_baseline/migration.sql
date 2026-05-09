-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN', 'COACH', 'FACULTY', 'STAFF');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "aiOptIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "team" TEXT,
    "gpa" DOUBLE PRECISION,
    "creditHours" INTEGER NOT NULL DEFAULT 0,
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "athleticSchedule" JSONB,
    "academicStanding" TEXT DEFAULT 'GOOD_STANDING',
    "enrollmentStatus" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "expectedGradDate" TIMESTAMP(3),
    "major" TEXT,
    "minor" TEXT,
    "advisor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "teams" TEXT[],
    "title" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "officeLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termGpa" DOUBLE PRECISION NOT NULL,
    "cumulativeGpa" DOUBLE PRECISION NOT NULL,
    "creditHours" INTEGER NOT NULL,
    "progressPercent" DOUBLE PRECISION NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "violations" JSONB,
    "ruleVersion" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "criteria" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceViolation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "violationType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "description" TEXT,
    "prerequisites" JSONB,
    "corequisites" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSection" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionNumber" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "instructor" TEXT,
    "days" TEXT[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "capacity" INTEGER NOT NULL,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "meetingPattern" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleConflict" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedCourses" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNRESOLVED',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeRequirement" (
    "id" TEXT NOT NULL,
    "degreeProgram" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "courseId" TEXT,
    "requirementType" TEXT NOT NULL,
    "credits" INTEGER,
    "description" TEXT NOT NULL,
    "alternatives" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DegreeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "degreeProgram" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "grade" TEXT,
    "credits" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "satisfiesRequirement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DegreeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "benchmark" DOUBLE PRECISION,
    "status" TEXT,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "currentGrade" TEXT,
    "attendance" TEXT,
    "effort" TEXT,
    "comments" TEXT,
    "concerns" TEXT[],
    "recommendations" TEXT,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "triggeredBy" TEXT,
    "createdBy" TEXT,
    "assignedTo" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionPlan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goals" JSONB NOT NULL,
    "strategies" JSONB NOT NULL,
    "timeline" JSONB NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "outcomes" TEXT,
    "effectiveness" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subjects" TEXT[],
    "availability" JSONB NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "userId" TEXT,
    "subject" TEXT NOT NULL,
    "courseCode" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "location" TEXT,
    "meetingType" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "attended" BOOLEAN,
    "notes" TEXT,
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyHallAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "duration" INTEGER,
    "location" TEXT NOT NULL,
    "activity" TEXT,
    "notes" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyHallAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "location" TEXT,
    "meetingType" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "capacity" INTEGER NOT NULL,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "materials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopRegistration" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "feedback" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorMatch" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "frequency" TEXT,
    "focusAreas" TEXT[],
    "goals" JSONB,
    "notes" TEXT,
    "effectiveness" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelLetter" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventLocation" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "courses" JSONB NOT NULL,
    "instructors" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveryMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceNotification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "instructorEmail" TEXT NOT NULL,
    "absenceDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsenceNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "modelUsed" TEXT,
    "functionCall" JSONB,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorEmbedding" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "metadata" JSONB NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "vectorized" BOOLEAN NOT NULL DEFAULT false,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "feedbackType" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictiveRiskScore" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "modelId" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "recommendations" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictiveRiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "agentType" TEXT,
    "conversationId" TEXT,
    "taskId" TEXT,
    "toolName" TEXT,
    "toolParameters" JSONB,
    "toolResult" JSONB,
    "inputSummary" TEXT,
    "outputSummary" TEXT,
    "modelUsed" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "accuracyRating" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "userRole" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionModel" (
    "id" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "accuracyMetrics" JSONB NOT NULL,
    "featureImportance" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPrediction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "accuracy" DOUBLE PRECISION,

    CONSTRAINT "StudentPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "inputParams" JSONB NOT NULL,
    "outputResult" JSONB,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION DEFAULT 1.0,
    "importance" DOUBLE PRECISION DEFAULT 0.5,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalRun" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "datasetVersion" TEXT NOT NULL,
    "datasetName" TEXT,
    "modelId" TEXT NOT NULL,
    "modelConfig" JSONB NOT NULL,
    "runnerType" TEXT NOT NULL,
    "scorerConfig" JSONB NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMs" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "expected" JSONB NOT NULL,
    "actual" JSONB NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "explanation" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "tokenUsage" JSONB NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalMetrics" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "totalTests" INTEGER NOT NULL,
    "passedTests" INTEGER NOT NULL,
    "failedTests" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "passRate" DOUBLE PRECISION NOT NULL,
    "avgScore" DOUBLE PRECISION NOT NULL,
    "avgLatencyMs" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "categoryBreakdown" JSONB,
    "failuresByType" JSONB,
    "scoreDistribution" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalBaseline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvalBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseSectionToSchedule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "StudentProfile"("studentId");

-- CreateIndex
CREATE INDEX "StudentProfile_studentId_idx" ON "StudentProfile"("studentId");

-- CreateIndex
CREATE INDEX "StudentProfile_sport_idx" ON "StudentProfile"("sport");

-- CreateIndex
CREATE INDEX "StudentProfile_eligibilityStatus_idx" ON "StudentProfile"("eligibilityStatus");

-- CreateIndex
CREATE INDEX "StudentProfile_academicStanding_idx" ON "StudentProfile"("academicStanding");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_coachId_key" ON "CoachProfile"("coachId");

-- CreateIndex
CREATE INDEX "CoachProfile_coachId_idx" ON "CoachProfile"("coachId");

-- CreateIndex
CREATE INDEX "CoachProfile_sport_idx" ON "CoachProfile"("sport");

-- CreateIndex
CREATE INDEX "ComplianceRecord_studentId_idx" ON "ComplianceRecord"("studentId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_term_academicYear_idx" ON "ComplianceRecord"("term", "academicYear");

-- CreateIndex
CREATE INDEX "ComplianceRecord_isEligible_idx" ON "ComplianceRecord"("isEligible");

-- CreateIndex
CREATE INDEX "ComplianceRecord_createdAt_idx" ON "ComplianceRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRule_ruleCode_key" ON "ComplianceRule"("ruleCode");

-- CreateIndex
CREATE INDEX "ComplianceRule_ruleCode_idx" ON "ComplianceRule"("ruleCode");

-- CreateIndex
CREATE INDEX "ComplianceRule_category_idx" ON "ComplianceRule"("category");

-- CreateIndex
CREATE INDEX "ComplianceRule_ruleType_idx" ON "ComplianceRule"("ruleType");

-- CreateIndex
CREATE INDEX "ComplianceRule_isActive_idx" ON "ComplianceRule"("isActive");

-- CreateIndex
CREATE INDEX "ComplianceRule_effectiveDate_idx" ON "ComplianceRule"("effectiveDate");

-- CreateIndex
CREATE INDEX "ComplianceViolation_studentId_idx" ON "ComplianceViolation"("studentId");

-- CreateIndex
CREATE INDEX "ComplianceViolation_ruleId_idx" ON "ComplianceViolation"("ruleId");

-- CreateIndex
CREATE INDEX "ComplianceViolation_severity_idx" ON "ComplianceViolation"("severity");

-- CreateIndex
CREATE INDEX "ComplianceViolation_status_idx" ON "ComplianceViolation"("status");

-- CreateIndex
CREATE INDEX "ComplianceViolation_detectedAt_idx" ON "ComplianceViolation"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_courseCode_key" ON "Course"("courseCode");

-- CreateIndex
CREATE INDEX "Course_courseCode_idx" ON "Course"("courseCode");

-- CreateIndex
CREATE INDEX "Course_department_idx" ON "Course"("department");

-- CreateIndex
CREATE INDEX "Course_level_idx" ON "Course"("level");

-- CreateIndex
CREATE INDEX "CourseSection_courseId_idx" ON "CourseSection"("courseId");

-- CreateIndex
CREATE INDEX "CourseSection_term_academicYear_idx" ON "CourseSection"("term", "academicYear");

-- CreateIndex
CREATE INDEX "CourseSection_instructor_idx" ON "CourseSection"("instructor");

-- CreateIndex
CREATE INDEX "CourseSection_isOpen_idx" ON "CourseSection"("isOpen");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSection_courseId_sectionNumber_term_academicYear_key" ON "CourseSection"("courseId", "sectionNumber", "term", "academicYear");

-- CreateIndex
CREATE INDEX "Schedule_studentId_idx" ON "Schedule"("studentId");

-- CreateIndex
CREATE INDEX "Schedule_term_academicYear_idx" ON "Schedule"("term", "academicYear");

-- CreateIndex
CREATE INDEX "Schedule_status_idx" ON "Schedule"("status");

-- CreateIndex
CREATE INDEX "ScheduleConflict_scheduleId_idx" ON "ScheduleConflict"("scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleConflict_studentId_idx" ON "ScheduleConflict"("studentId");

-- CreateIndex
CREATE INDEX "ScheduleConflict_conflictType_idx" ON "ScheduleConflict"("conflictType");

-- CreateIndex
CREATE INDEX "ScheduleConflict_status_idx" ON "ScheduleConflict"("status");

-- CreateIndex
CREATE INDEX "DegreeRequirement_degreeProgram_idx" ON "DegreeRequirement"("degreeProgram");

-- CreateIndex
CREATE INDEX "DegreeRequirement_category_idx" ON "DegreeRequirement"("category");

-- CreateIndex
CREATE INDEX "DegreeProgress_studentId_idx" ON "DegreeProgress"("studentId");

-- CreateIndex
CREATE INDEX "DegreeProgress_degreeProgram_idx" ON "DegreeProgress"("degreeProgram");

-- CreateIndex
CREATE INDEX "DegreeProgress_status_idx" ON "DegreeProgress"("status");

-- CreateIndex
CREATE INDEX "DegreeProgress_term_academicYear_idx" ON "DegreeProgress"("term", "academicYear");

-- CreateIndex
CREATE INDEX "PerformanceMetric_studentId_idx" ON "PerformanceMetric"("studentId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricType_idx" ON "PerformanceMetric"("metricType");

-- CreateIndex
CREATE INDEX "PerformanceMetric_term_academicYear_idx" ON "PerformanceMetric"("term", "academicYear");

-- CreateIndex
CREATE INDEX "PerformanceMetric_status_idx" ON "PerformanceMetric"("status");

-- CreateIndex
CREATE INDEX "ProgressReport_studentId_idx" ON "ProgressReport"("studentId");

-- CreateIndex
CREATE INDEX "ProgressReport_courseId_idx" ON "ProgressReport"("courseId");

-- CreateIndex
CREATE INDEX "ProgressReport_term_academicYear_idx" ON "ProgressReport"("term", "academicYear");

-- CreateIndex
CREATE INDEX "ProgressReport_submittedAt_idx" ON "ProgressReport"("submittedAt");

-- CreateIndex
CREATE INDEX "Alert_studentId_idx" ON "Alert"("studentId");

-- CreateIndex
CREATE INDEX "Alert_alertType_idx" ON "Alert"("alertType");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "InterventionPlan_studentId_idx" ON "InterventionPlan"("studentId");

-- CreateIndex
CREATE INDEX "InterventionPlan_planType_idx" ON "InterventionPlan"("planType");

-- CreateIndex
CREATE INDEX "InterventionPlan_status_idx" ON "InterventionPlan"("status");

-- CreateIndex
CREATE INDEX "InterventionPlan_startDate_idx" ON "InterventionPlan"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_email_key" ON "Tutor"("email");

-- CreateIndex
CREATE INDEX "Tutor_email_idx" ON "Tutor"("email");

-- CreateIndex
CREATE INDEX "Tutor_isActive_idx" ON "Tutor"("isActive");

-- CreateIndex
CREATE INDEX "TutoringSession_studentId_idx" ON "TutoringSession"("studentId");

-- CreateIndex
CREATE INDEX "TutoringSession_tutorId_idx" ON "TutoringSession"("tutorId");

-- CreateIndex
CREATE INDEX "TutoringSession_scheduledAt_idx" ON "TutoringSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "TutoringSession_status_idx" ON "TutoringSession"("status");

-- CreateIndex
CREATE INDEX "StudyHallAttendance_studentId_idx" ON "StudyHallAttendance"("studentId");

-- CreateIndex
CREATE INDEX "StudyHallAttendance_checkInTime_idx" ON "StudyHallAttendance"("checkInTime");

-- CreateIndex
CREATE INDEX "StudyHallAttendance_location_idx" ON "StudyHallAttendance"("location");

-- CreateIndex
CREATE INDEX "Workshop_category_idx" ON "Workshop"("category");

-- CreateIndex
CREATE INDEX "Workshop_scheduledAt_idx" ON "Workshop"("scheduledAt");

-- CreateIndex
CREATE INDEX "Workshop_isActive_idx" ON "Workshop"("isActive");

-- CreateIndex
CREATE INDEX "WorkshopRegistration_workshopId_idx" ON "WorkshopRegistration"("workshopId");

-- CreateIndex
CREATE INDEX "WorkshopRegistration_studentId_idx" ON "WorkshopRegistration"("studentId");

-- CreateIndex
CREATE INDEX "WorkshopRegistration_status_idx" ON "WorkshopRegistration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopRegistration_workshopId_studentId_key" ON "WorkshopRegistration"("workshopId", "studentId");

-- CreateIndex
CREATE INDEX "MentorMatch_mentorId_idx" ON "MentorMatch"("mentorId");

-- CreateIndex
CREATE INDEX "MentorMatch_menteeId_idx" ON "MentorMatch"("menteeId");

-- CreateIndex
CREATE INDEX "MentorMatch_status_idx" ON "MentorMatch"("status");

-- CreateIndex
CREATE INDEX "TravelLetter_studentId_idx" ON "TravelLetter"("studentId");

-- CreateIndex
CREATE INDEX "TravelLetter_departureDate_idx" ON "TravelLetter"("departureDate");

-- CreateIndex
CREATE INDEX "TravelLetter_status_idx" ON "TravelLetter"("status");

-- CreateIndex
CREATE INDEX "AbsenceNotification_studentId_idx" ON "AbsenceNotification"("studentId");

-- CreateIndex
CREATE INDEX "AbsenceNotification_absenceDate_idx" ON "AbsenceNotification"("absenceDate");

-- CreateIndex
CREATE INDEX "AbsenceNotification_acknowledged_idx" ON "AbsenceNotification"("acknowledged");

-- CreateIndex
CREATE INDEX "EmailLog_userId_idx" ON "EmailLog"("userId");

-- CreateIndex
CREATE INDEX "EmailLog_recipient_idx" ON "EmailLog"("recipient");

-- CreateIndex
CREATE INDEX "EmailLog_emailType_idx" ON "EmailLog"("emailType");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventType_idx" ON "CalendarEvent"("eventType");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_externalId_idx" ON "CalendarEvent"("externalId");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_timestamp_idx" ON "Message"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "VectorEmbedding_contentHash_key" ON "VectorEmbedding"("contentHash");

-- CreateIndex
CREATE INDEX "VectorEmbedding_contentType_idx" ON "VectorEmbedding"("contentType");

-- CreateIndex
CREATE INDEX "VectorEmbedding_contentHash_idx" ON "VectorEmbedding"("contentHash");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_documentType_idx" ON "KnowledgeDocument"("documentType");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_category_idx" ON "KnowledgeDocument"("category");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_vectorized_idx" ON "KnowledgeDocument"("vectorized");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_isActive_idx" ON "KnowledgeDocument"("isActive");

-- CreateIndex
CREATE INDEX "AIFeedback_userId_idx" ON "AIFeedback"("userId");

-- CreateIndex
CREATE INDEX "AIFeedback_feedbackType_idx" ON "AIFeedback"("feedbackType");

-- CreateIndex
CREATE INDEX "AIFeedback_createdAt_idx" ON "AIFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "PredictiveRiskScore_studentId_idx" ON "PredictiveRiskScore"("studentId");

-- CreateIndex
CREATE INDEX "PredictiveRiskScore_riskLevel_idx" ON "PredictiveRiskScore"("riskLevel");

-- CreateIndex
CREATE INDEX "PredictiveRiskScore_generatedAt_idx" ON "PredictiveRiskScore"("generatedAt");

-- CreateIndex
CREATE INDEX "AIAuditLog_userId_timestamp_idx" ON "AIAuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AIAuditLog_actionType_idx" ON "AIAuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AIAuditLog_agentType_idx" ON "AIAuditLog"("agentType");

-- CreateIndex
CREATE INDEX "AIAuditLog_modelUsed_idx" ON "AIAuditLog"("modelUsed");

-- CreateIndex
CREATE INDEX "AIAuditLog_conversationId_idx" ON "AIAuditLog"("conversationId");

-- CreateIndex
CREATE INDEX "AIAuditLog_taskId_idx" ON "AIAuditLog"("taskId");

-- CreateIndex
CREATE INDEX "AIAuditLog_toolName_idx" ON "AIAuditLog"("toolName");

-- CreateIndex
CREATE INDEX "AIAuditLog_success_idx" ON "AIAuditLog"("success");

-- CreateIndex
CREATE INDEX "AIAuditLog_timestamp_idx" ON "AIAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "PredictionModel_modelType_idx" ON "PredictionModel"("modelType");

-- CreateIndex
CREATE INDEX "PredictionModel_active_idx" ON "PredictionModel"("active");

-- CreateIndex
CREATE INDEX "StudentPrediction_studentId_idx" ON "StudentPrediction"("studentId");

-- CreateIndex
CREATE INDEX "StudentPrediction_modelId_idx" ON "StudentPrediction"("modelId");

-- CreateIndex
CREATE INDEX "StudentPrediction_predictionType_idx" ON "StudentPrediction"("predictionType");

-- CreateIndex
CREATE INDEX "StudentPrediction_generatedAt_idx" ON "StudentPrediction"("generatedAt");

-- CreateIndex
CREATE INDEX "AgentTask_agentType_idx" ON "AgentTask"("agentType");

-- CreateIndex
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");

-- CreateIndex
CREATE INDEX "AgentTask_createdAt_idx" ON "AgentTask"("createdAt");

-- CreateIndex
CREATE INDEX "AgentMemory_userId_memoryType_idx" ON "AgentMemory"("userId", "memoryType");

-- CreateIndex
CREATE INDEX "AgentMemory_userId_expiresAt_idx" ON "AgentMemory"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AgentMemory_memoryType_idx" ON "AgentMemory"("memoryType");

-- CreateIndex
CREATE INDEX "AgentMemory_importance_idx" ON "AgentMemory"("importance");

-- CreateIndex
CREATE INDEX "AgentMemory_createdAt_idx" ON "AgentMemory"("createdAt");

-- CreateIndex
CREATE INDEX "EvalRun_datasetId_idx" ON "EvalRun"("datasetId");

-- CreateIndex
CREATE INDEX "EvalRun_modelId_idx" ON "EvalRun"("modelId");

-- CreateIndex
CREATE INDEX "EvalRun_runnerType_idx" ON "EvalRun"("runnerType");

-- CreateIndex
CREATE INDEX "EvalRun_status_idx" ON "EvalRun"("status");

-- CreateIndex
CREATE INDEX "EvalRun_startTime_idx" ON "EvalRun"("startTime");

-- CreateIndex
CREATE INDEX "EvalRun_createdAt_idx" ON "EvalRun"("createdAt");

-- CreateIndex
CREATE INDEX "EvalResult_runId_idx" ON "EvalResult"("runId");

-- CreateIndex
CREATE INDEX "EvalResult_testCaseId_idx" ON "EvalResult"("testCaseId");

-- CreateIndex
CREATE INDEX "EvalResult_passed_idx" ON "EvalResult"("passed");

-- CreateIndex
CREATE INDEX "EvalResult_score_idx" ON "EvalResult"("score");

-- CreateIndex
CREATE INDEX "EvalResult_createdAt_idx" ON "EvalResult"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvalMetrics_runId_key" ON "EvalMetrics"("runId");

-- CreateIndex
CREATE INDEX "EvalMetrics_runId_idx" ON "EvalMetrics"("runId");

-- CreateIndex
CREATE INDEX "EvalMetrics_accuracy_idx" ON "EvalMetrics"("accuracy");

-- CreateIndex
CREATE INDEX "EvalMetrics_avgScore_idx" ON "EvalMetrics"("avgScore");

-- CreateIndex
CREATE INDEX "EvalMetrics_createdAt_idx" ON "EvalMetrics"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvalBaseline_name_key" ON "EvalBaseline"("name");

-- CreateIndex
CREATE INDEX "EvalBaseline_name_idx" ON "EvalBaseline"("name");

-- CreateIndex
CREATE INDEX "EvalBaseline_datasetId_idx" ON "EvalBaseline"("datasetId");

-- CreateIndex
CREATE INDEX "EvalBaseline_modelId_idx" ON "EvalBaseline"("modelId");

-- CreateIndex
CREATE INDEX "EvalBaseline_isActive_idx" ON "EvalBaseline"("isActive");

-- CreateIndex
CREATE INDEX "EvalBaseline_createdAt_idx" ON "EvalBaseline"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_CourseSectionToSchedule_AB_unique" ON "_CourseSectionToSchedule"("A", "B");

-- CreateIndex
CREATE INDEX "_CourseSectionToSchedule_B_index" ON "_CourseSectionToSchedule"("B");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceViolation" ADD CONSTRAINT "ComplianceViolation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceViolation" ADD CONSTRAINT "ComplianceViolation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleConflict" ADD CONSTRAINT "ScheduleConflict_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleConflict" ADD CONSTRAINT "ScheduleConflict_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeRequirement" ADD CONSTRAINT "DegreeRequirement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeProgress" ADD CONSTRAINT "DegreeProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeProgress" ADD CONSTRAINT "DegreeProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionPlan" ADD CONSTRAINT "InterventionPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionPlan" ADD CONSTRAINT "InterventionPlan_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSession" ADD CONSTRAINT "TutoringSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSession" ADD CONSTRAINT "TutoringSession_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringSession" ADD CONSTRAINT "TutoringSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyHallAttendance" ADD CONSTRAINT "StudyHallAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopRegistration" ADD CONSTRAINT "WorkshopRegistration_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopRegistration" ADD CONSTRAINT "WorkshopRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorMatch" ADD CONSTRAINT "MentorMatch_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorMatch" ADD CONSTRAINT "MentorMatch_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelLetter" ADD CONSTRAINT "TravelLetter_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceNotification" ADD CONSTRAINT "AbsenceNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveRiskScore" ADD CONSTRAINT "PredictiveRiskScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveRiskScore" ADD CONSTRAINT "PredictiveRiskScore_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "PredictionModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAuditLog" ADD CONSTRAINT "AIAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPrediction" ADD CONSTRAINT "StudentPrediction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPrediction" ADD CONSTRAINT "StudentPrediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "PredictionModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvalResult" ADD CONSTRAINT "EvalResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "EvalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvalMetrics" ADD CONSTRAINT "EvalMetrics_runId_fkey" FOREIGN KEY ("runId") REFERENCES "EvalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseSectionToSchedule" ADD CONSTRAINT "_CourseSectionToSchedule_A_fkey" FOREIGN KEY ("A") REFERENCES "CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseSectionToSchedule" ADD CONSTRAINT "_CourseSectionToSchedule_B_fkey" FOREIGN KEY ("B") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

