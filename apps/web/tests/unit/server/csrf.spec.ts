import { describe, expect, it } from 'vitest'
import { createApp, eventHandler, toNodeListener } from 'h3'
import { createServer, type Server } from 'node:http'
import { hasValidOrigin } from '../../../server/utils/csrf'

// hasValidOrigin reads headers/host off the real underlying Node request
// (via h3's getRequestHeader/getRequestHost), so this spins up a throwaway
// h3 app rather than hand-constructing a fake event.
async function withServer(run: (port: number) => Promise<void>) {
  let result = false
  const app = createApp()
  app.use(
    '/',
    eventHandler((event) => {
      result = hasValidOrigin(event)
      return 'ok'
    }),
  )
  const server: Server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as { port: number }).port
  try {
    await run(port)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
  return result
}

describe('hasValidOrigin', () => {
  it('accepts a request with no Origin or Referer header', async () => {
    const result = await withServer((port) => fetch(`http://localhost:${port}/`).then(() => undefined))
    expect(result).toBe(true)
  })

  it('accepts a same-origin Origin header', async () => {
    const result = await withServer((port) => fetch(`http://localhost:${port}/`, { headers: { origin: `http://localhost:${port}` } }).then(() => undefined))
    expect(result).toBe(true)
  })

  it('rejects a cross-site Origin header', async () => {
    const result = await withServer((port) => fetch(`http://localhost:${port}/`, { headers: { origin: 'https://evil.example.com' } }).then(() => undefined))
    expect(result).toBe(false)
  })

  it('rejects a cross-site Referer header when Origin is absent', async () => {
    const result = await withServer((port) =>
      fetch(`http://localhost:${port}/`, { headers: { referer: 'https://evil.example.com/attack.html' } }).then(() => undefined),
    )
    expect(result).toBe(false)
  })

  it('rejects a malformed Origin header', async () => {
    const result = await withServer((port) => fetch(`http://localhost:${port}/`, { headers: { origin: 'not a url' } }).then(() => undefined))
    expect(result).toBe(false)
  })
})
