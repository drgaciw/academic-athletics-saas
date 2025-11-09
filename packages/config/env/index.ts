/**
 * Environment Variable Validation and Type-Safe Access
 * 
 * This module provides centralized environment variable validation
 * and type-safe access across all microservices.
 */

import { z } from 'zod'

// =============================================================================
// SHARED ENVIRONMENT SCHEMA
// =============================================================================

const baseEnvSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  
  // Authentication
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('7d'),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // Security
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  ENCRYPTION_KEY: z.string().length(32),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Feature Flags
  FEATURE_AI_ENABLED: z.coerce.boolean().default(true),
  FEATURE_REAL_TIME_NOTIFICATIONS: z.coerce.boolean().default(true),
})

// =============================================================================
// SERVICE-SPECIFIC SCHEMAS
// =============================================================================

export const userServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3001),
  SERVICE_NAME: z.string().default('user-service'),
})

export const advisingServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3002),
  SERVICE_NAME: z.string().default('advising-service'),
  AI_SERVICE_URL: z.string().url(),
})

export const complianceServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3003),
  SERVICE_NAME: z.string().default('compliance-service'),
  NCAA_RULE_VERSION: z.string().default('2024-2025'),
  NCAA_API_ENABLED: z.coerce.boolean().default(false),
})

export const monitoringServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3004),
  SERVICE_NAME: z.string().default('monitoring-service'),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().default('us2'),
  AI_SERVICE_URL: z.string().url(),
})

export const supportServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3005),
  SERVICE_NAME: z.string().default('support-service'),
})

export const integrationServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3006),
  SERVICE_NAME: z.string().default('integration-service'),
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email(),
  EMAIL_FROM_NAME: z.string(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CANVAS_API_URL: z.string().url().optional(),
  CANVAS_API_TOKEN: z.string().optional(),
})

export const aiServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3007),
  SERVICE_NAME: z.string().default('ai-service'),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_DEFAULT_MODEL: z.string().default('gpt-4-turbo-preview'),
  ANTHROPIC_DEFAULT_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  AI_MAX_TOKENS: z.coerce.number().default(4096),
  AI_TEMPERATURE: z.coerce.number().default(0.7),
  AI_STREAMING_ENABLED: z.coerce.boolean().default(true),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().default('https://cloud.langfuse.com'),
})

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export type BaseEnv = z.infer<typeof baseEnvSchema>
export type UserServiceEnv = z.infer<typeof userServiceEnvSchema>
export type AdvisingServiceEnv = z.infer<typeof advisingServiceEnvSchema>
export type ComplianceServiceEnv = z.infer<typeof complianceServiceEnvSchema>
export type MonitoringServiceEnv = z.infer<typeof monitoringServiceEnvSchema>
export type SupportServiceEnv = z.infer<typeof supportServiceEnvSchema>
export type IntegrationServiceEnv = z.infer<typeof integrationServiceEnvSchema>
export type AIServiceEnv = z.infer<typeof aiServiceEnvSchema>

/**
 * Validates environment variables against a schema
 * Throws an error if validation fails
 */
export function validateEnv<T extends z.ZodType>(
  schema: T,
  env: Record<string, string | undefined> = process.env
): z.infer<T> {
  const result = schema.safeParse(env)
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(result.error.format(), null, 2))
    throw new Error('Environment validation failed')
  }
  
  return result.data
}

/**
 * Gets a validated environment variable with type safety
 */
export function getEnv<T extends z.ZodType>(
  schema: T,
  env: Record<string, string | undefined> = process.env
): z.infer<T> {
  return validateEnv(schema, env)
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Checks if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Checks if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Gets the service URL based on environment
 */
export function getServiceUrl(serviceName: string): string {
  const envKey = `${serviceName.toUpperCase().replace('-', '_')}_SERVICE_URL`
  const url = process.env[envKey]
  
  if (!url) {
    throw new Error(`Service URL not configured: ${envKey}`)
  }
  
  return url
}

/**
 * Parses allowed origins for CORS
 */
export function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
  return origins.split(',').map((origin: string) => origin.trim())
}

/**
 * Gets database connection options
 */
export function getDatabaseConfig() {
  return {
    url: process.env.DATABASE_URL!,
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
    },
  }
}

/**
 * Gets rate limiting configuration
 */
export function getRateLimitConfig(isAdmin: boolean = false) {
  const window = parseInt(process.env.RATE_LIMIT_WINDOW || '60000')
  const maxRequests = isAdmin
    ? parseInt(process.env.RATE_LIMIT_ADMIN_MAX_REQUESTS || '1000')
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  
  return { window, maxRequests }
}
