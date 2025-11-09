/**
 * Advising Tools
 * 
 * Tools for course search, conflict detection, degree planning, and academic advising
 */

import { z } from 'zod'
import { createTool } from '../lib/tool-registry'
import type { ToolExecutionContext } from '../types/agent.types'

/**
 * Search Courses
 * 
 * Searches course catalog with filters
 */
export const searchCourses = createTool({
  name: 'searchCourses',
  description: 'Search course catalog for available courses. Supports filtering by semester, department, level, and keywords. Returns course details including schedule, seats, and prerequisites.',
  parameters: z.object({
    query: z.string().optional().describe('Search query (course code, title, or keywords)'),
    semester: z.string().describe('Semester (e.g., "Fall 2024", "Spring 2025")'),
    department: z.string().optional().describe('Department code (e.g., "MATH", "BUS")'),
    level: z.enum(['100', '200', '300', '400', 'graduate']).optional().describe('Course level'),
    onlineOnly: z.boolean().optional().describe('Filter for online courses only'),
    openSeatsOnly: z.boolean().optional().describe('Filter for courses with open seats'),
  }),
  category: 'advising',
  requiredPermissions: ['read:courses'],
  usageGuidance: 'Use this to find courses for student registration, check availability, or explore course options',
  examples: [
    'searchCourses({ query: "calculus", semester: "Fall 2024" })',
    'searchCourses({ semester: "Spring 2025", department: "BUS", level: "300" })',
    'searchCourses({ semester: "Fall 2024", openSeatsOnly: true })',
  ],
  returnFormat: 'Array of courses with code, title, credits, schedule, instructor, seats, prerequisites',
  execute: async (params, context) => {
    // TODO: Integrate with Course Catalog API
    return {
      query: params.query,
      semester: params.semester,
      totalResults: 2,
      courses: [
        {
          code: 'MATH 201',
          title: 'Calculus I',
          credits: 4,
          department: 'Mathematics',
          level: '200',
          description: 'Introduction to differential and integral calculus',
          sections: [
            {
              sectionNumber: '001',
              instructor: 'Dr. Williams',
              schedule: {
                days: ['Monday', 'Wednesday', 'Friday'],
                startTime: '09:00',
                endTime: '09:50',
                location: 'Math Building 101',
              },
              seats: {
                capacity: 30,
                enrolled: 25,
                available: 5,
              },
              format: 'In-person',
            },
            {
              sectionNumber: '002',
              instructor: 'Prof. Johnson',
              schedule: {
                days: ['Tuesday', 'Thursday'],
                startTime: '14:00',
                endTime: '15:15',
                location: 'Math Building 205',
              },
              seats: {
                capacity: 30,
                enrolled: 30,
                available: 0,
                waitlist: 3,
              },
              format: 'In-person',
            },
          ],
          prerequisites: ['MATH 101 or placement test'],
          corequisites: [],
        },
        {
          code: 'MATH 202',
          title: 'Calculus II',
          credits: 4,
          department: 'Mathematics',
          level: '200',
          description: 'Continuation of Calculus I',
          sections: [
            {
              sectionNumber: '001',
              instructor: 'Dr. Smith',
              schedule: {
                days: ['Monday', 'Wednesday', 'Friday'],
                startTime: '11:00',
                endTime: '11:50',
                location: 'Math Building 101',
              },
              seats: {
                capacity: 25,
                enrolled: 20,
                available: 5,
              },
              format: 'In-person',
            },
          ],
          prerequisites: ['MATH 201'],
          corequisites: [],
        },
      ],
    }
  },
})

/**
 * Check Conflicts
 * 
 * Checks for scheduling conflicts between courses and athletic events
 */
export const checkConflicts = createTool({
  name: 'checkConflicts',
  description: 'Check for scheduling conflicts between proposed courses and athletic commitments. Identifies time overlaps and mandatory event conflicts.',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    courseCodes: z.array(z.string()).describe('Array of course codes to check (e.g., ["MATH 201", "BUS 301"])'),
    semester: z.string().describe('Semester (e.g., "Fall 2024")'),
    includeAthleticSchedule: z.boolean().optional().describe('Check against athletic schedule'),
  }),
  category: 'advising',
  requiredPermissions: ['read:student', 'read:courses', 'read:athletics'],
  usageGuidance: 'Use this before recommending courses to ensure no scheduling conflicts with classes or athletics',
  examples: [
    'checkConflicts({ studentId: "S12345", courseCodes: ["MATH 201", "BUS 301"], semester: "Fall 2024" })',
    'checkConflicts({ studentId: "S12345", courseCodes: ["MATH 201"], semester: "Fall 2024", includeAthleticSchedule: true })',
  ],
  returnFormat: 'Conflict report with hasConflicts flag, list of conflicts, and alternative suggestions',
  execute: async (params, context) => {
    // TODO: Integrate with Advising Service API
    return {
      studentId: params.studentId,
      semester: params.semester,
      coursesChecked: params.courseCodes,
      hasConflicts: true,
      conflicts: [
        {
          type: 'course_overlap',
          course1: 'MATH 201',
          course2: 'BUS 301',
          description: 'Both courses meet MWF 9:00-9:50 AM',
          severity: 'high',
        },
        params.includeAthleticSchedule ? {
          type: 'athletic_conflict',
          course: 'MATH 201',
          event: 'Team Practice',
          description: 'Course meets during mandatory practice time (2:00-5:00 PM)',
          severity: 'high',
          eventDate: '2024-11-15',
        } : null,
      ].filter(Boolean),
      alternatives: [
        {
          course: 'MATH 201',
          alternativeSection: '002',
          schedule: 'TTh 2:00-3:15 PM',
          reason: 'Avoids conflict with BUS 301',
          available: false,
          waitlist: true,
        },
        {
          course: 'MATH 201',
          alternativeSection: '003',
          schedule: 'Online asynchronous',
          reason: 'No time conflicts',
          available: true,
        },
      ],
      recommendations: [
        'Consider MATH 201 section 003 (online) to avoid all conflicts',
        'Alternatively, choose a different time for BUS 301',
      ],
    }
  },
})

/**
 * Get Degree Requirements
 * 
 * Retrieves degree requirements for a specific major
 */
export const getDegreeRequirements = createTool({
  name: 'getDegreeRequirements',
  description: 'Retrieve comprehensive degree requirements for a specific major including core courses, electives, and prerequisites',
  parameters: z.object({
    major: z.string().describe('Major name (e.g., "Business Administration")'),
    catalogYear: z.string().optional().describe('Catalog year (e.g., "2023-2024")'),
    includePrerequisites: z.boolean().optional().describe('Include prerequisite chains'),
  }),
  category: 'advising',
  requiredPermissions: ['read:courses'],
  usageGuidance: 'Use this to understand what courses are required for degree completion',
  examples: [
    'getDegreeRequirements({ major: "Business Administration" })',
    'getDegreeRequirements({ major: "Computer Science", catalogYear: "2023-2024", includePrerequisites: true })',
  ],
  returnFormat: 'Degree requirements object with core courses, major requirements, electives, and total credits',
  execute: async (params, context) => {
    // TODO: Integrate with Advising Service API
    return {
      major: params.major,
      degreeType: 'Bachelor of Science',
      catalogYear: params.catalogYear || '2024-2025',
      totalCredits: 120,
      requirements: {
        generalEducation: {
          credits: 36,
          categories: [
            {
              name: 'Written Communication',
              credits: 6,
              courses: ['ENG 101', 'ENG 102'],
            },
            {
              name: 'Mathematics',
              credits: 6,
              courses: ['MATH 101', 'MATH 201'],
            },
            {
              name: 'Natural Sciences',
              credits: 8,
              courses: ['BIO 101', 'CHEM 101'],
            },
          ],
        },
        majorRequirements: {
          credits: 48,
          coreCourses: [
            { code: 'BUS 101', title: 'Introduction to Business', credits: 3 },
            { code: 'BUS 201', title: 'Business Statistics', credits: 3 },
            { code: 'BUS 301', title: 'Business Strategy', credits: 3 },
            { code: 'BUS 401', title: 'Advanced Strategy', credits: 3 },
          ],
          concentrationCourses: [
            { code: 'BUS 310', title: 'Marketing', credits: 3 },
            { code: 'BUS 320', title: 'Finance', credits: 3 },
          ],
        },
        electives: {
          credits: 36,
          restrictions: 'Any 300+ level courses',
        },
      },
      prerequisites: params.includePrerequisites ? {
        'BUS 301': ['BUS 101', 'BUS 201'],
        'BUS 401': ['BUS 301'],
      } : undefined,
    }
  },
})

/**
 * Calculate Progress
 * 
 * Calculates degree completion progress
 */
export const calculateProgress = createTool({
  name: 'calculateProgress',
  description: 'Calculate degree completion progress showing completed requirements, remaining courses, and estimated graduation date',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    includeProjections: z.boolean().optional().describe('Include graduation date projections'),
  }),
  category: 'advising',
  requiredPermissions: ['read:student', 'read:courses'],
  usageGuidance: 'Use this to assess how close a student is to graduation and plan remaining semesters',
  examples: [
    'calculateProgress({ studentId: "S12345" })',
    'calculateProgress({ studentId: "S12345", includeProjections: true })',
  ],
  returnFormat: 'Progress report with completed/remaining requirements, percentage complete, and projections',
  execute: async (params, context) => {
    // TODO: Integrate with Advising Service API
    return {
      studentId: params.studentId,
      major: 'Business Administration',
      progress: {
        totalCredits: {
          required: 120,
          completed: 75,
          remaining: 45,
          percentComplete: 62.5,
        },
        generalEducation: {
          required: 36,
          completed: 36,
          remaining: 0,
          percentComplete: 100,
        },
        majorRequirements: {
          required: 48,
          completed: 24,
          remaining: 24,
          percentComplete: 50,
        },
        electives: {
          required: 36,
          completed: 15,
          remaining: 21,
          percentComplete: 41.7,
        },
      },
      remainingCourses: [
        { code: 'BUS 301', title: 'Business Strategy', credits: 3, category: 'Major Core' },
        { code: 'BUS 401', title: 'Advanced Strategy', credits: 3, category: 'Major Core' },
      ],
      projections: params.includeProjections ? {
        estimatedGraduation: 'Spring 2026',
        semestersRemaining: 3,
        creditsPerSemester: 15,
        onTrack: true,
      } : undefined,
    }
  },
})

/**
 * Recommend Courses
 * 
 * Recommends courses based on degree requirements and student preferences
 */
export const recommendCourses = createTool({
  name: 'recommendCourses',
  description: 'Recommend courses for upcoming semester based on degree requirements, prerequisites, schedule preferences, and athletic commitments',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    semester: z.string().describe('Target semester (e.g., "Fall 2024")'),
    targetCredits: z.number().optional().describe('Target credit hours (default: 15)'),
    preferences: z.object({
      avoidMornings: z.boolean().optional(),
      avoidAfternoons: z.boolean().optional(),
      onlinePreferred: z.boolean().optional(),
    }).optional().describe('Schedule preferences'),
  }),
  category: 'advising',
  requiredPermissions: ['read:student', 'read:courses', 'read:athletics'],
  usageGuidance: 'Use this to generate personalized course recommendations for registration',
  examples: [
    'recommendCourses({ studentId: "S12345", semester: "Fall 2024" })',
    'recommendCourses({ studentId: "S12345", semester: "Spring 2025", targetCredits: 12, preferences: { avoidAfternoons: true } })',
  ],
  returnFormat: 'Course recommendations with reasoning, alternatives, and conflict warnings',
  execute: async (params, context) => {
    // TODO: Integrate with Advising Service API
    return {
      studentId: params.studentId,
      semester: params.semester,
      targetCredits: params.targetCredits || 15,
      recommendations: [
        {
          course: {
            code: 'BUS 301',
            title: 'Business Strategy',
            credits: 3,
            section: '001',
            schedule: 'MWF 9:00-9:50 AM',
          },
          priority: 'high',
          reasoning: [
            'Required for major',
            'Prerequisite for BUS 401',
            'Only offered in Fall semester',
          ],
          alternatives: [],
          conflicts: [],
        },
        {
          course: {
            code: 'MATH 201',
            title: 'Calculus I',
            credits: 4,
            section: '003',
            schedule: 'Online asynchronous',
          },
          priority: 'medium',
          reasoning: [
            'Required for degree',
            'Online format avoids athletic conflicts',
          ],
          alternatives: [
            {
              section: '001',
              schedule: 'MWF 9:00-9:50 AM',
              note: 'Conflicts with BUS 301',
            },
          ],
          conflicts: [],
        },
      ],
      totalCredits: 15,
      warnings: [],
      notes: [
        'Schedule avoids afternoon athletic commitments',
        'All courses have open seats',
      ],
    }
  },
})

/**
 * Get Prerequisites
 * 
 * Gets prerequisite information for a course
 */
export const getPrerequisites = createTool({
  name: 'getPrerequisites',
  description: 'Get detailed prerequisite information for a course including required courses, test scores, or placement requirements',
  parameters: z.object({
    courseCode: z.string().describe('Course code (e.g., "MATH 201")'),
    checkStudentEligibility: z.string().optional().describe('Student ID to check if they meet prerequisites'),
  }),
  category: 'advising',
  requiredPermissions: ['read:courses'],
  usageGuidance: 'Use this to verify if a student can enroll in a course',
  examples: [
    'getPrerequisites({ courseCode: "MATH 201" })',
    'getPrerequisites({ courseCode: "BUS 401", checkStudentEligibility: "S12345" })',
  ],
  returnFormat: 'Prerequisites object with required courses, alternatives, and eligibility check',
  execute: async (params, context) => {
    // TODO: Integrate with Course Catalog API
    return {
      courseCode: params.courseCode,
      prerequisites: {
        required: ['MATH 101'],
        alternatives: [
          'Placement test score of 75 or higher',
          'AP Calculus AB score of 4 or higher',
        ],
        corequisites: [],
      },
      eligibility: params.checkStudentEligibility ? {
        studentId: params.checkStudentEligibility,
        eligible: true,
        completedPrerequisites: ['MATH 101'],
        missingPrerequisites: [],
      } : undefined,
    }
  },
})

/**
 * Export all advising tools
 */
export const advisingTools = [
  searchCourses,
  checkConflicts,
  getDegreeRequirements,
  calculateProgress,
  recommendCourses,
  getPrerequisites,
]
