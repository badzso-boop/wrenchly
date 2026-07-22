import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['__tests__/integration/**/*.test.ts'],
    globals: true,
    // Real Postgres round-trips are slower than mocked unit tests, and running
    // them in parallel against the same database risks cross-test interference.
    fileParallelism: false,
  },
})
