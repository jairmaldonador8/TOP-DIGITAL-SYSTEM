import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Config dedicada para tests de integracion (npm run test:rls).
// Corre en entorno node contra el proyecto Supabase real; excluida del `npm test` normal.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
