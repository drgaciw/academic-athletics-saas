/**
 * System Test
 * 
 * Validates that all components are working correctly
 */

import {
  createAgent,
  createOrchestrator,
  globalToolRegistry,
  getToolsForAgentType,
  getUserPermissions,
} from '../index'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

const results: TestResult[] = []

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    const startTime = Date.now()
    try {
      await fn()
      results.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      })
      console.log(`✅ ${name}`)
    } catch (error) {
      results.push({
        name,
        passed: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      })
      console.log(`❌ ${name}`)
      console.error(`   Error: ${(error as Error).message}`)
    }
  }
}

/**
 * Test 1: Tool Registry
 */
const test1 = test('Tool Registry - All tools registered', () => {
  const allTools = globalToolRegistry.getAll()
  if (allTools.length !== 26) {
    throw new Error(`Expected 26 tools, got ${allTools.length}`)
  }
})

/**
 * Test 2: Tool Categories
 */
const test2 = test('Tool Registry - Tools by category', () => {
  const studentDataTools = globalToolRegistry.getByCategory('student_data')
  const complianceTools = globalToolRegistry.getByCategory('compliance')
  const advisingTools = globalToolRegistry.getByCategory('advising')
  const adminTools = globalToolRegistry.getByCategory('administrative')

  if (studentDataTools.length !== 5) {
    throw new Error(`Expected 5 student data tools, got ${studentDataTools.length}`)
  }
  if (complianceTools.length !== 5) {
    throw new Error(`Expected 5 compliance tools, got ${complianceTools.length}`)
  }
  if (advisingTools.length !== 6) {
    throw new Error(`Expected 6 advising tools, got ${advisingTools.length}`)
  }
  if (adminTools.length !== 6) {
    throw new Error(`Expected 6 admin tools, got ${adminTools.length}`)
  }
})

/**
 * Test 3: Agent Creation
 */
const test3 = test('Agents - Create all agent types', () => {
  const agentTypes: Array<'advising' | 'compliance' | 'intervention' | 'administrative' | 'general'> = [
    'advising',
    'compliance',
    'intervention',
    'administrative',
    'general',
  ]

  for (const type of agentTypes) {
    const agent = createAgent(type)
    if (!agent) {
      throw new Error(`Failed to create ${type} agent`)
    }
    if (agent.type !== type) {
      throw new Error(`Agent type mismatch: expected ${type}, got ${agent.type}`)
    }
  }
})

/**
 * Test 4: Tool-to-Agent Mappings
 */
const test4 = test('Agents - Tool mappings', () => {
  const advisingTools = getToolsForAgentType('advising')
  const complianceTools = getToolsForAgentType('compliance')
  const interventionTools = getToolsForAgentType('intervention')
  const adminTools = getToolsForAgentType('administrative')
  const generalTools = getToolsForAgentType('general')

  if (advisingTools.length !== 11) {
    throw new Error(`Expected 11 advising tools, got ${advisingTools.length}`)
  }
  if (complianceTools.length !== 10) {
    throw new Error(`Expected 10 compliance tools, got ${complianceTools.length}`)
  }
  if (interventionTools.length !== 11) {
    throw new Error(`Expected 11 intervention tools, got ${interventionTools.length}`)
  }
  if (adminTools.length !== 10) {
    throw new Error(`Expected 10 admin tools, got ${adminTools.length}`)
  }
  if (generalTools.length !== 9) {
    throw new Error(`Expected 9 general tools, got ${generalTools.length}`)
  }
})

/**
 * Test 5: Permission System
 */
const test5 = test('Security - Permission system', () => {
  const advisorPerms = getUserPermissions(['advisor'])
  const studentPerms = getUserPermissions(['student'])
  const adminPerms = getUserPermissions(['admin'])

  if (!advisorPerms.includes('read:student')) {
    throw new Error('Advisor should have read:student permission')
  }
  if (!studentPerms.includes('read:courses')) {
    throw new Error('Student should have read:courses permission')
  }
  if (!adminPerms.includes('write:email')) {
    throw new Error('Admin should have write:email permission')
  }
})

/**
 * Test 6: Tool Permission Filtering
 */
const test6 = test('Security - Tool permission filtering', () => {
  const studentTools = globalToolRegistry.getToolsForUser(
    ['read:student', 'read:courses'],
    ['getStudentProfile', 'sendEmail']
  )

  // Student should only get getStudentProfile, not sendEmail
  if (studentTools.length !== 1) {
    throw new Error(`Expected 1 tool for student, got ${studentTools.length}`)
  }
  if (studentTools[0].name !== 'getStudentProfile') {
    throw new Error(`Expected getStudentProfile, got ${studentTools[0].name}`)
  }
})

/**
 * Test 7: Orchestrator Creation
 */
const test7 = test('Orchestrator - Create instance', () => {
  const orchestrator = createOrchestrator()
  if (!orchestrator) {
    throw new Error('Failed to create orchestrator')
  }
})

/**
 * Test 8: Orchestrator Configuration
 */
const test8 = test('Orchestrator - Custom configuration', () => {
  const orchestrator = createOrchestrator({
    autoRoute: false,
    enableMultiAgent: false,
    maxAgentsPerWorkflow: 5,
    executionTimeout: 120000,
    enableFallback: false,
  })

  if (!orchestrator) {
    throw new Error('Failed to create orchestrator with custom config')
  }
})

/**
 * Test 9: Workflow Suggestion
 */
const test9 = test('Orchestrator - Workflow suggestion', () => {
  const orchestrator = createOrchestrator()

  const workflow1 = orchestrator.suggestWorkflow(
    'I need courses but check eligibility first'
  )
  if (!workflow1 || !workflow1.includes('compliance') || !workflow1.includes('advising')) {
    throw new Error('Should suggest compliance + advising workflow')
  }

  const workflow2 = orchestrator.suggestWorkflow(
    'What is the Athletic Academics Hub?'
  )
  if (workflow2 !== null) {
    throw new Error('Should not suggest multi-agent workflow for simple query')
  }
})

/**
 * Test 10: Tool Execution (Mock)
 */
const test10 = test('Tools - Execute tool with mock data', async () => {
  const tool = globalToolRegistry.get('getStudentProfile')
  if (!tool) {
    throw new Error('getStudentProfile tool not found')
  }

  const result = await tool.execute(
    { studentId: 'S12345' },
    {
      userId: 'S12345',
      userRoles: ['student'],
      agentState: {} as any,
    }
  )

  if (!result || !result.id) {
    throw new Error('Tool execution failed or returned invalid data')
  }
})

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║           AI Agent System - System Tests                  ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  const tests = [
    test1,
    test2,
    test3,
    test4,
    test5,
    test6,
    test7,
    test8,
    test9,
    test10,
  ]

  for (const testFn of tests) {
    await testFn()
  }

  console.log('\n' + '═'.repeat(60))
  console.log('Test Results')
  console.log('═'.repeat(60))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total Duration: ${totalDuration}ms`)

  if (failed > 0) {
    console.log('\nFailed Tests:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`)
        console.log(`    Error: ${r.error}`)
      })
  }

  console.log('\n' + '═'.repeat(60))

  if (failed === 0) {
    console.log('\n🎉 All tests passed! System is working correctly.\n')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n')
    process.exit(1)
  }
}

// Export for use in other files
export { runTests, results }

// Run if executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test suite failed:', error)
    process.exit(1)
  })
}
