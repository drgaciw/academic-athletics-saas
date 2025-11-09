/**
 * Agentic Workflow Patterns
 * 
 * Implements agentic patterns from Claude Cookbooks:
 * - Planning → Execution → Reflection
 * - Self-correction and retry logic
 * - Multi-step reasoning with checkpoints
 */

import { generateText, streamText } from 'ai'
import type { AgentState, AgentStep, ToolDefinition } from '../types/agent.types'
import { extractThinking } from './prompt-templates'

/**
 * Workflow phases
 */
export type WorkflowPhase = 'planning' | 'execution' | 'reflection' | 'completed'

/**
 * Workflow state with checkpoints
 */
export interface WorkflowState extends AgentState {
  phase: WorkflowPhase
  plan?: WorkflowPlan
  checkpoints: WorkflowCheckpoint[]
  reflections: string[]
}

/**
 * Workflow plan
 */
export interface WorkflowPlan {
  goal: string
  steps: PlannedStep[]
  estimatedDuration: number
  requiredTools: string[]
}

/**
 * Planned step
 */
export interface PlannedStep {
  stepNumber: number
  description: string
  toolsNeeded: string[]
  expectedOutcome: string
  dependencies: number[] // Step numbers this depends on
}

/**
 * Workflow checkpoint for rollback
 */
export interface WorkflowCheckpoint {
  stepNumber: number
  state: Partial<AgentState>
  timestamp: Date
  canRollback: boolean
}

/**
 * Agentic Workflow Executor
 * 
 * Implements Plan → Execute → Reflect pattern
 */
export class AgenticWorkflow {
  /**
   * Phase 1: Planning
   * 
   * Generate a plan before execution
   */
  static async plan(config: {
    model: any
    goal: string
    availableTools: string[]
    context?: Record<string, any>
  }): Promise<WorkflowPlan> {
    const { model, goal, availableTools, context } = config

    const planningPrompt = `<task>
Create a detailed plan to accomplish the following goal:
${goal}
</task>

<available_tools>
${availableTools.join(', ')}
</available_tools>

${context ? `<context>\n${JSON.stringify(context, null, 2)}\n</context>` : ''}

<instructions>
Create a step-by-step plan that:
1. Breaks down the goal into concrete, actionable steps
2. Identifies which tools are needed for each step
3. Notes dependencies between steps
4. Estimates the expected outcome of each step

Format your response as:
<plan>
<step number="1">
<description>...</description>
<tools>tool1, tool2</tools>
<expected_outcome>...</expected_outcome>
<dependencies>none</dependencies>
</step>
...
</plan>
</instructions>`

    const result = await generateText({
      model,
      prompt: planningPrompt,
      temperature: 0.3, // Lower temperature for more focused planning
    })

    // Parse plan from response
    return this.parsePlan(result.text, goal, availableTools)
  }

  /**
   * Phase 2: Execution with checkpoints
   * 
   * Execute plan with ability to rollback
   */
  static async execute(config: {
    model: any
    plan: WorkflowPlan
    tools: Record<string, any>
    state: WorkflowState
    onStepComplete?: (step: AgentStep, checkpoint: WorkflowCheckpoint) => Promise<void>
  }): Promise<WorkflowState> {
    const { model, plan, tools, state, onStepComplete } = config

    for (const plannedStep of plan.steps) {
      // Create checkpoint before step
      const checkpoint: WorkflowCheckpoint = {
        stepNumber: plannedStep.stepNumber,
        state: { ...state },
        timestamp: new Date(),
        canRollback: true,
      }
      state.checkpoints.push(checkpoint)

      try {
        // Execute step
        const stepResult = await this.executeStep({
          model,
          step: plannedStep,
          tools,
          state,
        })

        // Update state
        state.stepHistory.push(stepResult)
        state.currentStep = plannedStep.stepNumber

        // Callback
        if (onStepComplete) {
          await onStepComplete(stepResult, checkpoint)
        }

        // Check if we should continue
        if (stepResult.type === 'error') {
          // Attempt self-correction
          const corrected = await this.attemptCorrection({
            model,
            step: plannedStep,
            error: stepResult.error!,
            state,
          })

          if (!corrected) {
            throw new Error(`Step ${plannedStep.stepNumber} failed: ${stepResult.error?.message}`)
          }
        }
      } catch (error) {
        // Rollback to checkpoint if possible
        if (checkpoint.canRollback) {
          Object.assign(state, checkpoint.state)
        }
        throw error
      }
    }

    state.phase = 'reflection'
    return state
  }

  /**
   * Phase 3: Reflection
   * 
   * Reflect on execution and identify improvements
   */
  static async reflect(config: {
    model: any
    state: WorkflowState
    goal: string
  }): Promise<{ success: boolean; reflection: string; improvements: string[] }> {
    const { model, state, goal } = config

    const reflectionPrompt = `<task>
Reflect on the execution of this workflow:
Goal: ${goal}
</task>

<execution_history>
${state.stepHistory.map((step, i) => `
Step ${i + 1}: ${step.description}
Type: ${step.type}
${step.error ? `Error: ${step.error.message}` : 'Success'}
`).join('\n')}
</execution_history>

<instructions>
Analyze the execution and provide:
1. Whether the goal was successfully achieved
2. What went well
3. What could be improved
4. Specific recommendations for future similar tasks

Format your response as:
<reflection>
<success>true/false</success>
<analysis>...</analysis>
<improvements>
<improvement>...</improvement>
...
</improvements>
</reflection>
</instructions>`

    const result = await generateText({
      model,
      prompt: reflectionPrompt,
      temperature: 0.5,
    })

    return this.parseReflection(result.text)
  }

  /**
   * Execute a single step
   */
  private static async executeStep(config: {
    model: any
    step: PlannedStep
    tools: Record<string, any>
    state: WorkflowState
  }): Promise<AgentStep> {
    const { model, step, tools, state } = config

    const stepPrompt = `<current_step>
Step ${step.stepNumber}: ${step.description}
Expected outcome: ${step.expectedOutcome}
</current_step>

<previous_steps>
${state.stepHistory.map((s) => `Step ${s.stepNumber}: ${s.description} - ${s.type}`).join('\n')}
</previous_steps>

<instructions>
Execute this step using the available tools.
Think through your approach, then use tools as needed.
Verify the outcome matches the expected result.
</instructions>`

    const startTime = Date.now()

    try {
      const result = await generateText({
        model,
        prompt: stepPrompt,
        tools: this.filterTools(tools, step.toolsNeeded),
        maxSteps: 5,
      })

      const { thinking, output } = extractThinking(result.text)

      return {
        stepNumber: step.stepNumber,
        type: 'tool_call',
        description: step.description,
        response: output,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        toolCalls: result.steps?.flatMap((s: any) => s.toolCalls || []),
      }
    } catch (error) {
      return {
        stepNumber: step.stepNumber,
        type: 'error',
        description: step.description,
        error: {
          code: 'STEP_EXECUTION_FAILED',
          message: (error as Error).message,
          timestamp: new Date(),
          recoverable: true,
        },
        timestamp: new Date(),
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * Attempt self-correction after error
   */
  private static async attemptCorrection(config: {
    model: any
    step: PlannedStep
    error: any
    state: WorkflowState
  }): Promise<boolean> {
    const { model, step, error, state } = config

    const correctionPrompt = `<error>
Step ${step.stepNumber} failed with error:
${error.message}
</error>

<step_details>
Description: ${step.description}
Expected outcome: ${step.expectedOutcome}
</step_details>

<instructions>
Analyze the error and determine:
1. What went wrong
2. Whether it's recoverable
3. How to correct it

If recoverable, provide a corrected approach.
If not recoverable, explain why and suggest alternatives.

Format:
<analysis>
<recoverable>true/false</recoverable>
<cause>...</cause>
<correction>...</correction>
</analysis>
</instructions>`

    const result = await generateText({
      model,
      prompt: correctionPrompt,
      temperature: 0.4,
    })

    // Parse and determine if we can retry
    const recoverable = result.text.includes('<recoverable>true</recoverable>')

    if (recoverable) {
      state.reflections.push(`Self-corrected step ${step.stepNumber}: ${result.text}`)
    }

    return recoverable
  }

  /**
   * Parse plan from LLM response
   */
  private static parsePlan(response: string, goal: string, tools: string[]): WorkflowPlan {
    // Simple parsing - in production, use more robust XML parsing
    const steps: PlannedStep[] = []
    const stepMatches = response.matchAll(/<step number="(\d+)">([\s\S]*?)<\/step>/g)

    for (const match of stepMatches) {
      const stepNum = parseInt(match[1])
      const stepContent = match[2]

      const description = stepContent.match(/<description>(.*?)<\/description>/)?.[1] || ''
      const toolsStr = stepContent.match(/<tools>(.*?)<\/tools>/)?.[1] || ''
      const outcome = stepContent.match(/<expected_outcome>(.*?)<\/expected_outcome>/)?.[1] || ''
      const depsStr = stepContent.match(/<dependencies>(.*?)<\/dependencies>/)?.[1] || 'none'

      steps.push({
        stepNumber: stepNum,
        description: description.trim(),
        toolsNeeded: toolsStr.split(',').map((t) => t.trim()).filter((t) => t && t !== 'none'),
        expectedOutcome: outcome.trim(),
        dependencies: depsStr === 'none' ? [] : depsStr.split(',').map((d) => parseInt(d.trim())),
      })
    }

    return {
      goal,
      steps,
      estimatedDuration: steps.length * 5000, // Rough estimate
      requiredTools: [...new Set(steps.flatMap((s) => s.toolsNeeded))],
    }
  }

  /**
   * Parse reflection from LLM response
   */
  private static parseReflection(response: string): {
    success: boolean
    reflection: string
    improvements: string[]
  } {
    const success = response.includes('<success>true</success>')
    const analysis = response.match(/<analysis>([\s\S]*?)<\/analysis>/)?.[1] || response
    const improvements: string[] = []

    const improvementMatches = response.matchAll(/<improvement>(.*?)<\/improvement>/g)
    for (const match of improvementMatches) {
      improvements.push(match[1].trim())
    }

    return {
      success,
      reflection: analysis.trim(),
      improvements,
    }
  }

  /**
   * Filter tools to only those needed
   */
  private static filterTools(allTools: Record<string, any>, needed: string[]): Record<string, any> {
    const filtered: Record<string, any> = {}
    for (const toolName of needed) {
      if (allTools[toolName]) {
        filtered[toolName] = allTools[toolName]
      }
    }
    return filtered
  }
}
