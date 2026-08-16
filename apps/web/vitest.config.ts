import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit tests for pure/self-contained server & shared logic (validation
// schemas, rate limiting, auth tokens). Full request/response flows are
// covered by the Playwright e2e suite (see e2e/) instead of mocking Nitro's
// whole request pipeline here.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
  },
})
