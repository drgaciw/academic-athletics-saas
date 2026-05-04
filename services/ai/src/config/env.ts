/**
 * AI Service Environment Configuration
 * 
 * Uses centralized environment validation from @aah/config
 */

import { aiServiceEnvSchema, validateEnv, type AIServiceEnv } from '@aah/config/env'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return

  const content = readFileSync(filePath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (!value) continue

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '../../.env'))

// Validate environment variables on module load
export const env: AIServiceEnv = validateEnv(aiServiceEnvSchema)

// Re-export for convenience
export { isProduction, isDevelopment, isTest } from '@aah/config/env'
