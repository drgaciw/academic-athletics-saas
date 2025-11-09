/**
 * AI Service Environment Configuration
 * 
 * Uses centralized environment validation from @aah/config
 */

import { aiServiceEnvSchema, validateEnv, type AIServiceEnv } from '@aah/config/env'

// Validate environment variables on module load
export const env: AIServiceEnv = validateEnv(aiServiceEnvSchema)

// Re-export for convenience
export { isProduction, isDevelopment, isTest } from '@aah/config/env'
