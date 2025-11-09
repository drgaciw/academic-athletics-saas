/**
 * NCAA Rule Engine
 * Core engine for executing compliance rules
 */

import {
  EligibilityRule,
  StudentData,
  ValidationResult,
  NCAADivision,
  EligibilityStatus,
} from '../types'

export class RuleEngine {
  private rules: Map<string, EligibilityRule> = new Map()
  private division: NCAADivision

  constructor(division: NCAADivision = NCAADivision.DI) {
    this.division = division
  }

  /**
   * Register a new rule
   */
  registerRule(rule: EligibilityRule): void {
    if (rule.division !== this.division) {
      throw new Error(
        `Rule ${rule.id} is for ${rule.division}, but engine is configured for ${this.division}`
      )
    }

    if (!rule.isActive) {
      console.warn(`Rule ${rule.id} is inactive and will not be executed`)
    }

    this.rules.set(rule.id, rule)
  }

  /**
   * Unregister a rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId)
  }

  /**
   * Get all registered rules
   */
  getRules(): EligibilityRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get active rules only
   */
  getActiveRules(): EligibilityRule[] {
    return this.getRules().filter((rule) => rule.isActive)
  }

  /**
   * Execute all active rules against student data
   */
  async executeRules(student: StudentData): Promise<ValidationResult> {
    const activeRules = this.getActiveRules()

    if (activeRules.length === 0) {
      throw new Error('No active rules registered')
    }

    const results: ValidationResult[] = []

    // Execute each rule
    for (const rule of activeRules) {
      try {
        const result = await Promise.resolve(rule.validate(student))
        results.push(result)
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error)
        // Continue with other rules
      }
    }

    // Combine results
    return this.combineResults(results)
  }

  /**
   * Execute specific rules by category
   */
  async executeRulesByCategory(
    student: StudentData,
    category: string
  ): Promise<ValidationResult> {
    const categoryRules = this.getActiveRules().filter(
      (rule) => rule.category === category
    )

    if (categoryRules.length === 0) {
      throw new Error(`No active rules found for category: ${category}`)
    }

    const results: ValidationResult[] = []

    for (const rule of categoryRules) {
      try {
        const result = await Promise.resolve(rule.validate(student))
        results.push(result)
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error)
      }
    }

    return this.combineResults(results)
  }

  /**
   * Execute a single rule by ID
   */
  async executeRule(student: StudentData, ruleId: string): Promise<ValidationResult> {
    const rule = this.rules.get(ruleId)

    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`)
    }

    if (!rule.isActive) {
      throw new Error(`Rule ${ruleId} is not active`)
    }

    return await Promise.resolve(rule.validate(student))
  }

  /**
   * Combine multiple validation results into a single result
   */
  private combineResults(results: ValidationResult[]): ValidationResult {
    if (results.length === 0) {
      return {
        isEligible: false,
        status: EligibilityStatus.PENDING,
        violations: [],
        warnings: [],
        recommendations: [],
      }
    }

    // Aggregate violations, warnings, and recommendations
    const allViolations = results.flatMap((r) => r.violations)
    const allWarnings = results.flatMap((r) => r.warnings)
    const allRecommendations = Array.from(
      new Set(results.flatMap((r) => r.recommendations))
    )

    // A student is eligible only if all rules pass
    const isEligible = results.every((r) => r.isEligible)

    // Determine overall status
    let status: EligibilityStatus
    if (isEligible) {
      status = EligibilityStatus.ELIGIBLE
    } else if (allViolations.some((v) => v.severity === 'CRITICAL')) {
      status = EligibilityStatus.INELIGIBLE
    } else {
      status = EligibilityStatus.CONDITIONAL
    }

    // Find earliest next review date
    const nextReviewDates = results
      .map((r) => r.nextReviewDate)
      .filter((d): d is Date => d !== undefined)
    const nextReviewDate =
      nextReviewDates.length > 0
        ? new Date(Math.min(...nextReviewDates.map((d) => d.getTime())))
        : undefined

    // Combine metadata
    const metadata = results.reduce((acc, r) => {
      return { ...acc, ...r.metadata }
    }, {})

    return {
      isEligible,
      status,
      violations: allViolations,
      warnings: allWarnings,
      recommendations: allRecommendations,
      nextReviewDate,
      metadata,
    }
  }

  /**
   * Get rule version information
   */
  getRuleVersion(): string {
    const versions = this.getActiveRules().map((r) => r.version)
    return versions.length > 0 ? versions[0] : 'unknown'
  }

  /**
   * Get applied rule IDs
   */
  getAppliedRuleIds(): string[] {
    return this.getActiveRules().map((r) => r.id)
  }
}
