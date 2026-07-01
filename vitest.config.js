import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Logic modules are pure and run in the default node environment.
// Component tests opt into jsdom per-file via `// @vitest-environment jsdom`.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
