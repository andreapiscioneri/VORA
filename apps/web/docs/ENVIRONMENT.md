# Environment Variables

Source of truth: [`.env.example`](../.env.example) at the repo root. Copy it to `.env` and fill in only what you actually need — every variable below is optional except where marked **required**.

| Variable | Required? | Purpose | Default / fallback when unset |
|---|---|---|---|
| `NUXT_PUBLIC_APP_NAME` | no | Brand name shown in the UI, `<title>`, manifest | `Vora` |
| `NUXT_PUBLIC_APP_URL` | no | Canonical app URL, used in meta tags / links | `http://localhost:3100` |
| `NUXT_SESSION_PASSWORD` | **yes** in production | Encrypts the session cookie (`nuxt-auth-utils`) — must be 32+ random characters | Auto-generated once by `nuxt-auth-utils` on first `yarn dev` and written into `.env` — fine for local dev, **must** be set explicitly (and kept secret) in production |
| `FIRESTORE_EMULATOR_HOST` | no (dev only) | Points `firebase-admin` at the local Firestore emulator instead of a real project | Unset in production — do not set this outside local dev |
| `FIREBASE_PROJECT_ID` | **yes** | Firestore project id | `vora-dev` (matches the emulator's default project) |
| `FIREBASE_CLIENT_EMAIL` | **yes** in production | Service-account email, for `firebase-admin` to authenticate against the real Firestore project | Not needed with the emulator |
| `FIREBASE_PRIVATE_KEY` | **yes** in production | Service-account private key (from the downloaded JSON) | Not needed with the emulator |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL` | no (all four together) | Enables `GmailEmailProvider` — real sending via the Gmail API | Unset → `MockEmailProvider` (records sends locally, nothing sent). See [EMAIL.md](./EMAIL.md) for how to obtain `GMAIL_REFRESH_TOKEN`. |
| `WHATSAPP_API_KEY` | no | Enables a real `WhatsAppProvider` instead of the mock | Unset → `MockWhatsAppProvider` |
| `WHATSAPP_WEBHOOK_SECRET` | no | Validates inbound WhatsApp webhook signatures — only relevant once a real provider is wired up | N/A while using the mock |
| `AI_API_KEY` | no | Enables a real LLM-backed `AIService` instead of the heuristic engine | Unset → `HeuristicAIService` (rule-based, no network call) |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | no | Enables "Continue with Google" (`nuxt-auth-utils`) | Unset → `GET /api/auth/google` cleanly redirects to `/login?error=oauth_failed`; email/password login still works |

## Production-only variables

`FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` come from a downloaded Firebase service-account JSON (`.secrets/firebase-adminsdk.json` in this repo, gitignored — never commit it or paste its contents anywhere). See [DATABASE.md](./DATABASE.md#pointing-at-the-real-firebase-project) for how to point the app at the real `vora-piscioneri` project instead of the local emulator.

## What's deliberately NOT here

No `AUTH_SECRET` separate from `NUXT_SESSION_PASSWORD` — `nuxt-auth-utils` owns session encryption end-to-end, there's no second auth layer to configure. No third-party AI/email/WhatsApp credentials are invented or pre-filled — every one of `AI_API_KEY` / `GMAIL_*` / `WHATSAPP_API_KEY` is genuinely optional and the app runs completely functionally without any of them, using the mock/heuristic implementations described in [AI.md](./AI.md) and [EMAIL.md](./EMAIL.md).
