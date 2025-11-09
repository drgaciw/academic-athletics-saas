/**
 * Configuration Manager
 * 
 * Manages agent configuration with dynamic updates
 * Supports A/B testing, feature flags, and runtime configuration
 */

import type { AgentConfig, AgentType, LLMProvider } from '../types/agent.types'

/**
 * Configuration source
 */
export type ConfigSource = 'environment' | 'database' | 'file' | 'default'

/**
 * Feature flag
 */
export interface FeatureFlag {
  name: string
  enabled: boolean
  rolloutPercentage?: number
  allowedUsers?: string[]
  allowedRoles?: string[]
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number
  tokensPerDay: number
  costPerDay: number
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  name: string
  variants: Array<{
    name: string
    weight: number
    config: Partial<AgentConfig>
  }>
  enabled: boolean
}

/**
 * Agent configuration override
 */
export interface ConfigOverride {
  agentType: AgentType
  overrides: Partial<AgentConfig>
  priority: number
  conditions?: {
    userId?: string[]
    userRole?: string[]
    timeRange?: { start: Date; end: Date }
  }
}

/**
 * Configuration Manager Class
 */
export class ConfigManager {
  private configs: Map<AgentType, AgentConfig> = new Map()
  private featureFlags: Map<string, FeatureFlag> = new Map()
  private rateLimits: Map<string, RateLimitConfig> = new Map()
  private abTests: Map<string, ABTestConfig> = new Map()
  private overrides: ConfigOverride[] = []

  /**
   * Initialize configuration
   */
  async initialize(): Promise<void> {
    await this.loadFromEnvironment()
    await this.loadFeatureFlags()
    await this.loadRateLimits()
    await this.loadABTests()
  }

  /**
   * Get agent configuration
   */
  getAgentConfig(
    agentType: AgentType,
    context?: { userId?: string; userRole?: string }
  ): AgentConfig {
    let config = this.configs.get(agentType)

    if (!config) {
      throw new Error(`Configuration not found for agent type: ${agentType}`)
    }

    // Apply overrides
    config = this.applyOverrides(config, agentType, context)

    // Apply A/B test variants
    config = this.applyABTests(config, agentType, context)

    return config
  }

  /**
   * Set agent configuration
   */
  setAgentConfig(agentType: AgentType, config: AgentConfig): void {
    this.configs.set(agentType, config)
  }

  /**
   * Update agent configuration
   */
  updateAgentConfig(
    agentType: AgentType,
    updates: Partial<AgentConfig>
  ): void {
    const existing = this.configs.get(agentType)
    if (!existing) {
      throw new Error(`Configuration not found for agent type: ${agentType}`)
    }

    this.configs.set(agentType, { ...existing, ...updates })
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(
    featureName: string,
    context?: { userId?: string; userRole?: string }
  ): boolean {
    const flag = this.featureFlags.get(featureName)

    if (!flag) return false
    if (!flag.enabled) return false

    // Check user allowlist
    if (flag.allowedUsers && context?.userId) {
      return flag.allowedUsers.includes(context.userId)
    }

    // Check role allowlist
    if (flag.allowedRoles && context?.userRole) {
      return flag.allowedRoles.includes(context.userRole)
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const hash = this.hashString(context?.userId || '')
      const bucket = hash % 100
      return bucket < flag.rolloutPercentage
    }

    return true
  }

  /**
   * Set feature flag
   */
  setFeatureFlag(flag: FeatureFlag): void {
    this.featureFlags.set(flag.name, flag)
  }

  /**
   * Get rate limit for user
   */
  getRateLimit(userId: string): RateLimitConfig {
    return (
      this.rateLimits.get(userId) ||
      this.rateLimits.get('default') || {
        requestsPerMinute: 60,
        tokensPerDay: 100000,
        costPerDay: 10.0,
      }
    )
  }

  /**
   * Set rate limit
   */
  setRateLimit(userId: string, config: RateLimitConfig): void {
    this.rateLimits.set(userId, config)
  }

  /**
   * Add configuration override
   */
  addOverride(override: ConfigOverride): void {
    this.overrides.push(override)
    this.overrides.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Remove configuration override
   */
  removeOverride(agentType: AgentType, priority: number): void {
    this.overrides = this.overrides.filter(
      (o) => !(o.agentType === agentType && o.priority === priority)
    )
  }

  /**
   * Create A/B test
   */
  createABTest(test: ABTestConfig): void {
    // Validate weights sum to 100
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0)
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('A/B test variant weights must sum to 100')
    }

    this.abTests.set(test.name, test)
  }

  /**
   * Get A/B test variant for user
   */
  getABTestVariant(
    testName: string,
    userId: string
  ): string | null {
    const test = this.abTests.get(testName)

    if (!test || !test.enabled) return null

    // Deterministic variant selection based on user ID
    const hash = this.hashString(`${testName}:${userId}`)
    const bucket = hash % 100

    let cumulative = 0
    for (const variant of test.variants) {
      cumulative += variant.weight
      if (bucket < cumulative) {
        return variant.name
      }
    }

    return test.variants[0].name
  }

  /**
   * Get all enabled tools for agent
   */
  getEnabledTools(agentType: AgentType): string[] {
    const config = this.configs.get(agentType)
    if (!config) return []

    return config.tools.filter((toolName) => {
      const featureName = `tool:${toolName}`
      return this.isFeatureEnabled(featureName)
    })
  }

  /**
   * Enable/disable tool dynamically
   */
  setToolEnabled(toolName: string, enabled: boolean): void {
    this.setFeatureFlag({
      name: `tool:${toolName}`,
      enabled,
    })
  }

  /**
   * Get model configuration
   */
  getModelConfig(agentType: AgentType): {
    provider: LLMProvider
    name: string
    temperature: number
    maxTokens: number
  } {
    const config = this.getAgentConfig(agentType)
    return {
      provider: config.model.provider,
      name: config.model.name,
      temperature: config.model.temperature || 0.7,
      maxTokens: config.model.maxTokens || 4096,
    }
  }

  /**
   * Update model configuration
   */
  updateModelConfig(
    agentType: AgentType,
    updates: Partial<AgentConfig['model']>
  ): void {
    const config = this.configs.get(agentType)
    if (!config) {
      throw new Error(`Configuration not found for agent type: ${agentType}`)
    }

    config.model = { ...config.model, ...updates }
    this.configs.set(agentType, config)
  }

  /**
   * Export configuration
   */
  exportConfig(): {
    agents: Record<AgentType, AgentConfig>
    featureFlags: Record<string, FeatureFlag>
    rateLimits: Record<string, RateLimitConfig>
    abTests: Record<string, ABTestConfig>
  } {
    return {
      agents: Object.fromEntries(this.configs) as any,
      featureFlags: Object.fromEntries(this.featureFlags),
      rateLimits: Object.fromEntries(this.rateLimits),
      abTests: Object.fromEntries(this.abTests),
    }
  }

  /**
   * Import configuration
   */
  importConfig(config: {
    agents?: Record<AgentType, AgentConfig>
    featureFlags?: Record<string, FeatureFlag>
    rateLimits?: Record<string, RateLimitConfig>
    abTests?: Record<string, ABTestConfig>
  }): void {
    if (config.agents) {
      for (const [type, agentConfig] of Object.entries(config.agents)) {
        this.configs.set(type as AgentType, agentConfig)
      }
    }

    if (config.featureFlags) {
      for (const [name, flag] of Object.entries(config.featureFlags)) {
        this.featureFlags.set(name, flag)
      }
    }

    if (config.rateLimits) {
      for (const [userId, limit] of Object.entries(config.rateLimits)) {
        this.rateLimits.set(userId, limit)
      }
    }

    if (config.abTests) {
      for (const [name, test] of Object.entries(config.abTests)) {
        this.abTests.set(name, test)
      }
    }
  }

  // Private helper methods

  private async loadFromEnvironment(): Promise<void> {
    // Load default configurations from environment variables
    const defaultProvider = (process.env.DEFAULT_LLM_PROVIDER || 'anthropic') as LLMProvider
    const defaultModel = process.env.DEFAULT_LLM_MODEL || 'claude-3-5-sonnet-20241022'
    const defaultTemperature = parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7')
    const defaultMaxTokens = parseInt(process.env.DEFAULT_MAX_TOKENS || '4096')

    // Set defaults for each agent type
    const agentTypes: AgentType[] = ['advising', 'compliance', 'intervention', 'administrative', 'general']

    for (const type of agentTypes) {
      if (!this.configs.has(type)) {
        this.configs.set(type, {
          type,
          name: `${type} Agent`,
          description: `${type} agent`,
          systemPrompt: '',
          tools: [],
          model: {
            provider: defaultProvider,
            name: defaultModel,
            temperature: defaultTemperature,
            maxTokens: defaultMaxTokens,
          },
          maxSteps: 10,
          streaming: true,
          memoryEnabled: true,
        })
      }
    }
  }

  private async loadFeatureFlags(): Promise<void> {
    // Load feature flags from environment or database
    const flags = process.env.FEATURE_FLAGS?.split(',') || []

    for (const flag of flags) {
      const [name, enabled] = flag.split(':')
      this.featureFlags.set(name, {
        name,
        enabled: enabled === 'true',
      })
    }
  }

  private async loadRateLimits(): Promise<void> {
    // Load default rate limits
    this.rateLimits.set('default', {
      requestsPerMinute: parseInt(process.env.DEFAULT_RATE_LIMIT || '60'),
      tokensPerDay: parseInt(process.env.DEFAULT_TOKEN_LIMIT || '100000'),
      costPerDay: parseFloat(process.env.DEFAULT_COST_LIMIT || '10.0'),
    })
  }

  private async loadABTests(): Promise<void> {
    // Load A/B tests from configuration
    // This would typically come from a database or config file
  }

  private applyOverrides(
    config: AgentConfig,
    agentType: AgentType,
    context?: { userId?: string; userRole?: string }
  ): AgentConfig {
    let result = { ...config }

    for (const override of this.overrides) {
      if (override.agentType !== agentType) continue

      // Check conditions
      if (override.conditions) {
        if (override.conditions.userId && context?.userId) {
          if (!override.conditions.userId.includes(context.userId)) continue
        }

        if (override.conditions.userRole && context?.userRole) {
          if (!override.conditions.userRole.includes(context.userRole)) continue
        }

        if (override.conditions.timeRange) {
          const now = new Date()
          if (
            now < override.conditions.timeRange.start ||
            now > override.conditions.timeRange.end
          ) {
            continue
          }
        }
      }

      // Apply override
      result = { ...result, ...override.overrides }
    }

    return result
  }

  private applyABTests(
    config: AgentConfig,
    agentType: AgentType,
    context?: { userId?: string }
  ): AgentConfig {
    if (!context?.userId) return config

    let result = { ...config }

    for (const [testName, test] of this.abTests) {
      if (!test.enabled) continue

      const variantName = this.getABTestVariant(testName, context.userId)
      if (!variantName) continue

      const variant = test.variants.find((v) => v.name === variantName)
      if (variant) {
        result = { ...result, ...variant.config }
      }
    }

    return result
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

/**
 * Global configuration manager instance
 */
export const globalConfigManager = new ConfigManager()

/**
 * Initialize configuration on module load
 */
globalConfigManager.initialize().catch((error) => {
  console.error('Failed to initialize configuration:', error)
})

/**
 * Convenience functions
 */
export function getAgentConfig(
  agentType: AgentType,
  context?: { userId?: string; userRole?: string }
): AgentConfig {
  return globalConfigManager.getAgentConfig(agentType, context)
}

export function isFeatureEnabled(
  featureName: string,
  context?: { userId?: string; userRole?: string }
): boolean {
  return globalConfigManager.isFeatureEnabled(featureName, context)
}

export function getRateLimit(userId: string): RateLimitConfig {
  return globalConfigManager.getRateLimit(userId)
}

export function setFeatureFlag(flag: FeatureFlag): void {
  return globalConfigManager.setFeatureFlag(flag)
}
