import { test, expect } from '@playwright/test'
import { clickUntilVisible } from './helpers'

test.use({ storageState: 'e2e/.auth/user.json' })

// §59 critical flow: "Email → AI Classification → Task". A real inbound
// email is recorded via POST /api/communications (direction: 'inbound') —
// the same endpoint an email provider webhook would call in production;
// there's no UI to fabricate an "inbound" message since real ones only
// ever originate from an external provider. From there the flow is all
// real UI: open the AI task-extraction modal (server/services/ai
// heuristically classifies + extracts a deadline from the message body),
// confirm the human-approved suggestion, and verify the resulting task is
// a real, findable record — not just a 200 from the extraction endpoint.
test('inbound email is classified by AI and becomes a real, findable task', async ({ page, baseURL }) => {
  const stamp = Date.now().toString(36)
  const subject = `Preventivo urgente ${stamp}`

  const res = await page.request.post(`${baseURL}/api/communications`, {
    data: {
      channel: 'email',
      direction: 'inbound',
      contactId: null,
      subject,
      body: 'Puoi inviarmi un preventivo entro domani? È piuttosto urgente per noi.',
      status: 'unread',
      sentAt: new Date().toISOString(),
    },
  })
  expect(res.ok()).toBeTruthy()

  await page.goto('/inbox')
  const row = page.locator('div').filter({ hasText: subject }).first()
  const modal = page.locator('[role="dialog"]', { hasText: 'Attività suggerita' })
  await clickUntilVisible(row.getByLabel('Estrai attività'), modal)
  // The heuristic engine should have picked up "urgente" and a deadline
  // ("domani") — assert the explanation actually reflects real analysis,
  // not a canned string.
  await expect(modal.locator('p').first()).toContainText(/urgen|domani/i)

  await modal.getByRole('button', { name: 'Crea attività' }).click()
  await expect(modal).not.toBeVisible()

  await page.goto('/tasks')
  await expect(page.getByText('Preventivo', { exact: false }).first()).toBeVisible()
})
