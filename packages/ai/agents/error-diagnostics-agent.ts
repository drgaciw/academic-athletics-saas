/**
 * Error Diagnostics Agent
 * 
 * Specialized agent for analyzing error patterns, providing diagnostics,
 * and suggesting fixes across the Athletic Academics Hub platform
 * 
 * Features:
 * - Error pattern analysis across microservices
 * - Root cause identification
 * - Fix recommendations with code examples
 * - Integration with existing observability (Langfuse)
 * - FERPA-compliant error logging (PII filtering)
 * - NCAA compliance tracking for error impacts
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { getToolsForAgentType } from '../tools'
import { ERROR_DIAGNOSTICS_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

/**
 * Error Diagnostics Agent Configuration
 */
const ERROR_DIAGNOSTICS_AGENT_CONFIG: AgentConfig = {
  type: 'general', // Using general type, could extend AgentType enum
  name: 'Error Diagnostics Agent',
  description: 'Analyzes error patterns, provides diagnostics, and suggests fixes for platform issues',
  systemPrompt: ERROR_DIAGNOSTICS_AGENT_PROMPT,
  tools: getToolsForAgentType('error_diagnostics'),
  model: {
    provider: 'openai',
    name: 'gpt-5.1-codex-max',
    temperature: 0.3, // Lower temperature for precise technical analysis
    maxTokens: 8192, // Higher token limit for detailed diagnostics
  },
  maxSteps: 15, // More steps for complex error analysis
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 100, // Higher limit for error handling
    tokensPerDay: 2000000,
  },
}

/**
 * Error Diagnostics Agent Class
 * 
 * Handles error analysis including:
 * - Error pattern detection across services
 * - Root cause analysis
 * - Fix recommendations with code examples
 * - Impact assessment (NCAA compliance, FERPA)
 * - Historical error tracking
 * - Preventive suggestions
 */
export class ErrorDiagnosticsAgent extends BaseAgent {
  constructor() {
    super(ERROR_DIAGNOSTICS_AGENT_CONFIG)
  }

  /**
   * Get system prompt for error diagnostics agent
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  /**
   * Get tools for error diagnostics agent
   */
  protected getTools(): Record<string, CoreTool> {
    const context: ToolExecutionContext = {
      userId: '',
      userRoles: this.getUserRoles(),
      agentState: {} as any,
      requestConfirmation: this.requestConfirmation.bind(this),
    }

    return globalToolRegistry.toAISDKTools(this.config.tools, context)
  }

  /**
   * Get user roles
   */
  protected getUserRoles(): string[] {
    // Error diagnostics agent has elevated permissions for system analysis
    return ['admin', 'developer', 'support']
  }

  /**
   * Request user confirmation
   */
  protected async requestConfirmation(message: string): Promise<boolean> {
    console.log(`Confirmation requested: ${message}`)
    return true
  }

  /**
   * Override execute to set context
   */
  async execute(request: AgentRequest) {
    return super.execute(request)
  }

  /**
   * Error diagnostics-specific workflow helpers
   */

  /**
   * Analyze error from logs or exception
   */
  async analyzeError(params: {
    error: Error | string
    context?: {
      service?: string
      userId?: string
      correlationId?: string
      stackTrace?: string
      metadata?: Record<string, any>
    }
  }) {
    const errorMessage = typeof params.error === 'string' 
      ? params.error 
      : params.error.message

    const stackTrace = typeof params.error === 'string'
      ? params.context?.stackTrace
      : params.error.stack

    const request: AgentRequest = {
      userId: params.context?.userId || 'system',
      agentType: 'general',
      message: `Analyze this error and provide diagnostics:

Error: ${errorMessage}

${stackTrace ? `Stack Trace:\n${stackTrace}` : ''}

${params.context?.service ? `Service: ${params.context.service}` : ''}
${params.context?.correlationId ? `Correlation ID: ${params.context.correlationId}` : ''}

Please provide:
1. Root cause analysis
2. Impact assessment (including NCAA compliance and FERPA implications)
3. Recommended fixes with code examples
4. Preventive measures`,
      context: {
        errorType: 'analysis',
        error: errorMessage,
        stackTrace,
        ...params.context,
      },
    }

    return this.execute(request)
  }

  /**
   * Detect error patterns across services
   */
  async detectPatterns(params: {
    timeRange?: {
      start: Date
      end: Date
    }
    services?: string[]
    errorTypes?: string[]
    minOccurrences?: number
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `Analyze error patterns across services:

Time Range: ${params.timeRange ? `${params.timeRange.start.toISOString()} to ${params.timeRange.end.toISOString()}` : 'Last 24 hours'}
Services: ${params.services?.join(', ') || 'All'}
Error Types: ${params.errorTypes?.join(', ') || 'All'}
Minimum Occurrences: ${params.minOccurrences || 5}

Please identify:
1. Recurring error patterns
2. Common root causes
3. Services most affected
4. Correlation between errors
5. Recommended systemic fixes`,
      context: {
        errorType: 'pattern_detection',
        ...params,
      },
    }

    return this.execute(request)
  }

  /**
   * Suggest fix for specific error
   */
  async suggestFix(params: {
    errorCode: string
    errorMessage: string
    service: string
    context?: Record<string, any>
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `Suggest a fix for this error:

Service: ${params.service}
Error Code: ${params.errorCode}
Error Message: ${params.errorMessage}

${params.context ? `Context:\n${JSON.stringify(params.context, null, 2)}` : ''}

Please provide:
1. Step-by-step fix instructions
2. Code examples (TypeScript/Next.js)
3. Testing recommendations
4. Deployment considerations
5. Monitoring to verify fix`,
      context: {
        errorType: 'fix_suggestion',
        ...params,
      },
    }

    return this.execute(request)
  }

  /**
   * Assess error impact on NCAA compliance
   */
  async assessComplianceImpact(params: {
    error: Error | string
    affectedStudents?: string[]
    service: string
  }) {
    const errorMessage = typeof params.error === 'string' 
      ? params.error 
      : params.error.message

    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `Assess NCAA compliance impact of this error:

Service: ${params.service}
Error: ${errorMessage}
Affected Students: ${params.affectedStudents?.length || 'Unknown'}

Please analyze:
1. Impact on eligibility tracking
2. Risk to compliance reporting
3. Data integrity concerns
4. Required corrective actions
5. NCAA notification requirements`,
      context: {
        errorType: 'compliance_impact',
        errorMessage,
        ...params,
      },
    }

    return this.execute(request)
  }

  /**
   * Generate error report for stakeholders
   */
  async generateErrorReport(params: {
    timeRange: {
      start: Date
      end: Date
    }
    services?: string[]
    severity?: 'critical' | 'high' | 'medium' | 'low'
    includeResolutions?: boolean
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `Generate error report for stakeholders:

Time Range: ${params.timeRange.start.toISOString()} to ${params.timeRange.end.toISOString()}
Services: ${params.services?.join(', ') || 'All'}
Severity: ${params.severity || 'All levels'}
Include Resolutions: ${params.includeResolutions ? 'Yes' : 'No'}

Please provide:
1. Executive summary
2. Error statistics by service
3. Top issues and their impact
4. Resolution status
5. Recommendations for improvement`,
      context: {
        errorType: 'report_generation',
        ...params,
      },
    }

    return this.execute(request)
  }

  /**
   * Validate FERPA compliance of error logs
   */
  async validateFERPACompliance(params: {
    errorLogs: Array<{
      message: string
      metadata?: Record<string, any>
    }>
    service: string
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `Validate FERPA compliance of error logs:

Service: ${params.service}
Log Count: ${params.errorLogs.length}

Please check for:
1. PII exposure in error messages
2. Student data in stack traces
3. Sensitive information in metadata
4. Compliance violations
5. Recommended sanitization`,
      context: {
        errorType: 'ferpa_validation',
        errorLogs: params.errorLogs,
        service: params.service,
      },
    }

    return this.execute(request)
  }

  /**
   * Predict potential errors based on code changes
   */
  async predictErrors(params: {
    service: string
    changes: {
      files: string[]
      description: string
    }
    deploymentTarget: 'development' | 'staging' | 'production'
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `Predict potential errors from code changes:

Service: ${params.service}
Deployment Target: ${params.deploymentTarget}
Files Changed: ${params.changes.files.join(', ')}
Description: ${params.changes.description}

Please analyze:
1. Potential breaking changes
2. Integration risks
3. Performance implications
4. Security concerns
5. Recommended testing strategy`,
      context: {
        errorType: 'error_prediction',
        ...params,
      },
    }

    return this.execute(request)
  }
}

/**
 * Create error diagnostics agent instance
 */
export function createErrorDiagnosticsAgent(): ErrorDiagnosticsAgent {
  return new ErrorDiagnosticsAgent()
}

/**
 * Execute error diagnostics workflow
 */
export async function executeErrorDiagnosticsWorkflow(request: AgentRequest) {
  const agent = createErrorDiagnosticsAgent()
  return agent.execute(request)
}

/**
 * Quick error analysis helper
 */
export async function quickErrorAnalysis(error: Error, context?: {
  service?: string
  userId?: string
  correlationId?: string
}) {
  const agent = createErrorDiagnosticsAgent()
  return agent.analyzeError({ error, context })
}
