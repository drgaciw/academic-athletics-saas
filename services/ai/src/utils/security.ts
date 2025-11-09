import { ValidationResult } from '../types'
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || 'default-key-change-in-production'

// ============================================================================
// PII DETECTION
// ============================================================================

const PII_PATTERNS = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  studentId: /\b[A-Z]{2}\d{7,10}\b/g,
  address: /\b\d{1,5}\s+([A-Za-z]+\s){1,4}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
}

/**
 * Detect PII in text content
 */
export function detectPII(text: string): {
  hasPII: boolean
  findings: Array<{ type: string; value: string; position: number }>
} {
  const findings: Array<{ type: string; value: string; position: number }> = []

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      findings.push({
        type,
        value: match[0],
        position: match.index || 0,
      })
    }
  }

  return {
    hasPII: findings.length > 0,
    findings,
  }
}

/**
 * Redact PII from text
 */
export function redactPII(text: string): string {
  let redacted = text

  for (const pattern of Object.values(PII_PATTERNS)) {
    redacted = redacted.replace(pattern, '[REDACTED]')
  }

  return redacted
}

// ============================================================================
// PROMPT INJECTION DETECTION
// ============================================================================

const INJECTION_PATTERNS = [
  // Direct instruction overrides
  /ignore (previous|all|above) (instructions|prompts|rules)/i,
  /disregard (previous|all|above) (instructions|prompts|rules)/i,
  /forget (previous|all|above) (instructions|prompts|rules)/i,

  // Role manipulation
  /you are now (a|an) .* (assistant|model|ai)/i,
  /act as (a|an) .* (assistant|model|ai)/i,
  /pretend (you are|to be) .* (assistant|model|ai)/i,

  // System prompt extraction
  /what (is|are) your (system )?(prompt|instructions|rules)/i,
  /(show|reveal|display) your (system )?(prompt|instructions|rules)/i,
  /repeat your (system )?(prompt|instructions|rules)/i,

  // Output manipulation
  /output raw (text|data|json)/i,
  /bypass (safety|filter|check)/i,
  /ignore (safety|filter|ethical) (guidelines|rules)/i,

  // Special characters that might break context
  /\|\|system\|\|/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
]

/**
 * Detect potential prompt injection attempts
 */
export function detectPromptInjection(text: string): {
  hasInjection: boolean
  patterns: string[]
  severity: 'low' | 'medium' | 'high'
} {
  const detectedPatterns: string[] = []

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detectedPatterns.push(pattern.source)
    }
  }

  let severity: 'low' | 'medium' | 'high' = 'low'
  if (detectedPatterns.length >= 3) severity = 'high'
  else if (detectedPatterns.length >= 1) severity = 'medium'

  return {
    hasInjection: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    severity,
  }
}

// ============================================================================
// HALLUCINATION DETECTION
// ============================================================================

/**
 * Check if response contains hallucinated information
 * This is a simplified version - production should use more sophisticated methods
 */
export function detectHallucination(
  response: string,
  sources: Array<{ content: string }>
): {
  hasHallucination: boolean
  confidence: number
  unsupportedClaims: string[]
} {
  // Extract factual claims from response
  const claims = extractFactualClaims(response)
  const unsupportedClaims: string[] = []

  for (const claim of claims) {
    const isSupported = sources.some((source) =>
      source.content.toLowerCase().includes(claim.toLowerCase())
    )

    if (!isSupported) {
      unsupportedClaims.push(claim)
    }
  }

  const supportedRatio = (claims.length - unsupportedClaims.length) / Math.max(claims.length, 1)

  return {
    hasHallucination: unsupportedClaims.length > 0,
    confidence: supportedRatio,
    unsupportedClaims,
  }
}

/**
 * Extract factual claims from text (simplified)
 */
function extractFactualClaims(text: string): string[] {
  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10)

  // Filter for sentences that look like factual claims
  const claims = sentences.filter((sentence) => {
    // Look for patterns that indicate factual statements
    const factPatterns = [
      /\b(is|are|was|were|has|have|had)\b/i,
      /\b(requires|requires|must|should|shall)\b/i,
      /\b\d+/,
      /\b(according to|based on|per|under)\b/i,
    ]

    return factPatterns.some((pattern) => pattern.test(sentence))
  })

  return claims
}

// ============================================================================
// CONTENT FILTERING
// ============================================================================

const INAPPROPRIATE_PATTERNS = [
  /\b(hate|racist|sexist|discriminat)\w*/gi,
  /\b(violence|violent|assault|attack)\b/gi,
  /\b(illegal|unlawful|criminal)\s+(activity|action|behavior)/gi,
]

/**
 * Filter inappropriate content
 */
export function filterInappropriateContent(text: string): {
  isAppropriate: boolean
  issues: string[]
} {
  const issues: string[] = []

  for (const pattern of INAPPROPRIATE_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      issues.push(...matches.map((m) => `Potentially inappropriate: "${m}"`))
    }
  }

  return {
    isAppropriate: issues.length === 0,
    issues,
  }
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Validate AI response for all security concerns
 */
export function validateResponse(
  response: string,
  sources?: Array<{ content: string }>
): ValidationResult {
  const pii = detectPII(response)
  const injection = detectPromptInjection(response)
  const content = filterInappropriateContent(response)

  let hallucination = {
    hasHallucination: false,
    confidence: 1,
    unsupportedClaims: [] as string[],
  }

  if (sources && sources.length > 0) {
    hallucination = detectHallucination(response, sources)
  }

  const issues: ValidationResult['issues'] = []

  // Add PII issues
  if (pii.hasPII) {
    for (const finding of pii.findings) {
      issues.push({
        type: 'pii',
        severity: 'critical',
        description: `Detected ${finding.type} at position ${finding.position}`,
        location: `Position ${finding.position}`,
      })
    }
  }

  // Add injection issues
  if (injection.hasInjection) {
    issues.push({
      type: 'injection',
      severity: injection.severity,
      description: `Detected ${injection.patterns.length} potential prompt injection patterns`,
    })
  }

  // Add hallucination issues
  if (hallucination.hasHallucination) {
    for (const claim of hallucination.unsupportedClaims) {
      issues.push({
        type: 'hallucination',
        severity: 'medium',
        description: `Unsupported claim: "${claim.substring(0, 100)}..."`,
      })
    }
  }

  // Add content issues
  if (!content.isAppropriate) {
    for (const issue of content.issues) {
      issues.push({
        type: 'inappropriate',
        severity: 'high',
        description: issue,
      })
    }
  }

  return {
    isValid: issues.length === 0 || issues.every((i) => i.severity === 'low'),
    hasHallucination: hallucination.hasHallucination,
    hasPII: pii.hasPII,
    hasPromptInjection: injection.hasInjection,
    issues,
  }
}

// ============================================================================
// ENCRYPTION
// ============================================================================

/**
 * Encrypt sensitive conversation data
 */
export function encryptConversation(content: string): string {
  return CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString()
}

/**
 * Decrypt conversation data
 */
export function decryptConversation(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * Hash data for comparison without exposing content
 */
export function hashContent(content: string): string {
  return CryptoJS.SHA256(content).toString()
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize user input before processing
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  // Remove potential HTML/script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // Limit length
  const maxLength = 10000
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitize output before sending to client
 */
export function sanitizeOutput(output: string): string {
  // Remove any system-level information
  let sanitized = output.replace(/\[SYSTEM\].*?\[\/SYSTEM\]/gs, '')

  // Remove internal markers
  sanitized = sanitized.replace(/\[INTERNAL\].*?\[\/INTERNAL\]/gs, '')

  return sanitized.trim()
}
