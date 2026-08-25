# Email

## Abstraction

`server/services/email/types.ts` defines the `EmailProvider` interface:

```ts
interface EmailProvider {
  readonly name: string
  send(input: { to: string; subject: string; body: string }): Promise<{ success: boolean; providerId: string; providerMessageId: string }>
}
```

No `server/api/*` route sends email directly — every call site (password reset, email verification, marketing campaigns, ticket/inbox communications, automations) goes through `getEmailProvider()` (`server/services/email/index.ts`), a factory that returns:

- **`MockEmailProvider`** (`mock.ts`) when Gmail credentials are unset — the default. Logs the send to the server console (`[mock email] to=... subject="..."`), makes no network call.
- **`GmailEmailProvider`** (`gmail.ts`) when all four `GMAIL_*` env vars below are set — sends real mail through the Gmail API.

Swapping providers requires no change to any caller — they only ever see `{to, subject, body}` in, `{success, providerId, providerMessageId}` out.

## `GmailEmailProvider`

Authenticates as a single fixed sender (`andrypiscioneri@gmail.com` in production) using a long-lived OAuth2 refresh token, and calls `gmail.users.messages.send` (`googleapis` package) with a `multipart/alternative` RFC 2822 message: a plain-text part (the caller's `body` verbatim) and an HTML part (the same body run through a small branded template — paragraph/line-break conversion, no caller changes needed to get real-looking HTML mail).

Retries up to 3 times with a linear backoff (500ms, 1000ms) on transient failures (HTTP 429 or 5xx) — not on permanent ones (bad address, revoked auth), where retrying can't help. `send()` never throws: every caller `await`s it without a try/catch, on the deliberate principle (see the comment in `server/api/auth/register.post.ts`) that a mail-provider hiccup must never block the underlying action (registration, password reset, etc.) — a failure after retries is logged server-side and returned as `{success: false}`.

This is a distinct OAuth2 client/flow from the user-login "Continue with Google" button (`server/api/auth/google.get.ts`, via `nuxt-auth-utils`): that one is per-user, requests only `email profile`, and isn't exposed as a reusable token for other API calls. Sending mail needs the `gmail.send` scope and a token tied to one specific mailbox, which is why it has its own setup below — though it can reuse the *same* Google Cloud OAuth client (Client ID/Secret), just with an additional authorized redirect URI.

## Setting up real sending (one-time, needs the account owner)

Requesting the `gmail.send` scope requires a live browser consent from `andrypiscioneri@gmail.com` — this cannot be scripted or done on someone's behalf, the same way `firebase login` or `gcloud auth login` can't be. `scripts/gmail-oauth-setup.mjs` automates everything *except* that one click.

1. **Reuse the existing Google Cloud OAuth client** (the one already created for "Continue with Google" — see the Client ID in `apps/web/.env`, `NUXT_OAUTH_GOOGLE_CLIENT_ID`). In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → that OAuth client → add `http://localhost:8976/oauth2callback` to **Authorized redirect URIs** (alongside the existing `http://localhost:3100/api/auth/google`), then Save.
2. If the OAuth consent screen is still in **Testing** mode (likely, for a project this new), add `andrypiscioneri@gmail.com` under **Audience → Test users** if it isn't already there — otherwise Google will refuse to complete the consent for an unverified app.
3. Run the helper script from `apps/web/`:
   ```bash
   GMAIL_OAUTH_CLIENT_ID=<the same Client ID> GMAIL_OAUTH_CLIENT_SECRET=<the same Client Secret> node scripts/gmail-oauth-setup.mjs
   ```
4. Open the printed URL, sign in as `andrypiscioneri@gmail.com`, and approve the "Send email on your behalf" permission. The script catches the redirect automatically and prints four lines:
   ```
   GMAIL_CLIENT_ID=...
   GMAIL_CLIENT_SECRET=...
   GMAIL_REFRESH_TOKEN=...
   GMAIL_SENDER_EMAIL=andrypiscioneri@gmail.com
   ```
5. Paste those into `apps/web/.env` for local dev, and/or into the Netlify site's environment variables for production (see [DEPLOYMENT.md](./DEPLOYMENT.md)) — `getEmailProvider()` picks up `GmailEmailProvider` automatically once all four are present, no restart-specific code change needed.

If the script reports "Google did not return a refresh_token", the account already has an active grant for this exact client from a previous run — remove it at [myaccount.google.com/permissions](https://myaccount.google.com/permissions) and run the script again (`prompt: 'consent'` in the script normally forces a fresh one, but Google's behavior here is stricter for previously-granted clients).

## Verifying it worked

Trigger any real send-site while `GMAIL_*` is configured — e.g. `POST /api/auth/forgot-password` with a real account's email — and check the inbox at `andrypiscioneri@gmail.com`'s Sent folder, or the recipient's inbox. `GET /api/settings/status` also reports `{ provider: 'gmail', live: true }` once configured (`live: false` under the mock provider).
