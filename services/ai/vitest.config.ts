import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/**'],
    },
  },
  resolve: {
    alias: {
      '@aah/database': path.resolve(__dirname, '../../packages/database/src'),
      '@aah/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@aah/api-utils': path.resolve(__dirname, '../../packages/api-utils/src'),
      '@aah/config': path.resolve(__dirname, '../../packages/config/src'),
      '@aah/ai': path.resolve(__dirname, '../../packages/ai/src'),
    },
  },
})
