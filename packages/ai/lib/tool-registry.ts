/**
 * Tool Registry
 * 
 * Central registry for agent tools with permission-based access control
 * Follows Claude best practices for tool definitions
 */

import { z } from 'zod'
import { tool } from 'ai'
import type { ToolDefinition, ToolCategory, ToolExecutionContext } from '../types/agent.types'
import { ToolExecutionError } from './errors'

/**
 * Tool Registry Class
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()
  private toolsByCategory: Map<ToolCategory, Set<string>> = new Map()

  /**
   * Register a tool
   */
  register(toolDef: ToolDefinition): void {
    this.tools.set(toolDef.name, toolDef)

    if (toolDef.category) {
      if (!this.toolsByCategory.has(toolDef.category)) {
        this.toolsByCategory.set(toolDef.category, new Set())
      }
      this.toolsByCategory.get(toolDef.category)!.add(toolDef.name)
    }
  }

  /**
   * Get tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  /**
   * Get all tools
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): ToolDefinition[] {
    const toolNames = this.toolsByCategory.get(category) || new Set()
    return Array.from(toolNames)
      .map((name) => this.tools.get(name))
      .filter((tool): tool is ToolDefinition => tool !== undefined)
  }

  /**
   * Get tools for user based on permissions
   */
  getToolsForUser(userRoles: string[], toolNames?: string[]): ToolDefinition[] {
    const availableTools = toolNames
      ? toolNames.map((name) => this.tools.get(name)).filter((t): t is ToolDefinition => t !== undefined)
      : this.getAll()

    return availableTools.filter((tool) => {
      if (!tool.requiredPermissions || tool.requiredPermissions.length === 0) {
        return true
      }
      return tool.requiredPermissions.some((perm) => userRoles.includes(perm))
    })
  }

  /**
   * Convert to AI SDK tool format with enhanced descriptions
   */
  toAISDKTools(toolNames: string[], context: ToolExecutionContext): Record<string, any> {
    const result: Record<string, any> = {}

    for (const name of toolNames) {
      const toolDef = this.tools.get(name)
      if (!toolDef) continue

      // Check permissions
      if (toolDef.requiredPermissions && toolDef.requiredPermissions.length > 0) {
        const hasPermission = toolDef.requiredPermissions.some((perm) =>
          context.userRoles.includes(perm)
        )
        if (!hasPermission) continue
      }

      // Create AI SDK tool with enhanced description
      result[name] = tool({
        description: this.enhanceToolDescription(toolDef),
        parameters: toolDef.parameters,
        execute: async (params) => {
          try {
            // Validate parameters
            const validated = toolDef.parameters.parse(params)

            // Check if confirmation required
            if (toolDef.requiresConfirmation && context.requestConfirmation) {
              const confirmed = await context.requestConfirmation(
                `Confirm: Execute ${toolDef.name} with parameters ${JSON.stringify(validated)}`
              )
              if (!confirmed) {
                return {
                  success: false,
                  error: 'User cancelled operation',
                }
              }
            }

            // Execute tool
            const result = await toolDef.execute(validated, context)

            // Format result for Claude
            return this.formatToolResult(toolDef.name, result, true)
          } catch (error) {
            const toolError = new ToolExecutionError(
              toolDef.name,
              params,
              error as Error
            )

            // Return structured error for Claude to understand
            return this.formatToolResult(toolDef.name, null, false, toolError.message)
          }
        },
      })
    }

    return result
  }

  /**
   * Enhance tool description for Claude
   * Claude performs better with detailed, structured descriptions
   */
  private enhanceToolDescription(toolDef: ToolDefinition): string {
    let description = toolDef.description

    // Add usage guidance
    if (toolDef.metadata?.usageGuidance) {
      description += `\n\nUsage: ${toolDef.metadata.usageGuidance}`
    }

    // Add examples
    if (toolDef.metadata?.examples) {
      description += '\n\nExamples:'
      for (const example of toolDef.metadata.examples) {
        description += `\n- ${example}`
      }
    }

    // Add constraints
    if (toolDef.requiresConfirmation) {
      description += '\n\n⚠️ This tool requires user confirmation before execution.'
    }

    // Add return format
    if (toolDef.metadata?.returnFormat) {
      description += `\n\nReturns: ${toolDef.metadata.returnFormat}`
    }

    return description
  }

  /**
   * Format tool result for Claude
   * Use XML tags for structured data
   */
  private formatToolResult(
    toolName: string,
    result: any,
    success: boolean,
    error?: string
  ): string {
    if (!success) {
      return `<tool_result tool="${toolName}" success="false">
<error>${error || 'Unknown error'}</error>
</tool_result>`
    }

    // Format successful result
    const resultStr = typeof result === 'string' 
      ? result 
      : JSON.stringify(result, null, 2)

    return `<tool_result tool="${toolName}" success="true">
<data>
${resultStr}
</data>
</tool_result>`
  }
}

/**
 * Global tool registry instance
 */
export const globalToolRegistry = new ToolRegistry()

/**
 * Helper to create tool definition with best practices
 */
export function createTool<T extends z.ZodType>(config: {
  name: string
  description: string
  parameters: T
  execute: (params: z.infer<T>, context?: ToolExecutionContext) => Promise<any>
  category?: ToolCategory
  requiredPermissions?: string[]
  requiresConfirmation?: boolean
  usageGuidance?: string
  examples?: string[]
  returnFormat?: string
}): ToolDefinition {
  return {
    id: `tool-${config.name}`,
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    execute: config.execute,
    category: config.category,
    requiredPermissions: config.requiredPermissions,
    requiresConfirmation: config.requiresConfirmation,
    metadata: {
      usageGuidance: config.usageGuidance,
      examples: config.examples,
      returnFormat: config.returnFormat,
    },
  }
}
