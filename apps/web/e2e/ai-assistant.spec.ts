import { test, expect } from '@playwright/test'
import { clickUntilVisible } from './helpers'

test.use({ storageState: 'e2e/.auth/user.json' })

// §59: "AI Assistant" critical flow. The assistant answers a fixed set of
// real questions against live data (see docs/AI.md) rather than free-form
// chat — this test proves a real answer renders, not that a canned string
// exists in the template.
test('AI assistant answers a real question with live data', async ({ page }) => {
  await page.goto('/dashboard')

  await clickUntilVisible(page.getByRole('button', { name: 'Assistente', exact: true }), page.getByText('Assistente VORA'))

  await clickUntilVisible(page.getByRole('button', { name: /organizza/i }), page.getByText('Ecco la tua giornata'))
  // This shared account has no appointments/events scheduled for today —
  // the assistant must say so honestly rather than showing a blank panel.
  await expect(page.getByText('Nessun impegno in programma per oggi')).toBeVisible()
})
