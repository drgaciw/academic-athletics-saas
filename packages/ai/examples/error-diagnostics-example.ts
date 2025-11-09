/**
 * Error Diagnostics Agent - Usage Examples
 * 
 * Demonstrates how to use the Error Diagnostics Agent for:
 * - Analyzing errors
 * - Detecting patterns
 * - Getting fix recommendations
 * - Assessing compliance impact
 */

import { 
  createErrorDiagnosticsAgent,
  quickErrorAnalysis,
} from '../agents/error-diagnostics-agent'

/**
 * Example 1: Analyze a database timeout error
 */
async function example1_analyzeError() {
  console.log('\n=== Example 1: Analyze Database Timeout Error ===\n')

  const agent = createErrorDiagnosticsAgent()

  const error = new Error('Query execution timeout after 30 seconds')
  error.stack = `Error: Query execution timeout after 30 seconds
    at PrismaClient.query (prisma/client.ts:123)
    at ComplianceService.checkEligibility (services/compliance/src/services/rules-engine.ts:45)
    at POST /api/compliance/check-eligibility (services/compliance/src/routes/check-eligibility.ts:23)`

  const response = await agent.analyzeError({
    error,
    context: {
      service: 'compliance',
      userId: 'S12345',
      correlationId: 'corr-abc-123',
    },
  })

  console.log('Analysis:', response.content)
  console.log('\nSteps:', response.steps.length)
  console.log('Tools used:', response.toolInvocations.map(t => t.toolName).join(', '))
  console.log('Cost:', `$${response.cost.toFixed(4)}`)
}

/**
 * Example 2: Detect error patterns across services
 */
async function example2_detectPatterns() {
  console.log('\n=== Example 2: Detect Error Patterns ===\n')

  const agent = createErrorDiagnosticsAgent()

  const response = await agent.detectPatterns({
    timeRange: {
      start: new Date('2024-11-01'),
      end: new Date('2024-11-08'),
    },
    services: ['compliance', 'advising', 'monitoring'],
    minOccurrences: 5,
  })

  console.log('Pattern Detection:', response.content)
  console.log('\nDuration:', `${response.duration}ms`)
}

/**
 * Example 3: Get fix recommendation
 */
async function example3_suggestFix() {
  console.log('\n=== Example 3: Get Fix Recommendation ===\n')

  const agent = createErrorDiagnosticsAgent()

  const response = await agent.suggestFix({
    errorCode: 'DB_TIMEOUT',
    errorMessage: 'Query execution timeout after 30 seconds',
    service: 'compliance',
    context: {
      query: 'SELECT * FROM students WHERE gpa > 2.0',
      affectedEndpoint: '/api/compliance/check-eligibility',
    },
  })

  console.log('Fix Recommendation:', response.content)
}

/**
 * Example 4: Assess NCAA compliance impact
 */
async function example4_assessComplianceImpact() {
  console.log('\n=== Example 4: Assess NCAA Compliance Impact ===\n')

  const agent = createErrorDiagnosticsAgent()

  const response = await agent.assessComplianceImpact({
    error: 'GPA calculation failed for student S12345',
    affectedStudents: ['S12345', 'S12346'],
    service: 'compliance',
  })

  console.log('Compliance Impact:', response.content)
}

/**
 * Example 5: Generate error report
 */
async function example5_generateReport() {
  console.log('\n=== Example 5: Generate Error Report ===\n')

  const agent = createErrorDiagnosticsAgent()

  const response = await agent.generateErrorReport({
    timeRange: {
      start: new Date('2024-11-01'),
      end: new Date('2024-11-08'),
    },
    services: ['compliance', 'advising'],
    severity: 'high',
    includeResolutions: true,
  })

  console.log('Error Report:', response.content)
}

/**
 * Example 6: Validate FERPA compliance
 */
async function example6_validateFERPA() {
  console.log('\n=== Example 6: Validate FERPA Compliance ===\n')

  const agent = createErrorDiagnosticsAgent()

  const response = await agent.validateFERPACompliance({
    errorLogs: [
      {
        message: 'Student S12345 not found in database',
        metadata: { userId: 'S12345', timestamp: new Date().toISOString() },
      },
      {
        message: 'Invalid email format: john.doe@university.edu',
        metadata: { email: 'john.doe@university.edu' },
      },
    ],
    service: 'user',
  })

  console.log('FERPA Validation:', response.content)
}

/**
 * Example 7: Predict errors from code changes
 */
async function example7_predictErrors() {
  console.log('\n=== Example 7: Predict Errors from Code Changes ===\n')

  const agent = createErrorDiagnosticsAgent()

  const response = await agent.predictErrors({
    service: 'compliance',
    changes: {
      files: [
        'services/compliance/src/services/rules-engine.ts',
        'services/compliance/src/routes/check-eligibility.ts',
      ],
      description: 'Updated NCAA rule version from 2023-2024 to 2024-2025, changed GPA threshold from 2.0 to 2.3',
    },
    deploymentTarget: 'production',
  })

  console.log('Error Prediction:', response.content)
}

/**
 * Example 8: Quick error analysis (convenience function)
 */
async function example8_quickAnalysis() {
  console.log('\n=== Example 8: Quick Error Analysis ===\n')

  const error = new Error('Rate limit exceeded for OpenAI API')
  
  const response = await quickErrorAnalysis(error, {
    service: 'ai',
    correlationId: 'corr-xyz-789',
  })

  console.log('Quick Analysis:', response.content)
}

/**
 * Example 9: Real-world scenario - Production error handling
 */
async function example9_productionScenario() {
  console.log('\n=== Example 9: Production Error Handling ===\n')

  const agent = createErrorDiagnosticsAgent()

  // Simulate production error
  const productionError = new Error('Unhandled promise rejection in compliance service')
  productionError.stack = `Error: Unhandled promise rejection
    at async checkEligibility (services/compliance/src/services/rules-engine.ts:67)
    at async POST /api/compliance/check-eligibility`

  // Step 1: Analyze the error
  console.log('Step 1: Analyzing error...')
  const analysis = await agent.analyzeError({
    error: productionError,
    context: {
      service: 'compliance',
      correlationId: 'prod-error-001',
      metadata: {
        environment: 'production',
        timestamp: new Date().toISOString(),
        affectedUsers: 3,
      },
    },
  })

  console.log('Analysis complete:', analysis.content.substring(0, 200) + '...')

  // Step 2: Assess compliance impact
  console.log('\nStep 2: Assessing NCAA compliance impact...')
  const complianceImpact = await agent.assessComplianceImpact({
    error: productionError,
    affectedStudents: ['S12345', 'S12346', 'S12347'],
    service: 'compliance',
  })

  console.log('Compliance impact assessed')

  // Step 3: Get fix recommendation
  console.log('\nStep 3: Getting fix recommendation...')
  const fix = await agent.suggestFix({
    errorCode: 'UNHANDLED_REJECTION',
    errorMessage: productionError.message,
    service: 'compliance',
    context: {
      stackTrace: productionError.stack,
      environment: 'production',
    },
  })

  console.log('Fix recommendation generated')

  console.log('\n✅ Production error handled successfully')
  console.log(`Total cost: $${(analysis.cost + complianceImpact.cost + fix.cost).toFixed(4)}`)
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🔍 Error Diagnostics Agent - Usage Examples\n')
  console.log('=' .repeat(60))

  try {
    await example1_analyzeError()
    await example2_detectPatterns()
    await example3_suggestFix()
    await example4_assessComplianceImpact()
    await example5_generateReport()
    await example6_validateFERPA()
    await example7_predictErrors()
    await example8_quickAnalysis()
    await example9_productionScenario()

    console.log('\n' + '='.repeat(60))
    console.log('✅ All examples completed successfully!')
  } catch (error) {
    console.error('\n❌ Error running examples:', error)
    throw error
  }
}

/**
 * Run specific example
 */
async function runExample(exampleNumber: number) {
  const examples = [
    example1_analyzeError,
    example2_detectPatterns,
    example3_suggestFix,
    example4_assessComplianceImpact,
    example5_generateReport,
    example6_validateFERPA,
    example7_predictErrors,
    example8_quickAnalysis,
    example9_productionScenario,
  ]

  if (exampleNumber < 1 || exampleNumber > examples.length) {
    console.error(`Invalid example number. Choose 1-${examples.length}`)
    return
  }

  await examples[exampleNumber - 1]()
}

// CLI support
if (require.main === module) {
  const exampleNumber = process.argv[2] ? parseInt(process.argv[2]) : null

  if (exampleNumber) {
    runExample(exampleNumber).catch(console.error)
  } else {
    runAllExamples().catch(console.error)
  }
}

export {
  example1_analyzeError,
  example2_detectPatterns,
  example3_suggestFix,
  example4_assessComplianceImpact,
  example5_generateReport,
  example6_validateFERPA,
  example7_predictErrors,
  example8_quickAnalysis,
  example9_productionScenario,
  runAllExamples,
}
