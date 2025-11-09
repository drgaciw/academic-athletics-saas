/**
 * Audit Logger Service
 * Records all compliance checks for NCAA audit trail
 */

import { prisma } from '@aah/database'
import {
  AuditLogEntry,
  EligibilityStatus,
  ValidationResult,
  StudentData,
} from '../types'

/**
 * Log a compliance check to the audit trail
 */
export async function logComplianceCheck(
  studentId: string,
  checkType: string,
  result: ValidationResult,
  performedBy: string,
  metadata?: Record<string, any>
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    studentId,
    checkType,
    result: result.status,
    violations: result.violations.length,
    warnings: result.warnings.length,
    performedBy,
    timestamp: new Date(),
    metadata: {
      ...metadata,
      isEligible: result.isEligible,
      violationDetails: result.violations.map((v) => ({
        ruleId: v.ruleId,
        severity: v.severity,
        message: v.message,
      })),
      warningDetails: result.warnings.map((w) => ({
        ruleId: w.ruleId,
        message: w.message,
      })),
    },
  }

  // Store in database (assumes ComplianceAuditLog model exists)
  try {
    await prisma.$executeRaw`
      INSERT INTO "ComplianceAuditLog"
      (id, "studentId", "checkType", result, violations, warnings, "performedBy", timestamp, metadata, "createdAt", "updatedAt")
      VALUES
      (${entry.id}, ${entry.studentId}, ${entry.checkType}, ${entry.result}, ${entry.violations}, ${entry.warnings}, ${entry.performedBy}, ${entry.timestamp}, ${JSON.stringify(entry.metadata)}::jsonb, NOW(), NOW())
    `
  } catch (error) {
    console.error('Error logging compliance check to database:', error)
    // Continue even if database logging fails
  }

  return entry
}

/**
 * Retrieve audit log for a student
 */
export async function getAuditLog(
  studentId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLogEntry[]> {
  try {
    const results = await prisma.$queryRaw<any[]>`
      SELECT id, "studentId", "checkType", result, violations, warnings, "performedBy", timestamp, metadata
      FROM "ComplianceAuditLog"
      WHERE "studentId" = ${studentId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    return results.map((row) => ({
      id: row.id,
      studentId: row.studentId,
      checkType: row.checkType,
      result: row.result as EligibilityStatus,
      violations: row.violations,
      warnings: row.warnings,
      performedBy: row.performedBy,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata,
    }))
  } catch (error) {
    console.error('Error retrieving audit log:', error)
    return []
  }
}

/**
 * Get audit summary statistics for a student
 */
export async function getAuditSummary(studentId: string): Promise<{
  totalChecks: number
  eligibleChecks: number
  ineligibleChecks: number
  totalViolations: number
  totalWarnings: number
  lastCheckDate?: Date
  lastCheckResult?: EligibilityStatus
}> {
  try {
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*) as "totalChecks",
        SUM(CASE WHEN result = 'ELIGIBLE' THEN 1 ELSE 0 END) as "eligibleChecks",
        SUM(CASE WHEN result = 'INELIGIBLE' THEN 1 ELSE 0 END) as "ineligibleChecks",
        SUM(violations) as "totalViolations",
        SUM(warnings) as "totalWarnings",
        MAX(timestamp) as "lastCheckDate"
      FROM "ComplianceAuditLog"
      WHERE "studentId" = ${studentId}
    `

    if (results.length === 0) {
      return {
        totalChecks: 0,
        eligibleChecks: 0,
        ineligibleChecks: 0,
        totalViolations: 0,
        totalWarnings: 0,
      }
    }

    const summary = results[0]

    // Get last check result
    let lastCheckResult: EligibilityStatus | undefined
    if (summary.lastCheckDate) {
      const lastCheck = await prisma.$queryRaw<any[]>`
        SELECT result
        FROM "ComplianceAuditLog"
        WHERE "studentId" = ${studentId}
        ORDER BY timestamp DESC
        LIMIT 1
      `
      if (lastCheck.length > 0) {
        lastCheckResult = lastCheck[0].result as EligibilityStatus
      }
    }

    return {
      totalChecks: parseInt(summary.totalChecks) || 0,
      eligibleChecks: parseInt(summary.eligibleChecks) || 0,
      ineligibleChecks: parseInt(summary.ineligibleChecks) || 0,
      totalViolations: parseInt(summary.totalViolations) || 0,
      totalWarnings: parseInt(summary.totalWarnings) || 0,
      lastCheckDate: summary.lastCheckDate
        ? new Date(summary.lastCheckDate)
        : undefined,
      lastCheckResult,
    }
  } catch (error) {
    console.error('Error getting audit summary:', error)
    return {
      totalChecks: 0,
      eligibleChecks: 0,
      ineligibleChecks: 0,
      totalViolations: 0,
      totalWarnings: 0,
    }
  }
}

/**
 * Get violation history for trend analysis
 */
export async function getViolationHistory(
  studentId: string,
  ruleId?: string
): Promise<
  Array<{
    date: Date
    ruleId: string
    severity: string
    message: string
  }>
> {
  try {
    const logs = await getAuditLog(studentId, 100, 0)

    const violations: Array<{
      date: Date
      ruleId: string
      severity: string
      message: string
    }> = []

    for (const log of logs) {
      if (log.metadata?.violationDetails) {
        for (const violation of log.metadata.violationDetails) {
          if (!ruleId || violation.ruleId === ruleId) {
            violations.push({
              date: log.timestamp,
              ruleId: violation.ruleId,
              severity: violation.severity,
              message: violation.message,
            })
          }
        }
      }
    }

    return violations
  } catch (error) {
    console.error('Error getting violation history:', error)
    return []
  }
}

/**
 * Check if student has recurring violations
 */
export async function checkRecurringViolations(
  studentId: string,
  ruleId: string,
  timeWindowDays: number = 90
): Promise<{
  hasRecurringViolations: boolean
  occurrences: number
  firstOccurrence?: Date
  lastOccurrence?: Date
}> {
  const history = await getViolationHistory(studentId, ruleId)

  if (history.length === 0) {
    return { hasRecurringViolations: false, occurrences: 0 }
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays)

  const recentViolations = history.filter((v) => v.date >= cutoffDate)

  return {
    hasRecurringViolations: recentViolations.length >= 2,
    occurrences: recentViolations.length,
    firstOccurrence:
      recentViolations.length > 0
        ? recentViolations[recentViolations.length - 1].date
        : undefined,
    lastOccurrence: recentViolations.length > 0 ? recentViolations[0].date : undefined,
  }
}
