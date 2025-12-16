import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'services/*/vitest.config.ts',
  'packages/*/vitest.config.ts',
  'apps/*/vitest.config.ts',
])
