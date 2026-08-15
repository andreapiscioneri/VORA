# Security

## Authentication

Email/password only, via [`nuxt-auth-utils`](https://github.com/atinux/nuxt-auth-utils) — sealed, HTTP-only session cookies (no JWT in local storage, no manual token handling on web).

- **Register** (`POST /api/auth/register`) — creates a `User`, an `Organization`, and an `OrganizationMember` (role `owner`) in one call; password hashed with `hashPassword` (auto-imported by `nuxt-auth-utils`, scrypt-based).
- **Login** (`POST /api/auth/login`) — `verifyCredentials()` then `setUserSession()`.
- **Logout** (`POST /api/auth/logout`) — `clearUserSession()`.
- **Session check** (`GET /api/auth/me`) — returns `{ user: session.user ?? null }`, used by both the web route guard and the mobile `AuthContext` on mount.

- **Email verification** — `User.emailVerified` (default `false`), a one-time hashed token (`server/utils/authTokens.ts`, sha256, 24h TTL, deleted on use) sent via the existing `EmailProvider` abstraction on registration. Verification is non-blocking — an unverified user can still use the app, with a dismissible-once-verified banner (`components/layout/VerifyEmailBanner.vue`) and a resend action (`POST /api/auth/resend-verification`, rate-limited). If the click happens in the same browser that registered, the session updates immediately (`setUserSession` inside `POST /api/auth/verify-email`); otherwise it takes effect on next login, same reasoning as the role-change note above.
- **Password reset** — `POST /api/auth/forgot-password` always returns `{ success: true }` regardless of whether the email exists (prevents account-enumeration), issuing a 1-hour token only when it does. `POST /api/auth/reset-password` consumes the token and calls the same `hashPassword` used at registration. Pages: [`/forgot-password`](../pages/forgot-password.vue), [`/reset-password`](../pages/reset-password.vue), [`/verify-email`](../pages/verify-email.vue).
- **Local dev without a real email provider**: `MockEmailProvider` (`server/services/email/mock.ts`) prints the full email — including the verification/reset link — to the server console. That's how you read these links in local dev; the same code path sends for real once `EMAIL_PROVIDER_API_KEY` is configured, no other changes needed.

Verified via `curl`, full round-trip: register → grab the real link from the mock provider's console output → verify (confirmed `emailVerified: true` on `/api/auth/me`, confirmed the same token rejected on reuse) → forgot-password (confirmed identical `200` response for an existing vs. nonexistent email) → reset-password → confirmed the old password now rejected and the new one accepted.

## OAuth

`GET /api/auth/google` (`server/api/auth/google.get.ts`) — real, working `nuxt-auth-utils` OAuth handler (`defineOAuthGoogleEventHandler`), not a stub. Signs in an existing account (marking its email verified — Google already vouches for it) or creates a fresh user + organization for a first-time Google sign-in, with a random password hash the user never sees or needs (they can set a real one later via password reset if they want one). Wired into real "Continue with Google" buttons on both [`/login`](../pages/login.vue) and [`/register`](../pages/register.vue).

**No credentials are invented.** Without `NUXT_OAUTH_GOOGLE_CLIENT_ID`/`NUXT_OAUTH_GOOGLE_CLIENT_SECRET` set (see `.env.example`), `nuxt-auth-utils` itself detects the missing config and cleanly redirects to `/login?error=oauth_failed` — verified live: `curl -i /api/auth/google` returns a `302` to that URL with no server error, and the login page renders the translated error message. Get real values from the Google Cloud Console (APIs & Services → Credentials → OAuth client ID → Web application) to make it live — same pattern as every other optional provider (AI, email, WhatsApp): the integration is complete, it just has no third-party account behind it yet.

Only Google is wired up (§47 also mentions Microsoft) — `nuxt-auth-utils` ships the same handler shape for other providers, so adding Microsoft later is a second file following this one's pattern, not new architecture.

## WhatsApp inbound webhook

`GET /api/whatsapp/webhook` and `POST /api/whatsapp/webhook` (`server/api/whatsapp/webhook.get.ts` / `.post.ts`) — real handlers for Meta's WhatsApp Business Cloud API webhook, not stubs, written against the actual documented payload/verification shapes. Like OAuth, this has **never been exercised against a live Meta webhook** — no WhatsApp Business API account is configured for this project — but the code would function correctly against a real one.

- **Verification handshake** (`GET`): when you register this endpoint's URL in the Meta App Dashboard, Meta calls it once with `hub.mode=subscribe`, `hub.verify_token`, and `hub.challenge`. The handler compares `hub.verify_token` against `WHATSAPP_WEBHOOK_SECRET` (`.env.example`) and echoes back `hub.challenge` on a match, `403` otherwise.
- **Inbound messages** (`POST`): every payload must carry a valid `X-Hub-Signature-256` header — HMAC-SHA256 of the *raw* request body keyed with `WHATSAPP_WEBHOOK_SECRET` (Meta's real signing scheme, using the Meta App Secret). Missing or mismatched signatures get `401` before the body is even parsed as JSON. Once verified, `entry[].changes[].value.messages[]` is walked defensively (Meta's shape is deeply nested and can carry message types this code doesn't special-case) — anything unrecognized is skipped rather than thrown, and the handler always returns `200` on a validly-signed request, matching Meta's requirement that webhooks ack fast or get disabled after repeated failures.
- **Tenant routing**: unlike email (routed by a per-user inbox) or OAuth (no routing needed), an inbound WhatsApp message has to be matched to the right organization with no logged-in session to read it from. Meta's payload includes `metadata.phone_number_id` — the Business phone number that received the message — so `Organization.whatsappPhoneNumberId` (`shared/types/user.ts`) stores which org owns which number, looked up via `findOrganizationByWhatsAppPhoneNumberId()` (`server/utils/auth.ts`). A message for a number no org has connected yet is dropped (still `200`-acked) rather than guessing a tenant. **Real gap**: there's no UI/API yet to let an org actually set `whatsappPhoneNumberId` — same class of gap as "no invite-a-member flow" noted under Authorization below. On a match, a `Communication` is created via the existing `createCommunication()` (`server/utils/communications.ts`) with `channel: 'whatsapp'`, `direction: 'inbound'`.
- Outbound send (`server/services/whatsapp/`) already existed before this webhook; see `mock.ts` for why it stays mocked until real `WHATSAPP_API_KEY` credentials exist.

## Route protection

**Web**: `server/middleware/auth.ts` is global Nitro middleware — every `/api/*` request is rejected with 401 unless it matches a session or an explicit public prefix:

```ts
PUBLIC_PREFIXES = ['/api/auth/', '/api/microsites/public/', '/api/_auth/']
```

(`/api/_auth/` had to be added after discovering it broke `nuxt-auth-utils`'s own internal session-management route — without it, the client-side `useUserSession().clear()` call itself got 401'd by the app's own middleware, silently breaking logout.)

Client-side, `middleware/auth.global.ts` redirects to `/login?redirect=<path>` when `!loggedIn.value`, stripping i18n locale prefixes before checking against public routes.

**Mobile**: `app/_layout.tsx`'s `RootStack` uses `useSegments()`/`useRouter()` to redirect to `/login` when `!user` (and away from `/login` back to `/` once authenticated) — see [MOBILE.md § Authentication](./MOBILE.md#authentication).

## Tenant isolation

Every protected API route calls `requireOrgId(event)` (`server/utils/auth.ts`) and threads the returned `organizationId` into every Firestore read/write. Ownership mismatches return **404, not 403** — see [DATABASE.md § Multi-tenancy](./DATABASE.md#multi-tenancy) for why.

This was verified end-to-end, not just written and assumed correct: two separate organizations were registered, Org A created a contact/task/etc., and it was confirmed via direct `curl` calls that Org B (a different, freshly-registered organization) cannot list it, cannot `GET` it by known ID (404), cannot `DELETE` it by known ID (404), and that Org A's data survives the attempted cross-tenant deletion attempt — plus a browser-level UI check that the same holds through the actual app, not just the raw API.

**A real gap in that original verification was found and fixed while writing this documentation**: five `server/utils/*.ts` list functions — `appointments.ts`, `employees.ts`, `expenses.ts`, `knowledge.ts`, `leave.ts` — used `.orderBy(<domain field>).get()` instead of `.where('organizationId', '==', organizationId).get()`, meaning `listAppointments`/`listEmployees`/`listExpenses`/`listDocuments`/`listLeaveRequests` returned **every organization's data**, not just the caller's, despite each route correctly calling `requireOrgId(event)` first. The bulk regex script used to add org-scoping across all modules (see conversation history) only matched the common `.collection(COLLECTION).get()` shape; these five used `.collection(COLLECTION).orderBy(field, dir).get()` instead, which the script's pattern didn't catch, and it went unverified because the original cross-tenant `curl` test above only exercised `contacts`/`tasks` directly. All five are now fixed and individually re-verified with the same cross-tenant `curl` methodology (create as Org A, list as Org B, confirm empty). This is exactly the kind of bug that "looks done" from route-level code review (the route calls `requireOrgId`) but isn't, until the actual query is checked — worth remembering when auditing any *new* module added later.

## Authorization (RBAC)

`OrgRole` (`owner` / `admin` / `member`) is enforced via `requireRole(event, allowedRoles)` (`server/utils/auth.ts`) — layered on top of `requireOrgId`'s between-tenant isolation, this is *within*-tenant authorization. Scope, deliberately not exhaustive:

- **Employee management** (`POST/PUT/DELETE /api/employees`) — owner/admin only. A regular member shouldn't be able to add or remove headcount records.
- **Leave/expense approval** — `PUT /api/leave-requests/:id` and `PUT /api/expenses/:id` compare the incoming `status` against the existing record's status; a role check (`owner`/`admin`) only fires when the status is actually changing (i.e. an approve/reject action). Editing your own still-pending request's content — dates, notes — stays open to any member, matching how the existing UI's "edit" and "approve/reject" buttons both hit the same `PUT` endpoint.

Verified via `curl`: a membership was flipped from `owner` to `member` directly in the emulator, then re-logged-in (role is baked into the sealed session cookie at login time — a role change takes effect on the *next* login, not instantly; see below) — the member could still create their own leave request and edit it while pending, but got a real `403` both creating an employee and approving their own leave request.

**Why role changes aren't instant**: `SessionUser.role` is part of the encrypted session cookie set at login (`server/api/auth/login.post.ts`), not re-fetched from Firestore on every request — that's the same reason the cookie carries `organizationId`, `organizationName`, etc. without a database round-trip on every single API call. A demoted/promoted user's session reflects the change after their next login. This is a real, intentional tradeoff (session cookie performance vs. instant role propagation), not an oversight — flagged here so it isn't mistaken for a bug if you test a role change and don't see it apply mid-session.

**Not covered by role checks** (deliberately, to avoid restricting normal work): creating/editing/deleting your own contacts, tasks, projects, tickets, etc. — every organization member has full CRUD there, same as before. There's also no "invite a member" flow yet (every registration creates a new organization with the registering user as `owner`) — adding a second member to an existing organization currently has no UI or API, which is a real gap worth noting alongside this.

## Mobile session cookies

Two real bugs were found and fixed while verifying mobile authentication end-to-end in the iOS Simulator — both worth documenting because they're the kind of thing that looks like it works (the login screen navigates past the auth gate) while silently not actually authenticating subsequent requests:

1. **`mobile/lib/api.ts` was missing `credentials: 'include'`** on its `fetch()` calls. React Native's `fetch` does not automatically send or persist cookies without it — the login response body updated the UI's local state optimistically (so the redirect past the login gate *looked* successful), but no cookie was ever actually stored, so the very next authenticated request (`GET /api/tasks`) came back `401`.
2. **The session cookie was marked `Secure` by default** (h3's `useSession()` hardcodes `secure: true` unless overridden). Browsers and `curl` treat `http://localhost` as a "potentially trustworthy origin" and send `Secure` cookies to it anyway — but iOS's `NSHTTPCookieStorage` does not grant that same exemption to arbitrary native apps, and silently drops the cookie. This made the bug above doubly invisible: even after fixing (1), the cookie set during `login` still never reached the next request in local dev over plain HTTP. Fixed in `nuxt.config.ts` via `runtimeConfig.session.cookie.secure = process.env.NODE_ENV === 'production'`.

Both fixes are already live in the codebase (`mobile/lib/api.ts`, `nuxt.config.ts`) — noted here as a security-relevant lesson (a session that silently fails to authenticate is worse than one that visibly fails to log in) rather than as an outstanding task.

## Secrets

- Never committed: `.env`, `.env.production`, `.secrets/firebase-adminsdk.json` (all gitignored).
- `NUXT_SESSION_PASSWORD` must be a real random 32+ character secret in production — see [ENVIRONMENT.md](./ENVIRONMENT.md).
- No API key (AI, email, WhatsApp) is ever exposed to the client — every provider call goes through a server-side `server/services/*` abstraction; see [AI.md](./AI.md).

## Rate limiting

`server/utils/rateLimit.ts` — an in-memory, per-IP sliding-window limiter (`checkRateLimit(event, key, { max, windowMs })`), applied to `/api/auth/login` (10 attempts / 5 min) and `/api/auth/register` (5 / 10 min). Deliberately simple and honestly scoped: it's a plain in-process `Map`, correct for the single-instance Nitro deployment this project targets (see [DEPLOYMENT.md](./DEPLOYMENT.md) — no horizontal scaling configured), but it would need to move to a shared store (Redis, Firestore) before working correctly behind multiple server instances. Verified live: 11 rapid login attempts from the same IP return `401` ten times then `429` (with `Retry-After`).

## Audit log

`server/utils/auditLog.ts` (`logAction`, `listAuditLog`) — an org-scoped Firestore collection recording who did what, when, for the sensitive actions that matter today: `login`, `logout`, `employee.create/update/delete`, `leave.approve/reject`, `expense.approve/reject`. `GET /api/audit-log` and the [`/audit-log`](../pages/audit-log/index.vue) page are `owner`/`admin`-only (`requireRole`). Logging is fire-and-forget from the caller's perspective — a logging failure is caught and printed to the server console, never surfaces to the user or blocks the action it's recording.

Verified via `curl`: creating and deleting an employee produced two real entries readable by the owner; the same request from a `member`-role session got a real `403`.

**Scope, deliberately not exhaustive**: covers the actions gated by RBAC (see [Authorization](#authorization-rbac)) plus login/logout — not every CRUD operation in the app. Logging every contact/task/project edit would be a lot of noise for very little signal at this stage; the actions covered are the ones with real organizational consequence (who has access, who approved what).

## Not implemented

- **Secure headers** (CSP, HSTS, etc.) — not explicitly configured beyond Nitro/Nuxt's own defaults.
- **CAPTCHA / bot protection** on registration.

These are called out explicitly per §48 of the master prompt, as real, unimplemented gaps — not claimed as done.
