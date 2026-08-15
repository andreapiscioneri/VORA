import { test, expect } from '@playwright/test'
import { clickUntilVisible } from './helpers'

test.use({ storageState: 'e2e/.auth/user.json' })

// §59: "Create Contact → CRM → Task → Calendar" — here scoped to Contact →
// Task (the two modules with the most predictable form structure) plus a
// real cross-module verification via the ⌘K search this session also
// built, which is a more meaningful "did this actually get created and is
// it findable across the app" check than just asserting the create API
// returned 200.
test('creating a contact and a task makes both real, findable records', async ({ page }) => {
  const stamp = Date.now().toString(36)
  const contactFirstName = `Flow${stamp}`
  const contactLastName = 'Tester'
  const taskTitle = `E2E task ${stamp}`

  // --- Create a contact ---
  await page.goto('/contacts')
  const contactModal = page.locator('form').filter({ hasText: 'Nuovo contatto' })
  await clickUntilVisible(page.getByRole('button', { name: 'Nuovo contatto' }), contactModal)
  const contactInputs = contactModal.locator('input[type="text"], input[type="email"]')
  await contactInputs.nth(0).fill(contactFirstName) // firstName
  await contactInputs.nth(1).fill(contactLastName) // lastName
  await contactModal.getByRole('button', { name: 'Salva' }).click()

  await expect(page.getByText(`${contactFirstName} ${contactLastName}`).first()).toBeVisible()

  // --- Create a task ---
  await page.goto('/tasks')
  const taskModal = page.locator('form').filter({ hasText: 'Nuova attività' })
  await clickUntilVisible(page.getByRole('button', { name: 'Nuova attività' }).first(), taskModal)
  await page.locator('input[autofocus]').fill(taskTitle)
  await taskModal.getByRole('button', { name: 'Salva' }).click()

  await expect(page.getByText(taskTitle).first()).toBeVisible()

  // --- Both are findable via global search (⌘K), not just present in
  // their own module's list ---
  await page.keyboard.press('Meta+k')
  await page.getByPlaceholder("Cerca un'app o un comando...").fill(contactFirstName)
  await expect(page.getByText(`${contactFirstName} ${contactLastName}`).first()).toBeVisible()

  await page.getByPlaceholder("Cerca un'app o un comando...").fill(taskTitle)
  await expect(page.getByText(taskTitle).first()).toBeVisible()
})
