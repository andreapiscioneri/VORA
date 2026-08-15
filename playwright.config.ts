import { defineConfig, devices } from '@playwright/test'

// e2e tests run against an already-running dev server (yarn dev + the
// Firestore emulator) — see COMMANDS.md § Tests. No webServer auto-start
// here on purpose: this project's dev server needs the emulator running
// alongside it, which Playwright's single-process webServer option can't
// orchestrate, so tests assume both are already up (same requirement the
// seed script and every curl-based verification in this project already has).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.VORA_E2E_BASE_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
