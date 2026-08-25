# Mobile

`mobile/` is a real Expo Router / TypeScript app — not a WebView wrapper around the web app. It renders native React Native screens and talks to the same Nuxt server API as the web client.

## Why npm, not yarn

The web app (`VORA/` root) uses Yarn; `mobile/` uses npm, with its own `package-lock.json`. This isn't inconsistency for its own sake — Expo's own tooling (`expo-doctor`, `eas build`) is developed and documented against npm, and mixing package managers within one Expo project (a Yarn lockfile alongside Expo's npm-oriented scripts) is a common source of "works on my machine" native-module resolution bugs. Keeping them fully separate — two independent `node_modules`, two lockfiles — avoids that entirely, at the cost of one extra `npm install` when setting up.

## Running it

See [COMMANDS.md § Mobile](../COMMANDS.md#mobile) for the full command reference, troubleshooting, and physical-device instructions. Short version:

```bash
# terminal 1 (web backend must be running — mobile has no data of its own)
firebase emulators:start --only firestore
yarn dev

# terminal 2
cd mobile
npx expo start --ios
```

Opens in **Expo Go**, not a custom dev-client build — anyone can run this without an Apple/Google developer account.

## SDK version note

Runs on **Expo SDK 54**, deliberately, even though a newer SDK may exist by the time you read this: the public Expo Go app only supports the SDK version it currently ships with, and building against a newer SDK than Expo Go supports produces an opaque "incompatible" error. The project targets whatever SDK Expo Go currently supports so it stays runnable with zero custom build step. Bump deliberately (`npx expo install expo@latest && npx expo install --fix`) only once Expo Go itself has caught up — check the current Expo Go App Store listing first. See the full downgrade procedure in [COMMANDS.md](../COMMANDS.md#mobile) if you ever need to repeat it.

## Sharing code with web

`shared/types/*.ts` and `shared/validation/*.ts` (isomorphic TypeScript + zod, at the repo root, outside `mobile/`) are imported directly via a `tsconfig.json` path alias (`@vora/shared/*` → `../shared/*`) and a Metro `watchFolders` entry pointing at the parent directory. `Task`, `Contact`, `CalendarEvent`, etc. are the exact same interface on both platforms — there is no code generation step and no risk of the two drifting apart, because there is only one definition. See [ARCHITECTURE.md](./ARCHITECTURE.md#why-this-shape-not-a-monorepo) for why this isn't a full monorepo/workspace setup.

## Screens

| Tab | Screen | Notes |
|---|---|---|
| Home | `app/(tabs)/index.tsx` | Live counts (open tasks / unread / upcoming events) + upcoming task list, refetches on focus (`useFocusEffect`) |
| Da fare (Tasks) | `app/(tabs)/tasks.tsx` | Tap a task to advance its status — a real `PUT` to Firestore |
| Posta (Inbox) | `app/(tabs)/inbox.tsx` | Tap to mark read |
| Calendario (Calendar) | `app/(tabs)/calendar.tsx` | Agenda list view |
| Altro (More) | `app/(tabs)/more.tsx` | Theme picker, language picker, links into 6 more modules, real logout |

Tapping a row in More (Contatti, CRM, Progetti, Fogli ore, Helpdesk, Ferie) pushes a real detail screen (`app/contacts.tsx`, `crm.tsx`, `projects.tsx`, `timesheets.tsx`, `helpdesk.tsx`, `leave.tsx`) that fetches live data from the matching Nuxt API endpoint — not a static/inert label.

## Authentication

`contexts/AuthContext.tsx` provides `useAuth()` (`{ user, loading, login, loginWithGoogle, register, logout }`). `app/login.tsx` is the login/register screen; `app/_layout.tsx` gates the `(tabs)` group behind `!!user` via `useSegments()`/`useRouter()`, redirecting to `/login` when signed out. Session is a plain HTTP cookie — the native networking layer (`NSURLSession` on iOS, `OkHttp` on Android) automatically persists and resends it per-origin, so there is **no manual token storage** (no `expo-secure-store`, no Cookie-header juggling) — `credentials: 'include'` on every `fetch()` call in `lib/api.ts` is the only thing that makes it work. See [SECURITY.md § Mobile session cookies](./SECURITY.md#mobile-session-cookies) for the two real bugs this surfaced and how they were fixed.

**Google OAuth** (`loginWithGoogle()`) opens `${API_BASE}/auth/google-mobile` via `expo-web-browser`'s `WebBrowser.openAuthSessionAsync`, catches the `vora://oauth-callback?code=...` deep link it redirects to, then trades that one-time code for a real session via `POST /api/auth/mobile/google-exchange` through the app's own `fetch` (same cookie mechanism as email/password login) — the OAuth round-trip itself runs in a system browser context with its own cookie jar, so it can't set the app's session cookie directly. See [SECURITY.md § Mobile Google OAuth](./SECURITY.md#mobile-google-oauth) for the full rationale and the Google Cloud Console setup step this needs.

## i18n and theme

Both mirror the web app's systems independently (mobile has its own `i18n/` and `contexts/ThemeContext.tsx`, not a shared runtime with Nuxt's `@nuxtjs/i18n`/`@nuxtjs/color-mode` — those are Nuxt-specific modules that don't run in React Native). See [I18N.md](./I18N.md#mobile) for the language system and `README.md § Mobile app` for the theme system.

## Tests

```bash
cd mobile
npm test
```

`jest-expo` preset, covering `lib/taskStatus.ts` (task-status state machine), `lib/api.ts` (success/error/edge-case paths), and `i18n/locales.test.ts` (all 8 locale files have identical key sets and no empty values — a missing translation fails this test rather than silently falling back, since the mobile i18n context has no `fallbackLocale` mechanism, unlike the web app).

## Push notifications

Real, end-to-end: `mobile/lib/pushNotifications.ts` requests permission and registers the device's Expo push token (`POST /api/notifications/register-token`) once the user is authenticated (`app/_layout.tsx`). `mobile/app/notifications.tsx` (More → Notifiche) lets the user toggle each of the 8 §42 categories independently (messages, urgent tasks, appointments, reminders, AI actions, approvals, tickets, deadlines), persisted via `GET`/`PUT /api/notifications/preferences`.

Server-side, `server/services/notifications/index.ts` exposes `sendPushToUser(userId, category, notification)` — checks the recipient's preference for that category, looks up their registered device tokens, and POSTs to Expo's push relay (`https://exp.host/--/api/v2/push/send`). This needs **no API key or paid Apple/Google developer account**: Expo operates the relay for free at this scale (an optional `EXPO_ACCESS_TOKEN` only raises Expo's own rate limits for production volume). A send failure is logged and swallowed — it must never break the request that triggered it.

One real trigger is wired today: `POST /api/communications` sends a `messages`-category push to every member of the organization when an **inbound** communication is recorded (outbound/manual entries don't notify, since the person who just created them doesn't need a push about their own action). Verified via `curl`: registering a token, toggling `messages` off, confirming no error on inbound-communication creation either way, and confirming the preference round-trips correctly.

**What can't be verified in this environment**: actual push delivery to a device. `Device.isDevice` in `pushNotifications.ts` deliberately short-circuits to a no-op on simulators (`Device.isDevice` is `false` there) — iOS/Android simulators have no APNs/FCM capability at all, this is a platform limitation, not a gap in the code. `getExpoPushTokenAsync()` also needs an EAS project id (`app.json`'s `extra.eas.projectId`, added once `eas build:configure` runs — see [`eas.json`](../mobile/eas.json) and the EAS section below); until then registration itself no-ops safely rather than throwing.

## Deep linking

`mobile/app.json`'s `expo.scheme` is `"vora"` — a real, working custom URL scheme: `vora://` links (e.g. `vora://tasks/abc123`) open the app via Expo Router's file-based routing today, no further setup needed. This is fully testable in the simulator, e.g. `xcrun simctl openurl booted vora://tasks`.

**Not configured, and deliberately not faked**: true Universal Links (iOS) and App Links (Android) — the kind that let an ordinary `https://` link (not a custom scheme) open the app directly instead of a browser. Those require:

- iOS: an `ios.associatedDomains` entry in `app.json` (e.g. `applinks:yourdomain.com`) plus that domain serving `/.well-known/apple-app-site-association` over HTTPS.
- Android: an `android.intentFilters` entry plus that domain serving `/.well-known/assetlinks.json` over HTTPS.

Both require a real, owned domain to host those two well-known files — infrastructure that doesn't exist for this project yet. Adding `associatedDomains`/`intentFilters` pointing at a placeholder or invented domain would silently break (Apple/Google verify the file is actually reachable at that domain before honoring the association) while looking configured, which is worse than leaving it out — same reasoning as not inventing OAuth or WhatsApp Business API credentials elsewhere in this repo (see [SECURITY.md](./SECURITY.md#oauth)). Once a real domain exists: host the two well-known files, add the two `app.json` blocks, and rebuild — no code changes needed, since Expo Router already handles universal-link and custom-scheme URLs identically once the OS routes them to the app.

## EAS build configuration

[`eas.json`](../mobile/eas.json) defines three build profiles — `development` (internal, dev-client), `preview` (internal, includes an iOS simulator build), `production` (App Store/Play Store — app-bundle on Android, auto-incrementing build number). `app.json` sets `runtimeVersion: { policy: "appVersion" }` so OTA updates stay compatible with the native build they were published against. `expo-doctor` passes 18/18 checks.

**What's deliberately not configured**: `app.json`'s `extra.eas.projectId` (and `eas.json`'s implicit link to a specific Expo account/project) — that requires running `eas init` while logged into a real Expo account, which is an account-creation/login action performed on your behalf that these tools won't do. Run it yourself once:

```bash
cd mobile
npx eas login        # your own Expo account
npx eas init          # links this project, writes extra.eas.projectId into app.json
```

After that, push notifications' `getExpoPushTokenAsync()` call (currently a safe no-op without a project id — see [Push notifications](#push-notifications) above) starts working for real.

## App Store / Google Play — not submitted

`expo-doctor` passes cleanly and `eas.json` is ready, so the app is build-ready, but actually submitting requires a paid Apple Developer Program membership ($99/yr) and a Google Play Console account — both need real payment and identity verification that cannot be performed on your behalf. Once you have those (and have run `eas init` above):

```bash
cd mobile
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit
```
