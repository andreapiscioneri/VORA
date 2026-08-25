#!/usr/bin/env node
// One-time interactive helper that obtains a Gmail OAuth2 refresh token for
// GmailEmailProvider (server/services/email/gmail.ts) — see docs/EMAIL.md.
//
// This must be run by a human in a browser (it opens Google's consent
// screen for you to approve as andrypiscioneri@gmail.com) — it cannot be
// automated or run on someone's behalf, the same way `gcloud auth login`
// or `firebase login` can't be.
//
//   GMAIL_OAUTH_CLIENT_ID=... GMAIL_OAUTH_CLIENT_SECRET=... node scripts/gmail-oauth-setup.mjs
//
// Prints the resulting GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET /
// GMAIL_REFRESH_TOKEN / GMAIL_SENDER_EMAIL lines to paste into apps/web/.env
// (local dev) or the Netlify site's environment variables (production).

import { createServer } from 'node:http'
import { google } from 'googleapis'

const PORT = 8976
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`

const clientId = process.env.GMAIL_OAUTH_CLIENT_ID
const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('Set GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET first — see docs/EMAIL.md § 1.')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // required to receive a refresh_token, not just a short-lived access_token
  prompt: 'consent', // forces the consent screen even if this client was already approved before, which is also what forces a *new* refresh_token to be issued
  scope: ['https://www.googleapis.com/auth/gmail.send'],
})

console.log('\nOpen this URL and sign in as the Gmail account VORA should send from:\n')
console.log(authUrl)
console.log(`\nWaiting for the redirect back to ${REDIRECT_URI} ...\n`)

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI)
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end()
    return
  }

  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(`<p>Consent denied: ${error}. Close this tab and try again.</p>`)
    console.error(`\nGoogle returned an error: ${error}`)
    server.close(() => process.exit(1))
    return
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.writeHead(200, { 'Content-Type': 'text/html' }).end('<p>Done — you can close this tab and go back to the terminal.</p>')

    if (!tokens.refresh_token) {
      console.error(
        '\nGoogle did not return a refresh_token. This happens when the account already granted consent to this exact client before — go to https://myaccount.google.com/permissions, remove access for this app, then run this script again.',
      )
      server.close(() => process.exit(1))
      return
    }

    console.log('\nSuccess. Add these to apps/web/.env (local) or your Netlify site\'s environment variables (production):\n')
    console.log(`GMAIL_CLIENT_ID=${clientId}`)
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`)
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('GMAIL_SENDER_EMAIL=andrypiscioneri@gmail.com\n')
  } catch (err) {
    console.error('\nFailed to exchange the authorization code for tokens:', err instanceof Error ? err.message : err)
  } finally {
    server.close(() => process.exit(0))
  }
})

server.listen(PORT)
