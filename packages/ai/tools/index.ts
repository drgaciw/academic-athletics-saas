/**
 * Tool Definitions Index
 * 
 * Central export and registration point for all agent tools
 */

import { globalToolRegistry } from '../lib/tool-registry'

// Import all tool categories
import { studentDataTools } from './student-data-tools'
import { complianceTools } from './compliance-tools'
import { advisingTools } from './advising-tools'
import { administrativeTools } from './administrative-tools'
import { errorDiagnosticsTools } from './error-diagnostics-tools'

/**
 * All available tools organized by category
 */
export const allTools = {
  studentData: studentDataTools,
  compliance: complianceTools,
  advising: advisingTools,
  administrative: administrativeTools,
  errorDiagnostics: errorDiagnosticsTools,
}

/**
 * Flat array of all tools
 */
export const allToolsFlat = [
  ...studentDataTools,
  ...complianceTools,
  ...advisingTools,
  ...administrativeTools,
  ...errorDiagnosticsTools,
]

/**
 * Register all tools with the global registry
 */
export function registerAllTools() {
  for (const tool of allToolsFlat) {
    globalToolRegistry.register(tool)
  }
  
  console.log(`Registered ${allToolsFlat.length} tools across ${Object.keys(allTools).length} categories`)
}

/**
 * Get tools by agent type
 */
export function getToolsForAgentType(agentType: string): string[] {
  const toolMappings: Record<string, string[]> = {
    advising: [
      // Student data
      'getStudentProfile',
      'getAcademicRecords',
      'getDegreeProgress',
      // Advising
      'searchCourses',
      'checkConflicts',
      'getDegreeRequirements',
      'calculateProgress',
      'recommendCourses',
      'getPrerequisites',
      // Compliance (read-only)
      'checkEligibility',
      // Administrative
      'logInteraction',
    ],
    compliance: [
      // Student data
      'getStudentProfile',
      'getAcademicRecords',
      'getDegreeProgress',
      // Compliance
      'checkEligibility',
      'searchNCAARules',
      'simulateScenario',
      'getComplianceHistory',
      'calculateProgressTowardDegree',
      // Administrative
      'generateReport',
      'logInteraction',
    ],
    intervention: [
      // Student data
      'getStudentProfile',
      'getAcademicRecords',
      'getPerformanceMetrics',
      'getDegreeProgress',
      // Compliance
      'checkEligibility',
      // Advising
      'recommendCourses',
      // Administrative
      'sendEmail',
      'scheduleEvent',
      'createReminder',
      'logInteraction',
    ],
    administrative: [
      // Student data
      'getStudentProfile',
      'getAcademicRecords',
      'getAthleticSchedule',
      // Administrative
      'sendEmail',
      'generateTravelLetter',
      'scheduleEvent',
      'generateReport',
      'createReminder',
      'logInteraction',
    ],
    general: [
      // Student data (read-only)
      'getStudentProfile',
      'getAcademicRecords',
      'getAthleticSchedule',
      'getDegreeProgress',
      // Compliance (read-only)
      'checkEligibility',
      'searchNCAARules',
      // Advising (read-only)
      'searchCourses',
      'getDegreeRequirements',
      'getPrerequisites',
    ],
    error_diagnostics: [
      // Error diagnostics tools
      'analyzeError',
      'detectErrorPatterns',
      'getErrorHistory',
      'checkFERPACompliance',
      'assessNCAAComplianceImpact',
      'generateFixRecommendation',
      // Student data (for context)
      'getStudentProfile',
      // Administrative (for logging)
      'logInteraction',
      'generateReport',
    ],
  }

  return toolMappings[agentType] || []
}

/**
 * Permission mappings for roles
 */
export const rolePermissions: Record<string, string[]> = {
  // Student-athletes
  student: [
    'read:student', // Own data only
    'read:courses',
    'read:athletics',
  ],
  
  // Academic support staff
  advisor: [
    'read:student',
    'read:courses',
    'read:athletics',
    'read:grades',
    'read:performance',
    'read:degree',
    'write:interactions',
  ],
  
  // Compliance officers
  compliance_officer: [
    'read:student',
    'read:courses',
    'read:athletics',
    'read:grades',
    'read:compliance',
    'read:performance',
    'read:degree',
    'write:reports',
    'write:interactions',
  ],
  
  // Coaches
  coach: [
    'read:student', // Team members only
    'read:athletics',
    'read:grades',
    'read:performance',
    'read:compliance',
  ],
  
  // Faculty
  faculty: [
    'read:student', // Enrolled students only
    'read:courses',
  ],
  
  // Administrators
  admin: [
    'read:student',
    'read:courses',
    'read:athletics',
    'read:grades',
    'read:compliance',
    'read:performance',
    'read:degree',
    'write:email',
    'write:documents',
    'write:calendar',
    'write:reports',
    'write:notifications',
    'write:interactions',
  ],
}

/**
 * Get user permissions based on roles
 */
export function getUserPermissions(userRoles: string[]): string[] {
  const permissions = new Set<string>()
  
  for (const role of userRoles) {
    const rolePerms = rolePermissions[role] || []
    rolePerms.forEach((perm) => permissions.add(perm))
  }
  
  return Array.from(permissions)
}

// Export individual tool categories
export * from './student-data-tools'
export * from './compliance-tools'
export * from './advising-tools'
export * from './administrative-tools'
export * from './error-diagnostics-tools'

// Auto-register tools on import
registerAllTools()
