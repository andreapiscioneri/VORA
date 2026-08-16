# VORA — Commands

Single source of truth for every command needed to work on VORA. Update this file whenever a script is added, renamed, or removed.

## Installation

```bash
yarn install
```

## Environment

```bash
cp apps/web/.env.example apps/web/.env
```

## Development

```bash
cd apps/web && firebase emulators:start --only firestore   # terminal 1 — firebase.json lives in apps/web/; see Database section for JDK 21 note
yarn dev                                                    # terminal 2, from repo root — http://localhost:3100
```

`yarn dev:web` is an identical alias for `yarn dev` (same command, kept for symmetry with `dev:mobile` below — use whichever reads better in context). `yarn dev:mobile` starts the Expo dev server (`cd apps/mobile && npm start`, i.e. `expo start`) — see Mobile below for the full mobile workflow, it needs the web backend running too.

## Typecheck

```bash
yarn typecheck     # vue-tsc via `nuxt typecheck`
```

## Lint

```bash
yarn lint
```

## Format

```bash
yarn format   # eslint . --fix — no separate Prettier dependency, ESLint's --fix covers formatting
```

## Build

```bash
yarn build          # production build (SSR)
yarn build:web      # identical alias for `yarn build`, kept for symmetry with dev:web/dev:mobile
yarn generate        # static generation
```

## Production preview

```bash
yarn preview
```

## Mobile

Real Expo Router / TypeScript app in `apps/mobile/`, talking to the same Nuxt server API as the web app. Needs the web backend running (`firebase emulators:start` + `yarn dev`/`yarn dev:web`, see Development above) — the mobile app has no data of its own. Runs in plain **Expo Go** — no custom dev-client build required (the project deliberately targets whatever SDK Expo Go currently supports; see the SDK note in README.md).

`yarn dev:mobile` (from the repo root) is a shortcut for `cd apps/mobile && npm start` (`expo start`, interactive — press `i`/`a`/`w` to target a platform). The rest of this section uses the more explicit `npx expo start --ios` form directly from `apps/mobile/`, which is equivalent.

```bash
cd apps/mobile
npm install
npx expo start --ios      # opens in Expo Go on the iOS Simulator (auto-installs Expo Go there if missing)
```

Notes:
- `npx expo install <pkg>` may hit an `ERESOLVE` peer-dependency conflict from expo-router's web tooling; re-run the underlying `npm install` with `--legacy-peer-deps` if so.
- Android emulator: the app talks to `10.0.2.2:3100` instead of `localhost:3100` automatically (see `lib/api.ts`).
- `nuxt.config.ts` excludes `apps/mobile/**` from Nuxt's file watcher — without that, running both dev servers together can exhaust file descriptors (`EMFILE`) since `apps/mobile/node_modules` is huge.
- **"This project is incompatible with this version of Expo Go"** means the installed Expo Go build (App Store) doesn't match `apps/mobile/package.json`'s `expo` version. Fix by aligning the project to whatever SDK Expo Go currently ships — not by trying to force-install an old Expo Go. See the SDK note in README.md's Mobile app section for the full downgrade procedure (`npm install expo@^<n>.0.0 --legacy-peer-deps`, fix devDependencies typescript/jest-expo/react-test-renderer/@types/react to matching versions, remove `expo-status-bar` from `app.json`'s `plugins` if present — it isn't a config plugin).
- If multiple simulators are booted, Expo may target the wrong one and it may have a stale/mismatched Expo Go version installed. Shut down the ones you're not using (`xcrun simctl shutdown <udid>`) and boot only the target device.
- Metro cache issues after a dependency change (SDK version, native module) surface as vague bundling errors (e.g. `Got unexpected undefined` in `nullthrows.js`) — clear with `npx expo start --clear`.

### Run on your own physical phone (Expo Go, free — no paid account needed)

```bash
yarn dev --host=0.0.0.0   # or just `yarn dev`, already configured with --host
cd apps/mobile
npx expo start --lan      # or --tunnel if the phone isn't on the same Wi-Fi (needs @expo/ngrok)
```

Install **Expo Go** from the App/Play Store (free), then either scan the QR code Metro prints or open "Enter URL manually" and paste the `exp://<your-Mac's-LAN-IP>:8081` address shown in the terminal. No Apple/Google developer account or payment is needed for this — that's only required to publish to the App Store / Google Play (`eas build` + `eas submit`), which this project does not attempt since it needs your paid, personally-owned developer accounts.

### Tests

```bash
cd apps/mobile
npm test   # jest-expo — lib/taskStatus.test.ts, lib/api.test.ts, i18n/locales.test.ts
```

### Web unit tests (Vitest)

```bash
yarn test   # vitest run — tests/unit/** — validation schemas, rate limiting, auth tokens
```

Covers pure/self-contained logic: zod validation schemas (`shared/validation/*`), the
sliding-window rate limiter (`server/utils/rateLimit.ts`, including the `DISABLE_RATE_LIMIT`
bypass and per-IP/per-key bucket isolation), and auth token hashing/expiry/one-time-use
(`server/utils/authTokens.ts`, against an in-memory Firestore fake). Full request flows
(auth, RBAC, multi-tenancy, CRUD) are covered by the Playwright e2e suite instead — see below.

### Web end-to-end tests (Playwright)

```bash
yarn test:e2e   # requires the dev server + Firestore emulator already running (yarn dev)
```

Runs against `http://localhost:3100` (override with `VORA_E2E_BASE_URL`). `e2e/global-setup.ts`
registers one shared account and reuses its session across specs to avoid tripping the real
registration rate limiter. `e2e/helpers.ts` has a shared `clickUntilVisible` retry used across
specs to absorb a real Nuxt SSR/hydration race (a click landing before Vue attaches its
listener is a no-op) — not a workaround for a flaky app, a workaround for testing a
server-rendered one. Covers:
- register/login/logout
- the AI assistant answering a real question against live (empty) data
- a cross-module flow (create a contact, create a task, find both via ⌘K search)
- "Email → AI Classification → Task" (§59): records a real inbound communication via
  `POST /api/communications`, then drives the real AI task-extraction UI to confirm a suggested
  task and verifies it's a findable record
- the real WhatsApp inbound webhook (`server/api/whatsapp/webhook.post.ts`) — signature
  rejection always runs; the full signed-payload path only runs when `WHATSAPP_WEBHOOK_SECRET`
  is exported to the test process with the same value the dev server was started with
  (`WHATSAPP_WEBHOOK_SECRET=xxx yarn dev` / `WHATSAPP_WEBHOOK_SECRET=xxx yarn test:e2e`), since
  a test process can't read another process's environment — skips with a clear reason otherwise

Not covered, and why: "Mobile Login → Dashboard → Notification" (§59) is a native Expo app —
Playwright drives browsers, not iOS/Android — see `apps/mobile/` Jest tests and the iOS Simulator
verification notes in `apps/web/docs/MOBILE.md` for that surface instead.

## Database

Firestore, via the Firebase local emulator in development (no real project needed). `firebase.json` lives in `apps/web/`, so run this from there:

```bash
cd apps/web && firebase emulators:start --only firestore   # requires JDK 21+
```

If only JDK 17 is on PATH, run with a JDK 21 install without changing the global link:

```bash
cd apps/web && JAVA_HOME=$(brew --prefix openjdk@21) PATH="$(brew --prefix openjdk@21)/bin:$PATH" firebase emulators:start --only firestore
```

Emulator UI: http://127.0.0.1:4000 · Firestore port: 8080 (see `firebase.json`, `.env`).

**Real project**: `vora-piscioneri` (Firebase project on andrypiscioneri@gmail.com), Firestore enabled, rules deployed. To point the app at it instead of the emulator:

```bash
cp .env.production.example .env.production
# GOOGLE_APPLICATION_CREDENTIALS must point at .secrets/firebase-adminsdk.json (gitignored, already downloaded)
```

Then run without `FIRESTORE_EMULATOR_HOST` set (don't run the emulator alongside it). The service-account key lives in `.secrets/firebase-adminsdk.json` — never commit it, never paste its contents anywhere.

### Seed data

```bash
yarn dev            # terminal 1 — must be running first
yarn db:seed         # terminal 2
```

Registers a fresh demo organization and populates it with realistic fake data across every module (contacts, CRM, projects, tasks, appointments, inbox, helpdesk, knowledge, employees, leave, timesheets, expenses, calendar). Prints the demo login credentials when done. See [DATABASE.md § Seed data](./docs/DATABASE.md#seed-data).

## EAS (mobile builds)

```bash
cd apps/mobile
npx eas login        # your own Expo account — not something this project can do for you
npx eas init          # links the project, writes extra.eas.projectId into app.json
eas build --platform ios --profile preview       # or production
eas build --platform android --profile preview
eas submit
```

`apps/mobile/eas.json` (development/preview/production profiles) is already committed. See [MOBILE.md § EAS build configuration](./docs/MOBILE.md#eas-build-configuration) for what's configured vs. what needs your own Expo/Apple/Google accounts.

## Troubleshooting

- **Port 3100 already in use** — another VORA/Nuxt instance is running; stop it or set `--port` in the `dev` script.
- **Blank/500 page after pulling changes** — delete `.nuxt/` and re-run `yarn dev` to force Nuxt to regenerate its build cache.
- **i18n key shows raw `nav.xxx` string** — the key is missing from one of the files in `locales/`; add it to all 8 locale files.
