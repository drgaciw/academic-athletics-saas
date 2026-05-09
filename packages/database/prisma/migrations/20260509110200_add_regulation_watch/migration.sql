-- CreateEnum
CREATE TYPE "RegulationSourceType" AS ENUM ('FEDERAL', 'STATE_OK', 'NCAA', 'SUMMIT_LEAGUE');

-- CreateEnum
CREATE TYPE "RegulationAudience" AS ENUM ('COMPLIANCE', 'COACH');

-- CreateEnum
CREATE TYPE "RegulationChangeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'COMPLIANCE';

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "RegulationAcknowledgement" (
    "id" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulationAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulationAudienceMapping" (
    "id" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "audience" "RegulationAudience" NOT NULL,

    CONSTRAINT "RegulationAudienceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegulationSource_sourceType_isActive_idx" ON "RegulationSource"("sourceType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationSource_sourceType_name_key" ON "RegulationSource"("sourceType", "name");

-- CreateIndex
CREATE INDEX "RegulationCheckRun_sourceId_startedAt_idx" ON "RegulationCheckRun"("sourceId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationCheckRun_sourceId_runKey_key" ON "RegulationCheckRun"("sourceId", "runKey");

-- CreateIndex
CREATE INDEX "RegulationDocumentSnapshot_sourceId_fetchedAt_idx" ON "RegulationDocumentSnapshot"("sourceId", "fetchedAt");

-- CreateIndex
CREATE INDEX "RegulationDocumentSnapshot_contentHash_idx" ON "RegulationDocumentSnapshot"("contentHash");

-- CreateIndex
CREATE INDEX "RegulationChange_detectedAt_idx" ON "RegulationChange"("detectedAt");

-- CreateIndex
CREATE INDEX "RegulationChange_severity_idx" ON "RegulationChange"("severity");

-- CreateIndex
CREATE INDEX "RegulationChange_coachVisible_idx" ON "RegulationChange"("coachVisible");

-- CreateIndex
CREATE INDEX "RegulationChange_sourceId_detectedAt_idx" ON "RegulationChange"("sourceId", "detectedAt");

-- CreateIndex
CREATE INDEX "RegulationAcknowledgement_userId_idx" ON "RegulationAcknowledgement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationAcknowledgement_changeId_userId_key" ON "RegulationAcknowledgement"("changeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationAudienceMapping_changeId_audience_key" ON "RegulationAudienceMapping"("changeId", "audience");

-- AddForeignKey
ALTER TABLE "RegulationCheckRun" ADD CONSTRAINT "RegulationCheckRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RegulationSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationDocumentSnapshot" ADD CONSTRAINT "RegulationDocumentSnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RegulationSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationChange" ADD CONSTRAINT "RegulationChange_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RegulationSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationChange" ADD CONSTRAINT "RegulationChange_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RegulationDocumentSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationAcknowledgement" ADD CONSTRAINT "RegulationAcknowledgement_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "RegulationChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationAcknowledgement" ADD CONSTRAINT "RegulationAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationAudienceMapping" ADD CONSTRAINT "RegulationAudienceMapping_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "RegulationChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

