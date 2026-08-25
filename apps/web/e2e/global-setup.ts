import { request } from '@playwright/test'
import { mkdirSync } from 'node:fs'

// Registers exactly ONE shared account for every spec file that doesn't
// specifically need to exercise the register/login UI itself (auth.spec.ts
// does that separately). Going through the real /api/auth/register endpoint
// — not a Firestore backdoor — and saving the resulting session cookie as
// Playwright storageState, so those specs start already authenticated
// instead of re-registering (and re-triggering the real registration rate
// limiter — see server/utils/rateLimit.ts — on every single spec file).
export default async function globalSetup() {
  const baseURL = process.env.VORA_E2E_BASE_URL || 'http://localhost:3100'
  const stamp = Date.now().toString(36)

  const ctx = await request.newContext({ baseURL })
  const res = await ctx.post('/api/auth/register', {
    data: {
      name: 'Shared E2E User',
      email: `e2e-shared-${stamp}@vora.test`,
      password: 'E2ePass1234',
      organizationName: `Shared E2E Org ${stamp}`,
    },
  })
  if (!res.ok()) {
    throw new Error(`e2e global setup: registration failed (${res.status()}) — ${await res.text()}`)
  }

  mkdirSync('e2e/.auth', { recursive: true })
  await ctx.storageState({ path: 'e2e/.auth/user.json' })
  await ctx.dispose()
}
