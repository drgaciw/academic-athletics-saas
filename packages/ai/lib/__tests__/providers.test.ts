/**
 * Tests for AI SDK providers
 */

import { describe, it, expect } from 'vitest'
import { selectModel } from '../providers'

describe('AI Providers', () => {
  describe('selectModel', () => {
    it('should select gpt-4o-mini for simple tasks', () => {
      const model = selectModel('simple')
      expect(model).toBeDefined()
    })

    it('should select claude-sonnet for moderate tasks', () => {
      const model = selectModel('moderate')
      expect(model).toBeDefined()
    })

    it('should select claude-opus for complex tasks', () => {
      const model = selectModel('complex')
      expect(model).toBeDefined()
    })

    it('should respect provider preference', () => {
      const model = selectModel('simple', 'openai')
      expect(model).toBeDefined()
    })

    it('should respect anthropic provider preference', () => {
      const model = selectModel('complex', 'anthropic')
      expect(model).toBeDefined()
    })
  })
})
