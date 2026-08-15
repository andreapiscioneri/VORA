import { test, expect } from '@playwright/test'

// §59: "Login → Dashboard" — the most basic critical flow, covering the
// full real stack: registration UI → server validation → Firestore write →
// session cookie → client-side route guard → authenticated dashboard render
// with real (empty-state) data, then a real logout back to the login gate.
test('register creates an account and lands on a real dashboard', async ({ page }) => {
  const stamp = Date.now().toString(36)
  const email = `e2e-${stamp}@vora.test`

  // Nuxt pages are server-rendered; the form HTML exists before Vue finishes
  // hydrating and attaching its v-model listeners. Filling inputs in that
  // window silently drops the typed value from reactive state. Waiting for
  // the network to go idle (JS bundle fetched + executed) avoids that race —
  // see the equivalent comment in contact-task-search.spec.ts for the
  // click-handler variant of the same issue.
  await page.goto('/register')
  await page.waitForLoadState('networkidle')
  await page.locator('#register-name').fill('E2E Tester')
  await page.locator('#register-org').fill(`E2E Org ${stamp}`)
  await page.locator('#register-email').fill(email)
  await page.locator('#register-password').fill('E2ePass1234')
  await page.getByRole('button', { name: 'Crea account' }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Unauthenticated users must never reach the dashboard — verify the
  // route guard actually redirects, not just that login happens to work.
  await page.context().clearCookies()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('login with wrong password is rejected, correct password succeeds', async ({ page }) => {
  const stamp = Date.now().toString(36)
  const email = `e2e-login-${stamp}@vora.test`

  await page.goto('/register')
  await page.waitForLoadState('networkidle')
  await page.locator('#register-name').fill('Login Tester')
  await page.locator('#register-org').fill(`Login Org ${stamp}`)
  await page.locator('#register-email').fill(email)
  await page.locator('#register-password').fill('E2ePass1234')
  await page.getByRole('button', { name: 'Crea account' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.getByRole('button', { name: 'Login Tester' }).click() // user avatar (aria-label = user's name)
  await page.getByText('Esci').click()
  await expect(page).toHaveURL(/\/login/)

  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill('wrong-password')
  await page.getByRole('button', { name: 'Accedi', exact: true }).click()
  await expect(page.getByText('Email o password non corretti')).toBeVisible()

  await page.locator('#login-password').fill('E2ePass1234')
  await page.getByRole('button', { name: 'Accedi', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/)
})
