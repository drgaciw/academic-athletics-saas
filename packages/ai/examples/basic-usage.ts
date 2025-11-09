/**
 * Basic Usage Examples
 * 
 * Demonstrates how to use the AI agent system
 */

import {
  createAdvisingAgent,
  createComplianceAgent,
  createInterventionAgent,
  createAdministrativeAgent,
  createGeneralAssistant,
  createOrchestrator,
  executeAgentWorkflow,
  executeSmartWorkflow,
} from '../index'

/**
 * Example 1: Single Agent Execution
 */
async function example1_singleAgent() {
  console.log('\n=== Example 1: Single Agent Execution ===\n')

  const agent = createAdvisingAgent()

  const response = await agent.execute({
    userId: 'S12345',
    agentType: 'advising',
    message: 'I need help selecting courses for Fall 2024. I want to take 15 credits and avoid afternoon classes because of practice.',
  })

  console.log('Agent Type:', response.agentType)
  console.log('Status:', response.status)
  console.log('Response:', response.content)
  console.log('Steps:', response.steps.length)
  console.log('Tools Used:', response.toolInvocations.map(t => t.toolName))
  console.log('Cost:', `$${response.cost.toFixed(4)}`)
  console.log('Duration:', `${response.duration}ms`)
}

/**
 * Example 2: Using Helper Methods
 */
async function example2_helperMethods() {
  console.log('\n=== Example 2: Using Helper Methods ===\n')

  const agent = createAdvisingAgent()

  const response = await agent.recommendCourses({
    studentId: 'S12345',
    semester: 'Fall 2024',
    targetCredits: 15,
    preferences: {
      avoidAfternoons: true,
      onlinePreferred: false,
    },
  })

  console.log('Recommendations:', response.content)
  console.log('Cost:', `$${response.cost.toFixed(4)}`)
}

/**
 * Example 3: Compliance Agent
 */
async function example3_complianceAgent() {
  console.log('\n=== Example 3: Compliance Agent ===\n')

  const agent = createComplianceAgent()

  const response = await agent.checkEligibility({
    studentId: 'S12345',
    sport: 'Football',
    includeDetails: true,
  })

  console.log('Eligibility Check:', response.content)
  console.log('Tools Used:', response.toolInvocations.map(t => t.toolName))
}

/**
 * Example 4: Orchestrator with Auto-Routing
 */
async function example4_orchestrator() {
  console.log('\n=== Example 4: Orchestrator with Auto-Routing ===\n')

  const result = await executeAgentWorkflow({
    userId: 'S12345',
    message: 'Am I eligible to compete this season?',
  })

  console.log('Agent Selected:', result.agentsUsed[0])
  console.log('Response:', result.response.content)
  console.log('Success:', result.success)
  console.log('Total Cost:', `$${result.totalCost.toFixed(4)}`)
  console.log('Total Duration:', `${result.totalDuration}ms`)
}

/**
 * Example 5: Multi-Agent Workflow
 */
async function example5_multiAgent() {
  console.log('\n=== Example 5: Multi-Agent Workflow ===\n')

  const orchestrator = createOrchestrator()

  const result = await orchestrator.executeMultiAgent(
    {
      userId: 'S12345',
      message: 'I want to drop MATH 201. Will I still be eligible? If so, what other courses should I take?',
    },
    ['compliance', 'advising']
  )

  console.log('Agents Used:', result.agentsUsed)
  console.log('Workflow Steps:', result.workflowState?.stepsCompleted)
  console.log('Final Response:', result.response.content)
  console.log('Total Cost:', `$${result.totalCost.toFixed(4)}`)
}

/**
 * Example 6: Smart Workflow (Auto-Detection)
 */
async function example6_smartWorkflow() {
  console.log('\n=== Example 6: Smart Workflow (Auto-Detection) ===\n')

  const result = await executeSmartWorkflow({
    userId: 'S12345',
    message: 'I need to select courses for next semester but want to make sure I stay eligible',
  })

  console.log('Agents Used:', result.agentsUsed)
  console.log('Multi-Agent:', result.agentsUsed.length > 1)
  console.log('Response:', result.response.content)
}

/**
 * Example 7: Intent Classification
 */
async function example7_intentClassification() {
  console.log('\n=== Example 7: Intent Classification ===\n')

  const assistant = createGeneralAssistant()

  const queries = [
    'I need help selecting courses',
    'Am I eligible to compete?',
    'I\'m struggling in my classes',
    'Send an email to my professors',
    'What is the Athletic Academics Hub?',
  ]

  for (const query of queries) {
    const routing = await assistant.classifyAndRoute(query)
    console.log(`Query: "${query}"`)
    console.log(`  → Agent: ${routing.recommendedAgent}`)
    console.log(`  → Confidence: ${routing.confidence}`)
    console.log(`  → Reasoning: ${routing.reasoning}\n`)
  }
}

/**
 * Example 8: Intervention Agent
 */
async function example8_interventionAgent() {
  console.log('\n=== Example 8: Intervention Agent ===\n')

  const agent = createInterventionAgent()

  const response = await agent.assessRisk({
    studentId: 'S12345',
    timeframe: 'semester',
  })

  console.log('Risk Assessment:', response.content)
  console.log('Tools Used:', response.toolInvocations.map(t => t.toolName))
}

/**
 * Example 9: Administrative Agent
 */
async function example9_administrativeAgent() {
  console.log('\n=== Example 9: Administrative Agent ===\n')

  const agent = createAdministrativeAgent()

  const response = await agent.generateTravelLetter({
    studentId: 'S12345',
    travelDates: {
      departureDate: '2024-11-22',
      returnDate: '2024-11-24',
    },
    destination: 'Tech University',
    reason: 'Away game vs Tech',
  })

  console.log('Travel Letter Generated:', response.content)
  console.log('Tools Used:', response.toolInvocations.map(t => t.toolName))
}

/**
 * Example 10: Error Handling with Retry
 */
async function example10_errorHandling() {
  console.log('\n=== Example 10: Error Handling with Retry ===\n')

  const orchestrator = createOrchestrator()

  try {
    const result = await orchestrator.executeWithRetry(
      {
        userId: 'S12345',
        message: 'Help me plan my courses',
      },
      3 // Max retries
    )

    console.log('Success after retries:', result.success)
    console.log('Response:', result.response.content)
  } catch (error) {
    console.error('Failed after all retries:', error)
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║        AI Agent System - Usage Examples                   ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  try {
    await example1_singleAgent()
    await example2_helperMethods()
    await example3_complianceAgent()
    await example4_orchestrator()
    await example5_multiAgent()
    await example6_smartWorkflow()
    await example7_intentClassification()
    await example8_interventionAgent()
    await example9_administrativeAgent()
    await example10_errorHandling()

    console.log('\n✅ All examples completed successfully!\n')
  } catch (error) {
    console.error('\n❌ Error running examples:', error)
    throw error
  }
}

/**
 * Run specific example
 */
async function runExample(exampleNumber: number) {
  const examples: Record<number, () => Promise<void>> = {
    1: example1_singleAgent,
    2: example2_helperMethods,
    3: example3_complianceAgent,
    4: example4_orchestrator,
    5: example5_multiAgent,
    6: example6_smartWorkflow,
    7: example7_intentClassification,
    8: example8_interventionAgent,
    9: example9_administrativeAgent,
    10: example10_errorHandling,
  }

  const example = examples[exampleNumber]
  if (!example) {
    console.error(`Example ${exampleNumber} not found`)
    return
  }

  await example()
}

// Export for use in other files
export {
  example1_singleAgent,
  example2_helperMethods,
  example3_complianceAgent,
  example4_orchestrator,
  example5_multiAgent,
  example6_smartWorkflow,
  example7_intentClassification,
  example8_interventionAgent,
  example9_administrativeAgent,
  example10_errorHandling,
  runAllExamples,
  runExample,
}

// Run if executed directly
if (require.main === module) {
  const exampleNum = process.argv[2] ? parseInt(process.argv[2]) : null

  if (exampleNum) {
    runExample(exampleNum).catch(console.error)
  } else {
    runAllExamples().catch(console.error)
  }
}
