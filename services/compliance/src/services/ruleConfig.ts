/**
 * Rule Configuration Service
 * Manages dynamic rule updates without code deployment
 */

import { prisma } from '@aah/database'
import { RuleConfiguration } from '../types'

/**
 * Get active rule configuration
 */
export async function getRuleConfig(ruleId: string): Promise<RuleConfiguration | null> {
  try {
    const config = await prisma.$queryRaw<any[]>`
      SELECT id, "ruleId", parameters, "isActive", "updatedAt", "updatedBy"
      FROM "RuleConfiguration"
      WHERE "ruleId" = ${ruleId} AND "isActive" = true
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `

    if (config.length === 0) {
      return null
    }

    return {
      id: config[0].id,
      ruleId: config[0].ruleId,
      parameters: config[0].parameters,
      isActive: config[0].isActive,
      updatedAt: new Date(config[0].updatedAt),
      updatedBy: config[0].updatedBy,
    }
  } catch (error) {
    console.error('Error retrieving rule configuration:', error)
    return null
  }
}

/**
 * Update rule configuration
 */
export async function updateRuleConfig(
  ruleId: string,
  parameters: Record<string, any>,
  updatedBy: string,
  effectiveDate?: Date
): Promise<RuleConfiguration> {
  const id = `config-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const updatedAt = effectiveDate || new Date()

  try {
    // Deactivate previous configurations
    await prisma.$executeRaw`
      UPDATE "RuleConfiguration"
      SET "isActive" = false
      WHERE "ruleId" = ${ruleId}
    `

    // Insert new configuration
    await prisma.$executeRaw`
      INSERT INTO "RuleConfiguration"
      (id, "ruleId", parameters, "isActive", "updatedAt", "updatedBy", "createdAt")
      VALUES
      (${id}, ${ruleId}, ${JSON.stringify(parameters)}::jsonb, true, ${updatedAt}, ${updatedBy}, NOW())
    `

    return {
      id,
      ruleId,
      parameters,
      isActive: true,
      updatedAt,
      updatedBy,
    }
  } catch (error) {
    console.error('Error updating rule configuration:', error)
    throw new Error('Failed to update rule configuration')
  }
}

/**
 * Get all active rule configurations
 */
export async function getAllRuleConfigs(): Promise<RuleConfiguration[]> {
  try {
    const configs = await prisma.$queryRaw<any[]>`
      SELECT id, "ruleId", parameters, "isActive", "updatedAt", "updatedBy"
      FROM "RuleConfiguration"
      WHERE "isActive" = true
      ORDER BY "updatedAt" DESC
    `

    return configs.map((config) => ({
      id: config.id,
      ruleId: config.ruleId,
      parameters: config.parameters,
      isActive: config.isActive,
      updatedAt: new Date(config.updatedAt),
      updatedBy: config.updatedBy,
    }))
  } catch (error) {
    console.error('Error retrieving all rule configurations:', error)
    return []
  }
}

/**
 * Get configuration history for a rule
 */
export async function getRuleConfigHistory(
  ruleId: string,
  limit: number = 10
): Promise<RuleConfiguration[]> {
  try {
    const configs = await prisma.$queryRaw<any[]>`
      SELECT id, "ruleId", parameters, "isActive", "updatedAt", "updatedBy"
      FROM "RuleConfiguration"
      WHERE "ruleId" = ${ruleId}
      ORDER BY "updatedAt" DESC
      LIMIT ${limit}
    `

    return configs.map((config) => ({
      id: config.id,
      ruleId: config.ruleId,
      parameters: config.parameters,
      isActive: config.isActive,
      updatedAt: new Date(config.updatedAt),
      updatedBy: config.updatedBy,
    }))
  } catch (error) {
    console.error('Error retrieving rule configuration history:', error)
    return []
  }
}

/**
 * Deactivate a rule configuration
 */
export async function deactivateRuleConfig(configId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "RuleConfiguration"
      SET "isActive" = false
      WHERE id = ${configId}
    `
  } catch (error) {
    console.error('Error deactivating rule configuration:', error)
    throw new Error('Failed to deactivate rule configuration')
  }
}

/**
 * Get parameter value from configuration with fallback to default
 */
export function getConfigParameter<T>(
  config: RuleConfiguration | null,
  parameterName: string,
  defaultValue: T
): T {
  if (!config || !config.parameters) {
    return defaultValue
  }

  const value = config.parameters[parameterName]
  return value !== undefined ? (value as T) : defaultValue
}

/**
 * Validate rule configuration parameters
 */
export function validateRuleParameters(
  ruleId: string,
  parameters: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Define expected parameters for each rule
  const ruleSchemas: Record<string, Record<string, string>> = {
    'NCAA-DI-16-CORE': {
      minimumCourses: 'number',
    },
    'NCAA-DI-CORE-GPA': {
      minimumGpa: 'number',
    },
    'NCAA-DI-GPA-THRESHOLDS': {
      year1Minimum: 'number',
      year2Minimum: 'number',
      year3Minimum: 'number',
      year4Minimum: 'number',
    },
    'NCAA-DI-24-18-RULE': {
      annualHoursRequired: 'number',
      previousYearHoursRequired: 'number',
    },
    'NCAA-DI-40-60-80-RULE': {
      year2Progress: 'number',
      year3Progress: 'number',
      year4Progress: 'number',
    },
  }

  const schema = ruleSchemas[ruleId]
  if (!schema) {
    errors.push(`Unknown rule ID: ${ruleId}`)
    return { valid: false, errors }
  }

  // Validate each expected parameter
  for (const [param, expectedType] of Object.entries(schema)) {
    if (!(param in parameters)) {
      errors.push(`Missing required parameter: ${param}`)
      continue
    }

    const value = parameters[param]
    const actualType = typeof value

    if (actualType !== expectedType) {
      errors.push(
        `Parameter ${param} has type ${actualType}, expected ${expectedType}`
      )
    }

    // Additional validation for specific parameters
    if (expectedType === 'number' && (isNaN(value) || value < 0)) {
      errors.push(`Parameter ${param} must be a non-negative number`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Default rule parameters
 */
export const DEFAULT_RULE_PARAMETERS: Record<string, Record<string, any>> = {
  'NCAA-DI-16-CORE': {
    minimumCourses: 16,
  },
  'NCAA-DI-CORE-GPA': {
    minimumGpa: 2.3,
  },
  'NCAA-DI-GPA-THRESHOLDS': {
    year1Minimum: 1.8,
    year2Minimum: 1.8,
    year3Minimum: 1.9,
    year4Minimum: 2.0,
  },
  'NCAA-DI-24-18-RULE': {
    annualHoursRequired: 24,
    previousYearHoursRequired: 18,
  },
  'NCAA-DI-40-60-80-RULE': {
    year2Progress: 40,
    year3Progress: 60,
    year4Progress: 80,
  },
  'NCAA-DI-FULL-TIME': {
    minimumHours: 12,
  },
  'NCAA-DI-6-HOUR': {
    minimumHours: 6,
  },
}
