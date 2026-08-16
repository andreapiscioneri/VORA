import { createHmac } from 'node:crypto'
import { test, expect } from '@playwright/test'

// §59 critical flow: "WhatsApp → AI Classification → Task" — this test
// exercises the real inbound webhook (server/api/whatsapp/webhook.post.ts),
// not a mock. It needs WHATSAPP_WEBHOOK_SECRET to be the same value on
// both the running dev server and this test process (e.g.
// `WHATSAPP_WEBHOOK_SECRET=xxx yarn dev` in one terminal and
// `WHATSAPP_WEBHOOK_SECRET=xxx yarn test:e2e` in another) — there's no way
// for a test process to read another process's environment. Skips with a
// clear reason when unset rather than silently passing on an untested path.
const secret = process.env.WHATSAPP_WEBHOOK_SECRET

test('inbound WhatsApp webhook rejects an unsigned request and accepts a validly-signed one', async ({ page, baseURL }) => {
  test.skip(!secret, 'WHATSAPP_WEBHOOK_SECRET not set for this test run — see docs/SECURITY.md § WhatsApp inbound webhook')

  const unsigned = await page.request.post(`${baseURL}/api/whatsapp/webhook`, {
    data: { entry: [] },
  })
  expect(unsigned.status()).toBe(401)

  const body = JSON.stringify({
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: 'e2e-test-number' },
              messages: [{ from: '391234567890', type: 'text', text: { body: 'Ciao, mi serve aiuto urgente con un ordine' }, timestamp: String(Math.floor(Date.now() / 1000)) }],
            },
          },
        ],
      },
    ],
  })
  const signature = 'sha256=' + createHmac('sha256', secret!).update(body).digest('hex')

  const signed = await page.request.post(`${baseURL}/api/whatsapp/webhook`, {
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
    data: body,
  })
  expect(signed.ok()).toBeTruthy()
  expect(await signed.json()).toEqual({ received: true })
})
