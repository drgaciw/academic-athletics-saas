/**
 * Service Client
 * 
 * HTTP client for making requests to backend microservices
 */

import type { ToolExecutionContext } from '../types/agent.types'

// Get environment variables with fallbacks
const getEnv = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback
  }
  return fallback
}

/**
 * Service URLs from environment variables
 */
const SERVICE_URLS = {
  user: getEnv('USER_SERVICE_URL', 'http://localhost:3001'),
  compliance: getEnv('COMPLIANCE_SERVICE_URL', 'http://localhost:3002'),
  advising: getEnv('ADVISING_SERVICE_URL', 'http://localhost:3003'),
  monitoring: getEnv('MONITORING_SERVICE_URL', 'http://localhost:3004'),
  support: getEnv('SUPPORT_SERVICE_URL', 'http://localhost:3005'),
  integration: getEnv('INTEGRATION_SERVICE_URL', 'http://localhost:3006'),
}

/**
 * Service client error
 */
export class ServiceClientError extends Error {
  constructor(
    message: string,
    public service: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ServiceClientError'
  }
}

/**
 * Make HTTP request to a service
 */
async function makeRequest<T>(
  service: keyof typeof SERVICE_URLS,
  path: string,
  options: RequestInit = {},
  context?: ToolExecutionContext
): Promise<T> {
  const baseUrl = SERVICE_URLS[service]
  const url = `${baseUrl}${path}`

  // Add authorization header if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Add user token if available in context
  if (context?.userId) {
    // In production, this would be a real JWT token
    // For now, we'll pass the userId in a custom header
    headers['X-User-Id'] = context.userId
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any
      throw new ServiceClientError(
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        service,
        response.status,
        errorData
      )
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ServiceClientError) {
      throw error
    }

    // Network or parsing error
    throw new ServiceClientError(
      error instanceof Error ? error.message : 'Unknown error',
      service,
      undefined,
      error
    )
  }
}

/**
 * User Service Client
 */
export const userService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string, context?: ToolExecutionContext) {
    return makeRequest<{
      id: string
      clerkId: string
      email: string
      role: string
      firstName: string | null
      lastName: string | null
      createdAt: string
      updatedAt: string
      studentProfile?: {
        id: string
        userId: string
        studentId: string
        sport: string | null
        gpa: number | null
        creditHours: number | null
        eligibilityStatus: string
        createdAt: string
        updatedAt: string
      }
    }>('user', `/api/user/profile/${userId}`, {}, context)
  },

  /**
   * Get user roles and permissions
   */
  async getRoles(userId: string, context?: ToolExecutionContext) {
    return makeRequest<{
      userId: string
      role: string
      permissions: string[]
      studentProfile?: {
        id: string
        studentId: string
        sport: string | null
      }
    }>('user', `/api/user/roles/${userId}`, {}, context)
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      firstName?: string
      lastName?: string
      email?: string
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('user', `/api/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, context)
  },
}

/**
 * Monitoring Service Client
 */
export const monitoringService = {
  /**
   * Get academic records for a student
   */
  async getAcademicRecords(
    studentId: string,
    options?: {
      semester?: string
      includeInProgress?: boolean
    },
    context?: ToolExecutionContext
  ) {
    const params = new URLSearchParams()
    if (options?.semester) params.append('semester', options.semester)
    if (options?.includeInProgress) params.append('includeInProgress', 'true')

    const query = params.toString() ? `?${params.toString()}` : ''
    return makeRequest('monitoring', `/api/monitoring/records/${studentId}${query}`, {}, context)
  },

  /**
   * Get performance metrics for a student
   */
  async getPerformanceMetrics(
    studentId: string,
    timeframe?: string,
    context?: ToolExecutionContext
  ) {
    const query = timeframe ? `?timeframe=${timeframe}` : ''
    return makeRequest('monitoring', `/api/monitoring/performance/${studentId}${query}`, {}, context)
  },

  /**
   * Get attendance records
   */
  async getAttendance(
    studentId: string,
    context?: ToolExecutionContext
  ) {
    return makeRequest('monitoring', `/api/monitoring/attendance/${studentId}`, {}, context)
  },
}

/**
 * Compliance Service Client
 */
export const complianceService = {
  /**
   * Check eligibility status
   */
  async checkEligibility(
    studentId: string,
    context?: ToolExecutionContext
  ) {
    return makeRequest('compliance', `/api/compliance/check/${studentId}`, {}, context)
  },

  /**
   * Search NCAA rules
   */
  async searchRules(
    query: string,
    options?: {
      category?: string
      limit?: number
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('compliance', '/api/compliance/rules/search', {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    }, context)
  },

  /**
   * Simulate eligibility scenario
   */
  async simulateScenario(
    studentId: string,
    scenario: {
      hypotheticalGPA?: number
      hypotheticalCredits?: number
      plannedCourses?: string[]
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('compliance', `/api/compliance/simulate/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(scenario),
    }, context)
  },

  /**
   * Get compliance history
   */
  async getHistory(
    studentId: string,
    context?: ToolExecutionContext
  ) {
    return makeRequest('compliance', `/api/compliance/history/${studentId}`, {}, context)
  },
}

/**
 * Advising Service Client
 */
export const advisingService = {
  /**
   * Search courses
   */
  async searchCourses(
    query: {
      term?: string
      subject?: string
      level?: string
      credits?: number
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('advising', '/api/advising/courses/search', {
      method: 'POST',
      body: JSON.stringify(query),
    }, context)
  },

  /**
   * Check scheduling conflicts
   */
  async checkConflicts(
    studentId: string,
    courseIds: string[],
    context?: ToolExecutionContext
  ) {
    return makeRequest('advising', `/api/advising/conflicts/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ courseIds }),
    }, context)
  },

  /**
   * Get degree requirements
   */
  async getDegreeRequirements(
    studentId: string,
    context?: ToolExecutionContext
  ) {
    return makeRequest('advising', `/api/advising/degree/${studentId}`, {}, context)
  },

  /**
   * Calculate degree progress
   */
  async calculateProgress(
    studentId: string,
    context?: ToolExecutionContext
  ) {
    return makeRequest('advising', `/api/advising/progress/${studentId}`, {}, context)
  },

  /**
   * Get course prerequisites
   */
  async getPrerequisites(
    courseId: string,
    context?: ToolExecutionContext
  ) {
    return makeRequest('advising', `/api/advising/courses/${courseId}/prerequisites`, {}, context)
  },

  /**
   * Get course recommendations
   */
  async getRecommendations(
    studentId: string,
    options?: {
      semester?: string
      maxCredits?: number
    },
    context?: ToolExecutionContext
  ) {
    const params = new URLSearchParams()
    if (options?.semester) params.append('semester', options.semester)
    if (options?.maxCredits) params.append('maxCredits', options.maxCredits.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return makeRequest('advising', `/api/advising/recommendations/${studentId}${query}`, {}, context)
  },
}

/**
 * Integration Service Client
 */
export const integrationService = {
  /**
   * Send email
   */
  async sendEmail(
    data: {
      to: string | string[]
      subject: string
      body: string
      cc?: string[]
      bcc?: string[]
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('integration', '/api/integration/email/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }, context)
  },

  /**
   * Generate travel letter
   */
  async generateTravelLetter(
    data: {
      studentName: string
      studentId: string
      sport: string
      travelDates: {
        start: string
        end: string
      }
      destination: string
      event: string
      courses: Array<{
        code: string
        name: string
        instructor: string
        meetingTimes?: string
      }>
      advisor?: {
        name: string
        title: string
        phone?: string
        email?: string
      }
      generatedBy?: string
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest<{
      success: boolean
      url?: string
      message?: string
    }>('integration', '/api/integration/travel-letter', {
      method: 'POST',
      body: JSON.stringify(data),
    }, context)
  },

  /**
   * Schedule event
   */
  async scheduleEvent(
    data: {
      title: string
      description?: string
      startTime: string
      endTime: string
      attendees: string[]
      location?: string
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('integration', '/api/integration/calendar/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }, context)
  },

  /**
   * Get athletic schedule
   */
  async getAthleticSchedule(
    studentId: string,
    options?: {
      startDate?: string
      endDate?: string
      eventType?: string
    },
    context?: ToolExecutionContext
  ) {
    const params = new URLSearchParams()
    if (options?.startDate) params.append('startDate', options.startDate)
    if (options?.endDate) params.append('endDate', options.endDate)
    if (options?.eventType) params.append('eventType', options.eventType)

    const query = params.toString() ? `?${params.toString()}` : ''
    return makeRequest('integration', `/api/integration/athletics/schedule/${studentId}${query}`, {}, context)
  },
}

/**
 * Support Service Client
 */
export const supportService = {
  /**
   * Create support request
   */
  async createRequest(
    data: {
      studentId: string
      type: string
      priority: string
      description: string
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('support', '/api/support/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }, context)
  },

  /**
   * Schedule tutoring session
   */
  async scheduleTutoring(
    data: {
      studentId: string
      subject: string
      date: string
      duration: number
    },
    context?: ToolExecutionContext
  ) {
    return makeRequest('support', '/api/support/tutoring/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }, context)
  },

  /**
   * Get available resources
   */
  async getResources(
    category?: string,
    context?: ToolExecutionContext
  ) {
    const query = category ? `?category=${category}` : ''
    return makeRequest('support', `/api/support/resources${query}`, {}, context)
  },
}

/**
 * Export all service clients
 */
export const serviceClients = {
  user: userService,
  monitoring: monitoringService,
  compliance: complianceService,
  advising: advisingService,
  integration: integrationService,
  support: supportService,
}

export default serviceClients
