-- Add compliance users and regulation-watch persistence tables.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMPLIANCE';

CREATE TYPE "RegulationSourceType" AS ENUM (
  'FEDERAL',
  'STATE_OK',
  'NCAA',
  'SUMMIT_LEAGUE'
);

CREATE TYPE "RegulationAudience" AS ENUM (
  'COMPLIANCE',
  'COACH'
);

CREATE TYPE "RegulationChangeSeverity" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TABLE "RegulationSource" (
  "id" TEXT NOT NULL,
  "sourceType" "RegulationSourceType" NOT NULL,
  "name" TEXT NOT NULL,
  "feedUrl" TEXT NOT NULL,
  "pollCronMinutes" INTEGER NOT NULL DEFAULT 1440,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastFetchedAt" TIMESTAMP(3),
  "lastSuccessAt" TIMESTAMP(3),
  "lastErrorAt" TIMESTAMP(3),
  "lastErrorSummary" TEXT,
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  "circuitBreakerOpenUntil" TIMESTAMP(3),
  "parserVersion" TEXT NOT NULL DEFAULT '1',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RegulationSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationCheckRun" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "runKey" TEXT NOT NULL,
  "errorSummary" TEXT,
  "itemsFetched" INTEGER NOT NULL DEFAULT 0,
  "changesDetected" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "RegulationCheckRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationDocumentSnapshot" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contentHash" TEXT NOT NULL,
  "rawUrl" TEXT NOT NULL,
  "title" TEXT,
  "effectiveDate" TIMESTAMP(3),
  "normalizedBody" TEXT NOT NULL,
  "parserVersion" TEXT NOT NULL,
  "previousSnapshotId" TEXT,

  CONSTRAINT "RegulationDocumentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationChange" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "snapshotId" TEXT,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "severity" "RegulationChangeSeverity" NOT NULL DEFAULT 'MEDIUM',
  "summary" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "impactedDomains" TEXT[],
  "diffMetadata" JSONB,
  "materialityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
  "coachVisible" BOOLEAN NOT NULL DEFAULT false,
  "evidenceUrl" TEXT NOT NULL,
  "retrievalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "title" TEXT,

  CONSTRAINT "RegulationChange_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationAcknowledgement" (
  "id" TEXT NOT NULL,
  "changeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notes" TEXT,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RegulationAcknowledgement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationAudienceMapping" (
  "id" TEXT NOT NULL,
  "changeId" TEXT NOT NULL,
  "audience" "RegulationAudience" NOT NULL,

  CONSTRAINT "RegulationAudienceMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegulationSource_sourceType_name_key" ON "RegulationSource"("sourceType", "name");
CREATE INDEX "RegulationSource_sourceType_isActive_idx" ON "RegulationSource"("sourceType", "isActive");

CREATE UNIQUE INDEX "RegulationCheckRun_sourceId_runKey_key" ON "RegulationCheckRun"("sourceId", "runKey");
CREATE INDEX "RegulationCheckRun_sourceId_startedAt_idx" ON "RegulationCheckRun"("sourceId", "startedAt");

CREATE INDEX "RegulationDocumentSnapshot_sourceId_fetchedAt_idx" ON "RegulationDocumentSnapshot"("sourceId", "fetchedAt");
CREATE INDEX "RegulationDocumentSnapshot_contentHash_idx" ON "RegulationDocumentSnapshot"("contentHash");

CREATE INDEX "RegulationChange_detectedAt_idx" ON "RegulationChange"("detectedAt");
CREATE INDEX "RegulationChange_severity_idx" ON "RegulationChange"("severity");
CREATE INDEX "RegulationChange_coachVisible_idx" ON "RegulationChange"("coachVisible");
CREATE INDEX "RegulationChange_sourceId_detectedAt_idx" ON "RegulationChange"("sourceId", "detectedAt");

CREATE UNIQUE INDEX "RegulationAcknowledgement_changeId_userId_key" ON "RegulationAcknowledgement"("changeId", "userId");
CREATE INDEX "RegulationAcknowledgement_userId_idx" ON "RegulationAcknowledgement"("userId");

CREATE UNIQUE INDEX "RegulationAudienceMapping_changeId_audience_key" ON "RegulationAudienceMapping"("changeId", "audience");

ALTER TABLE "RegulationCheckRun" ADD CONSTRAINT "RegulationCheckRun_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "RegulationSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RegulationDocumentSnapshot" ADD CONSTRAINT "RegulationDocumentSnapshot_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "RegulationSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RegulationChange" ADD CONSTRAINT "RegulationChange_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "RegulationSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RegulationChange" ADD CONSTRAINT "RegulationChange_snapshotId_fkey"
  FOREIGN KEY ("snapshotId") REFERENCES "RegulationDocumentSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RegulationAcknowledgement" ADD CONSTRAINT "RegulationAcknowledgement_changeId_fkey"
  FOREIGN KEY ("changeId") REFERENCES "RegulationChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RegulationAcknowledgement" ADD CONSTRAINT "RegulationAcknowledgement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RegulationAudienceMapping" ADD CONSTRAINT "RegulationAudienceMapping_changeId_fkey"
  FOREIGN KEY ("changeId") REFERENCES "RegulationChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
