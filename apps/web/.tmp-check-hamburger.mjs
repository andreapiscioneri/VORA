import { chromium } from '@playwright/test'

const stamp = Date.now().toString(36)
const email = `e2e-hamburger-${stamp}@vora.test`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.setViewportSize({ width: 390, height: 844 })

await page.goto('http://localhost:3100/register')
await page.waitForLoadState('networkidle')
await page.locator('#register-name').fill('Hamburger Tester')
await page.locator('#register-org').fill(`Hamburger Org ${stamp}`)
await page.locator('#register-email').fill(email)
await page.locator('#register-password').fill('E2ePass1234')
await page.getByRole('button', { name: 'Crea account' }).click()
await page.waitForURL(/\/dashboard/)
await page.waitForLoadState('networkidle')

await page.screenshot({ path: '/tmp/before-click.png' })

const sidebarBeforeVisible = await page.locator('aside').isVisible()
console.log('sidebar visible before click:', sidebarBeforeVisible)

await page.getByRole('button', { name: 'Menu' }).click()
await page.waitForTimeout(400)

await page.screenshot({ path: '/tmp/after-click.png' })
const sidebarAfterVisible = await page.locator('aside').isVisible()
console.log('sidebar visible after click:', sidebarAfterVisible)

await browser.close()
