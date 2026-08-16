import type { Locator } from '@playwright/test'

// Nuxt pages are server-rendered, so a button's HTML exists before Vue
// finishes hydrating and attaching its @click listener. A click landing in
// that window is a no-op (native SSR element, no handler yet) — this shows
// up as a flaky "nothing happened" timeout on whatever the click should
// have opened. Retry the click until the expected effect actually appears.
export async function clickUntilVisible(trigger: Locator, verify: Locator, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await trigger.click()
    try {
      await verify.waitFor({ state: 'visible', timeout: 1000 })
      return
    } catch {
      // hydration hadn't attached the handler yet — try again
    }
  }
  await verify.waitFor({ state: 'visible', timeout: 1000 })
}
