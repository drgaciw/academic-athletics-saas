/**
 * Student Data Tools
 * 
 * Tools for retrieving student information, academic records, and athletic schedules
 */

import { z } from 'zod'
import { createTool } from '../lib/tool-registry'
import type { ToolExecutionContext } from '../types/agent.types'
import { userService, monitoringService, advisingService, integrationService } from '../lib/service-client'

/**
 * Get Student Profile
 * 
 * Retrieves comprehensive student profile including personal info,
 * academic standing, and athletic information
 */
export const getStudentProfile = createTool({
  name: 'getStudentProfile',
  description: 'Retrieve comprehensive student profile including personal information, academic standing, enrollment status, and athletic team information',
  parameters: z.object({
    studentId: z.string().describe('Student ID (e.g., S12345)'),
    includeHistory: z.boolean().optional().describe('Include historical academic records'),
  }),
  category: 'student_data',
  requiredPermissions: ['read:student'],
  usageGuidance: 'Use this when you need basic student information, current enrollment status, or team affiliation',
  examples: [
    'getStudentProfile({ studentId: "S12345" })',
    'getStudentProfile({ studentId: "S12345", includeHistory: true })',
  ],
  returnFormat: 'Student object with id, name, email, major, year, GPA, team, sport, eligibilityStatus',
  execute: async (params, context) => {
    try {
      // Get user profile from User Service
      const profile = await userService.getProfile(params.studentId, context)
      
      // Get additional data if history is requested
      let academicHistory
      if (params.includeHistory) {
        try {
          const records = await monitoringService.getAcademicRecords(
            profile.studentProfile?.studentId || params.studentId,
            {},
            context
          )
          academicHistory = records
        } catch (error) {
          // Continue without history if service unavailable
          console.warn('Failed to fetch academic history:', error)
        }
      }
      
      // Format result as XML for better Claude parsing
      const studentProfile = profile.studentProfile
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Unknown'
      
      return `<student_profile>
<basic_info>
  <id>${params.studentId}</id>
  <user_id>${profile.id}</user_id>
  <name>${fullName}</name>
  <email>${profile.email}</email>
  <role>${profile.role}</role>
  <student_id>${studentProfile?.studentId || 'N/A'}</student_id>
</basic_info>
<academic_standing>
  <gpa>${studentProfile?.gpa?.toFixed(2) || 'N/A'}</gpa>
  <credits_completed>${studentProfile?.creditHours || 0}</credits_completed>
  <eligibility_status>${studentProfile?.eligibilityStatus || 'UNKNOWN'}</eligibility_status>
</academic_standing>
<athletic_info>
  <sport>${studentProfile?.sport || 'N/A'}</sport>
  <eligibility>${studentProfile?.eligibilityStatus || 'UNKNOWN'}</eligibility>
</athletic_info>
${academicHistory ? `<history>
  <note>Academic history available from monitoring service</note>
</history>` : ''}
<metadata>
  <created_at>${profile.createdAt}</created_at>
  <updated_at>${profile.updatedAt}</updated_at>
</metadata>
</student_profile>`
    } catch (error) {
      // Return error in XML format
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return `<error>
<message>Failed to retrieve student profile</message>
<details>${errorMessage}</details>
<student_id>${params.studentId}</student_id>
</error>`
    }
  },
})

/**
 * Get Academic Records
 * 
 * Retrieves detailed academic records including courses, grades, and transcripts
 */
export const getAcademicRecords = createTool({
  name: 'getAcademicRecords',
  description: 'Retrieve detailed academic records including course history, grades, GPA trends, and transcript information',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    semester: z.string().optional().describe('Specific semester (e.g., "Fall 2024")'),
    includeInProgress: z.boolean().optional().describe('Include current semester courses'),
  }),
  category: 'student_data',
  requiredPermissions: ['read:student', 'read:grades'],
  usageGuidance: 'Use this to review past academic performance, check grades, or analyze GPA trends',
  examples: [
    'getAcademicRecords({ studentId: "S12345" })',
    'getAcademicRecords({ studentId: "S12345", semester: "Fall 2024" })',
    'getAcademicRecords({ studentId: "S12345", includeInProgress: true })',
  ],
  returnFormat: 'Array of course records with code, title, credits, grade, semester, instructor',
  execute: async (params, context) => {
    try {
      // Get academic records from Monitoring Service
      const records = await monitoringService.getAcademicRecords(
        params.studentId,
        {
          semester: params.semester,
          includeInProgress: params.includeInProgress,
        },
        context
      )
      
      // Return formatted records (service should return appropriate structure)
      return records
    } catch (error) {
      // Return error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        error: true,
        message: 'Failed to retrieve academic records',
        details: errorMessage,
        studentId: params.studentId,
      }
    }
  },
})

/**
 * Get Athletic Schedule
 * 
 * Retrieves athletic schedule including practices, games, and team events
 */
export const getAthleticSchedule = createTool({
  name: 'getAthleticSchedule',
  description: 'Retrieve athletic schedule including practices, games, travel, and mandatory team events',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
    eventType: z.enum(['all', 'practice', 'game', 'travel']).optional().describe('Filter by event type'),
  }),
  category: 'student_data',
  requiredPermissions: ['read:student', 'read:athletics'],
  usageGuidance: 'Use this to check for scheduling conflicts between courses and athletic commitments',
  examples: [
    'getAthleticSchedule({ studentId: "S12345" })',
    'getAthleticSchedule({ studentId: "S12345", startDate: "2024-09-01", endDate: "2024-12-15" })',
    'getAthleticSchedule({ studentId: "S12345", eventType: "game" })',
  ],
  returnFormat: 'Array of athletic events with date, time, type, location, mandatory flag',
  execute: async (params, context) => {
    try {
      // Get athletic schedule from Integration Service
      const schedule = await integrationService.getAthleticSchedule(
        params.studentId,
        {
          startDate: params.startDate,
          endDate: params.endDate,
          eventType: params.eventType,
        },
        context
      )
      
      return schedule
    } catch (error) {
      // Return error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        error: true,
        message: 'Failed to retrieve athletic schedule',
        details: errorMessage,
        studentId: params.studentId,
      }
    }
  },
})

/**
 * Get Performance Metrics
 * 
 * Retrieves academic performance metrics and trends
 */
export const getPerformanceMetrics = createTool({
  name: 'getPerformanceMetrics',
  description: 'Retrieve academic performance metrics including attendance, assignment completion, grade trends, and risk indicators',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    timeframe: z.enum(['current', 'semester', 'year', 'all']).optional().describe('Timeframe for metrics'),
  }),
  category: 'student_data',
  requiredPermissions: ['read:student', 'read:performance'],
  usageGuidance: 'Use this to assess student performance and identify at-risk indicators',
  examples: [
    'getPerformanceMetrics({ studentId: "S12345" })',
    'getPerformanceMetrics({ studentId: "S12345", timeframe: "semester" })',
  ],
  returnFormat: 'Performance metrics object with attendance rate, completion rate, grade trends, risk score',
  execute: async (params, context) => {
    try {
      // Get performance metrics from Monitoring Service
      const metrics = await monitoringService.getPerformanceMetrics(
        params.studentId,
        params.timeframe,
        context
      )
      
      return metrics
    } catch (error) {
      // Return error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        error: true,
        message: 'Failed to retrieve performance metrics',
        details: errorMessage,
        studentId: params.studentId,
      }
    }
  },
})

/**
 * Get Degree Progress
 * 
 * Retrieves degree progress and remaining requirements
 */
export const getDegreeProgress = createTool({
  name: 'getDegreeProgress',
  description: 'Retrieve degree progress including completed requirements, remaining courses, and progress-toward-degree percentage',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    includeProjections: z.boolean().optional().describe('Include graduation date projections'),
  }),
  category: 'student_data',
  requiredPermissions: ['read:student', 'read:degree'],
  usageGuidance: 'Use this to check degree completion status and plan remaining coursework',
  examples: [
    'getDegreeProgress({ studentId: "S12345" })',
    'getDegreeProgress({ studentId: "S12345", includeProjections: true })',
  ],
  returnFormat: 'Degree progress object with completed/remaining requirements, percentage complete, projected graduation',
  execute: async (params, context) => {
    try {
      // Get degree progress from Advising Service
      const progress = await advisingService.calculateProgress(
        params.studentId,
        context
      )
      
      return progress
    } catch (error) {
      // Return error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        error: true,
        message: 'Failed to retrieve degree progress',
        details: errorMessage,
        studentId: params.studentId,
      }
    }
  },
})

/**
 * Export all student data tools
 */
export const studentDataTools = [
  getStudentProfile,
  getAcademicRecords,
  getAthleticSchedule,
  getPerformanceMetrics,
  getDegreeProgress,
]
