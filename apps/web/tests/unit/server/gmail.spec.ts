import { describe, expect, it, vi } from 'vitest'
import { buildMimeMessage, isRetryable } from '../../../server/services/email/gmail'

describe('buildMimeMessage', () => {
  it('includes both a plain-text and an HTML part', async () => {
    const mime = await buildMimeMessage('sender@vora.test', {
      to: 'user@example.com',
      subject: 'Hello',
      body: 'Line one.\n\nLine two.',
    })

    expect(mime).toContain('Content-Type: multipart/alternative')
    expect(mime).toContain('Content-Type: text/plain; charset="UTF-8"')
    expect(mime).toContain('Content-Type: text/html; charset="UTF-8"')
    expect(mime).toContain('Line one.\n\nLine two.')
    expect(mime).toContain('<p style="margin:0 0 16px;">Line one.</p>')
    expect(mime).toContain('To: user@example.com')
  })

  it('escapes HTML-significant characters in the HTML part only', async () => {
    const mime = await buildMimeMessage('sender@vora.test', {
      to: 'user@example.com',
      subject: 'Subject',
      body: 'Reply <noreply@vora.test> & confirm',
    })

    // Plain-text part keeps the raw characters.
    expect(mime).toContain('Reply <noreply@vora.test> & confirm')
    // HTML part escapes them.
    expect(mime).toContain('Reply &lt;noreply@vora.test&gt; &amp; confirm')
  })

  it('base64-encodes the subject for MIME safety', async () => {
    const mime = await buildMimeMessage('sender@vora.test', {
      to: 'user@example.com',
      subject: 'Città — città',
      body: 'x',
    })

    expect(mime).toMatch(/^Subject: =\?UTF-8\?B\?/m)
  })

  it('wraps the message in multipart/mixed and base64-encodes each attachment when attachments are present', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/pdf' },
      arrayBuffer: async () => new TextEncoder().encode('%PDF-1.4 fake content').buffer,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const mime = await buildMimeMessage('sender@vora.test', {
      to: 'user@example.com',
      subject: 'Hello',
      body: 'x',
      attachments: [{ title: 'invoice.pdf', url: 'https://files.example.com/invoice.pdf' }],
    })

    expect(fetchMock).toHaveBeenCalledWith('https://files.example.com/invoice.pdf', expect.anything())
    expect(mime).toContain('Content-Type: multipart/mixed')
    expect(mime).toContain('Content-Type: multipart/alternative')
    expect(mime).toContain('Content-Disposition: attachment; filename="invoice.pdf"')
    expect(mime).toContain(Buffer.from('%PDF-1.4 fake content').toString('base64'))

    vi.unstubAllGlobals()
  })

  it('rejects when an attachment fetch fails, without swallowing the error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, headers: { get: () => null }, arrayBuffer: async () => new ArrayBuffer(0) })))

    await expect(
      buildMimeMessage('sender@vora.test', {
        to: 'user@example.com',
        subject: 'Hello',
        body: 'x',
        attachments: [{ title: 'missing.pdf', url: 'https://files.example.com/missing.pdf' }],
      }),
    ).rejects.toThrow()

    vi.unstubAllGlobals()
  })
})

describe('isRetryable', () => {
  it('treats rate limiting and server errors as retryable', () => {
    expect(isRetryable({ code: 429 })).toBe(true)
    expect(isRetryable({ code: 500 })).toBe(true)
    expect(isRetryable({ status: 503 })).toBe(true)
  })

  it('treats client errors and unknown shapes as non-retryable', () => {
    expect(isRetryable({ code: 400 })).toBe(false)
    expect(isRetryable({ code: 401 })).toBe(false)
    expect(isRetryable(new Error('boom'))).toBe(false)
    expect(isRetryable(undefined)).toBe(false)
  })
})
