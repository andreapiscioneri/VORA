# VORA

VORA is an AI-powered work-management platform that turns scattered work communications and requests into an organized workflow — CRM, calendar, tasks, communications, projects, and an AI assistant, in one calm interface.

## Documentation

- [SETUP.md](./apps/web/docs/SETUP.md) — full local setup, from a clean checkout to a running app
- [ARCHITECTURE.md](./apps/web/docs/ARCHITECTURE.md) — system diagram, layers, request flow, monorepo layout
- [ENVIRONMENT.md](./apps/web/docs/ENVIRONMENT.md) — every env var, what it does, whether it's required
- [DATABASE.md](./apps/web/docs/DATABASE.md) — Firestore, the emulator, multi-tenancy, collections
- [AI.md](./apps/web/docs/AI.md) — the `AIService` abstraction, what the heuristic engine does today, what's not built
- [MOBILE.md](./apps/web/docs/MOBILE.md) — the Expo app, running it, auth, i18n, what's not built
- [DEPLOYMENT.md](./apps/web/docs/DEPLOYMENT.md) — deployment status (not deployed) and what a real deployment needs
- [I18N.md](./apps/web/docs/I18N.md) — the two i18n systems (web/mobile), translation coverage
- [SECURITY.md](./apps/web/docs/SECURITY.md) — auth, tenant isolation, RBAC status, mobile session-cookie bugs found & fixed
- [BRANDING.md](./apps/web/docs/BRANDING.md) — the VORA symbol, design tokens, spacing/typography scales

Status: **Phase 7 — Polish, scoped and done**. Phases 1–6 (foundation, all core modules, Communications, AI, Business modules, the multi-tenant site generator, and the real mobile app) are done. Phase 7 covers what's honestly achievable without third-party accounts: accessibility labels on every interactive mobile element, a real Jest test suite, honest offline/error states (no silently-wrong zero counts), and app-store-readiness metadata verified by `expo-doctor`. See [Polish](#polish-phase-7) below for what's out of scope and why. Marketing Automation (`/marketing/automations`) is a real trigger→condition→action step-list builder with a genuine execution engine — no faked side effects (see [ARCHITECTURE.md](./apps/web/docs/ARCHITECTURE.md) and `apps/web/server/utils/automationEngine.ts`); its one explicit, documented limitation is that `delay` steps are evaluated at trigger time only, since this app has no background job queue.

## Website module

Per the brand-consistency requirement, VORA does **not** duplicate a website builder. `/website` in the app reads real, live data from the sibling `portfolio-andrea` Nuxt project on disk (`server/api/website/overview.get.ts`: scans `pages/` for real routes, parses `content/projects.ts` for real case studies) and shows it read-only, with outbound links to the actual published site.

**Multi-tenant site generator** (also on `/website`, "I tuoi siti generati"): any number of `MicroSite` records (`shared/types/microsite.ts`) can be created — name, tagline, about, contact email, accent color, published toggle, unique slug (validated server-side against Firestore, real 422 on collision). Each published site is **actually live** at `/site/<slug>` (`pages/site/[slug].vue`, its own `public` layout with no dashboard chrome, real `useHead()` title/meta) — this is a genuinely rendered page, not a mockup; unpublished/missing slugs 404 for visitors, verified. This is the real (if minimal) foundation for "every organization gets its own generated site" — a fuller page-block editor is a natural next step on top of the same `MicroSite` model.

## Communications provider abstraction

`EmailProvider` / `WhatsAppProvider` interfaces live in `server/services/{email,whatsapp}/types.ts`. Without `GMAIL_*` / `WHATSAPP_API_KEY` set, `getEmailProvider()` / `getWhatsAppProvider()` return the mock implementation — sends are recorded in Firestore but nothing goes over the network, and the compose UI shows an explicit notice about this. Email has a real implementation too: `GmailEmailProvider` (`server/services/email/gmail.ts`) sends via the Gmail API once `GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REFRESH_TOKEN`/`GMAIL_SENDER_EMAIL` are set — see [docs/EMAIL.md](./apps/web/docs/EMAIL.md) for how to obtain the refresh token. Implement a real WhatsApp provider the same way: a class satisfying the interface, wired into the factory in `index.ts`.

## AI abstraction

`AIService` interface lives in `server/services/ai/types.ts`. Without `AI_API_KEY` set, `getAIService()` returns `HeuristicAIService` (`heuristic.ts`) — deterministic keyword/date-pattern matching, no LLM call, no network request. It powers:
- **Message classification** (`/api/ai/classify`) — priority + category + a human-readable explanation of why.
- **Task extraction** (`/api/ai/extract-task`, wired into the Inbox) — suggests a task from a message; the user must Confirm/Edit/Reject before anything is created, nothing happens automatically.
- **VORA Assistant** (sparkle icon in the topbar) — answers a fixed set of real questions ("Organize my day", priorities, unread messages, upcoming appointments) by querying live Firestore data through the existing composables — not free-form chat.

Swap in a real LLM by implementing `AIService` and wiring it into the factory in `index.ts`; nothing else changes.

## Brand

The VORA symbol — three converging strokes reading as an abstract V (scattered inputs resolving into one clear direction) — lives in [`assets/brand/`](./apps/web/assets/brand) as source SVGs, with every derived asset (favicon, PWA icons, Apple touch icon, Android adaptive icon layers, splash icon, monochrome, light/dark variants) rasterized into [`public/icons/`](./apps/web/public/icons). Regenerate after editing a source SVG:

```bash
rsvg-convert -w 512 -h 512 assets/brand/icon-dark.svg -o public/icons/icon-512.png
```

## Mobile app

`apps/mobile/` is a real Expo Router / TypeScript app — not a WebView wrapper. It talks to the same Nuxt server API as the web app (`http://localhost:3100/api`, `10.0.2.2` on Android emulators) and reuses the isomorphic types from `shared/types/*.ts` directly via a Metro `watchFolders` + `tsconfig` path alias (`@vora/shared/*`), so `Task`, `Communication`, `CalendarEvent`, etc. are the same interfaces on both platforms — no duplicated or drifting types.

**SDK 54, not 57**: the app runs on Expo SDK 54 even though 57 was the latest at the time it was scaffolded, because the public Expo Go app (App Store) only supports the SDK version it currently ships with — 54 as of this build — and building against a newer SDK than Expo Go supports produces an "incompatible" error with no useful detail. Since the goal is that anyone can open VORA in plain Expo Go with no custom dev-client build, the project targets whatever SDK Expo Go currently supports. Bump this deliberately (`npx expo install expo@latest && npx expo install --fix`) once Expo Go itself has caught up — check the App Store listing first.

Screens built: Home (live counts + upcoming tasks), Tasks (tap to advance status — a real `PUT` to Firestore), Inbox (tap to mark read), Calendar (agenda list), More (theme + language pickers, and real links into the rest of the platform). Tapping any row in More — Contatti, CRM, Progetti, Fogli ore, Helpdesk, Ferie — pushes a real detail screen (`app/contacts.tsx`, `crm.tsx`, `projects.tsx`, `timesheets.tsx`, `helpdesk.tsx`, `leave.tsx`) that fetches live data from the corresponding Nuxt API endpoint and renders it (contact status, opportunity stage/value, project status, timesheet duration, ticket status, leave type/status) — these used to be inert labels and now are not. Navigation is Expo Router's native bottom tabs plus a root stack for the pushed detail screens (back button via `DetailScreen` in `components/Screen.tsx`); icons are a small hand-rolled `react-native-svg` set mirroring the web app's `Icon.vue` (no emoji, no icon font). The app icon, splash, and Android adaptive icon layers are rasterized from the same `assets/brand/*.svg` sources as the web favicon/PWA icons. The splash screen fades out (`expo-splash-screen` `setOptions({ fade: true })`) once the root layout has laid out, instead of disappearing instantly (Expo Go itself doesn't support this API — it only takes effect in a standalone/dev-client build).

**Brand wordmark**: the "Vora" text next to the mark is set in real Roboto Bold (`@expo-google-fonts/roboto`, matching the web app's typeface) with tightened letter-spacing, not the OS default system font — and consistently cased as "Vora", never "VORA".

**i18n**: `i18n/` mirrors the web app's 8 languages (it default, en/de/es/fr/ru/zh/ja) with real translations for every string used in the mobile UI (not machine filler) — a Jest test (`i18n/locales.test.ts`) asserts all 8 locale files have exactly the same keys, so a missing translation fails CI instead of silently falling back. Language auto-detects from the device locale on first launch, is user-overridable from More → Language (flag-icon picker, real SVG flags in `components/Flag.tsx`), and persists via AsyncStorage.

**Theme**: `contexts/ThemeContext.tsx` provides system/light/dark modes (mirroring the web app's `@nuxtjs/color-mode`), backed by two full semantic color palettes in `constants/theme.ts`. Defaults to following the OS appearance; user override persists via AsyncStorage. Switch it from More → Appearance (sun/moon/monitor icon segmented control).

Verified end-to-end on the iOS Simulator running plain Expo Go (not a custom dev-client): theme switching, language switching, and a real task created through the API, edited from the phone UI (status: todo → in_progress), confirmed persisted in Firestore via the server, then cleaned up. See [COMMANDS.md](./COMMANDS.md#mobile) to run it yourself.

`lib/api.ts` resolves the dev server host from Expo's own `hostUri` (the same LAN/tunnel IP the device already uses to fetch the JS bundle) rather than hardcoding `localhost`, which only resolves on a simulator — so the app works unmodified on a physical iPhone/Android device over Expo Go, not just in the Simulator. The Nuxt dev server (`yarn dev`) binds to all interfaces (`--host`) for the same reason.

## Polish (Phase 7)

What's real and verified:
- **Mobile accessibility** — every interactive element in `apps/mobile/app/(tabs)/*` has an `accessibilityLabel`/`accessibilityRole` (task rows announce title + status + the next-status hint, inbox rows announce unread state, decorative dots are hidden from screen readers).
- **Web accessibility** — a systematic pass, not a spot-fix: a skip-to-content link (`layouts/default.vue`) that moves focus to `<main>`; all 17 modal form components (`ContactForm.vue`, `TaskForm.vue`, `EventForm.vue`, etc.) now have `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the real title, focus-on-open, and Escape-to-close; every form label is programmatically associated to its input via `id`/`for` (previously visual-only adjacency); the remaining icon-only buttons (calendar prev/next month, Knowledge favorite toggle) got real `aria-label`s. Landmarks (`<aside>`, `<header>`, `<main>`) and `<html lang>` (via `@nuxtjs/i18n`) were already correct. **Known, flagged gap**: the CRM/Tasks Kanban boards use native HTML5 drag-and-drop for reordering, which has no keyboard equivalent — moving a card currently requires a mouse. Not fixed here; would need a real keyboard-operable reorder UI (e.g. cut/paste or arrow-key move), which is a feature, not a quick accessibility patch.
- **Tests** — a real Jest suite (`jest-expo` preset) in `apps/mobile/` (task-status state machine, API client, offline cache, i18n locale completeness), and a real Vitest suite for the web app (`tests/unit/` — validation schemas, rate limiting, auth tokens, the Knowledge embedding/search logic), run with `npm test` and `yarn test` respectively. A Playwright e2e suite (`e2e/`, `yarn test:e2e`) covers the full stack for the critical flows: register/login/logout, the AI assistant answering from live data, and a cross-module create-contact → create-task → find-both-via-search flow.
- **Offline/error honesty** — the mobile Home screen used to show "0" on every stat when the backend was unreachable, indistinguishable from a genuinely empty state. It now shows an explicit "can't reach the VORA server" banner and `—` placeholders instead of misleading zeros; Tasks/Inbox/Calendar already had this via `StateMessage`.
- **Offline data caching** — Tasks, Contacts, and Calendar now cache their last successful fetch in `AsyncStorage` (`apps/mobile/lib/offlineCache.ts`). If a later fetch fails, the screen keeps showing that real cached list instead of an error, with a visible "offline — showing your last saved data" banner (translated across all 8 locales) so it's never mistaken for live data.
- **Store readiness** — `app.json` has a description, iOS build number, Android version code, and `ITSAppUsesNonExemptEncryption: false` (skips the App Store Connect encryption questionnaire for an app with no custom encryption); `npx expo-doctor` passes 20/20 checks.

What's deliberately out of scope, and why:
- **App Store / Google Play submission** — requires a paid Apple Developer Program membership ($99/yr) and a Google Play Console account, both of which need real payment and identity verification I cannot perform on your behalf. `apps/mobile/` is ready for `eas build` once you have those.
- **Performance profiling** — the app is small enough (a handful of list screens) that premature optimization here would be exactly the kind of unrequested scope this project avoids; revisit if real usage surfaces a slow screen.
- **Full WCAG color-contrast audit** — the accessibility pass covered structure (landmarks, labels, dialog semantics, keyboard access), not a systematic contrast-ratio check against the design tokens in `docs/BRANDING.md`; worth doing before a real accessibility certification, not done here.

## Stack

- **Web:** Nuxt 3 / Vue 3 / TypeScript, Tailwind CSS, Pinia, `@nuxtjs/i18n`, `@nuxtjs/color-mode`
- Chosen to stay consistent with the existing [`portfolio-andrea`](../portfolio-andrea) codebase, whose brand tokens (accent `#39FF14`, ink/paper palette, Roboto) VORA's design system is derived from.
- **Database:** Firestore. Local emulator by default in dev (no credentials needed); real project `vora-piscioneri` exists and is verified working (Firestore enabled, rules deployed, service-account key in `.secrets/`, gitignored) — see [COMMANDS.md](./COMMANDS.md#database) to point the app at it.
- **Mobile:** [`apps/mobile/`](./apps/mobile) — real Expo / React Native app (SDK 57, Expo Router, TypeScript), not a WebView wrapper. See [Mobile app](#mobile-app) below.

## Quick Start

1. Install dependencies
2. Configure environment
3. Run the development server
4. Open the web app

```bash
yarn install
cp .env.example .env
yarn dev
```

Open http://localhost:3100

See [COMMANDS.md](./COMMANDS.md) for the full list of available commands.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation — app shell, design system, i18n, branding | ✅ done |
| 2 | Core modules — Dashboard, Contacts, CRM, Tasks, Calendar, Projects, Timesheets, Appointments | ✅ done |
| 3 | Communications — unified inbox, email/WhatsApp abstraction | ✅ done (mock providers — no real credentials configured) |
| 4 | AI — assistant, classification, prioritization, task/calendar extraction | ✅ done (heuristic engine — no LLM configured) |
| 5 | Business — Helpdesk, Knowledge, Website, Marketing, Employees, Leave, Expenses | ✅ done (Automation intentionally skipped — see note above) |
| 6 | Mobile — Expo app | ✅ done |
| 7 | Polish — performance, a11y, tests, offline, store readiness | ✅ done on mobile (see note above — App/Play Store submission needs your paid developer accounts) |

## Project structure

```
VORA/                        # yarn-workspaces monorepo root
├── apps/
│   ├── web/                 # this Nuxt 3 app
│   │   ├── components/      # layout/, launcher/, ui/, contacts/, tasks/, crm/, calendar/, projects/, timesheets/, appointments/, marketing/
│   │   ├── composables/     # useNav, useContacts, useTasks, useOpportunities, useEvents, useProjects, useTimesheets, useTimer, useAppointments
│   │   ├── layouts/         # default.vue (sidebar + topbar shell)
│   │   ├── pages/           # dashboard/, contacts/, tasks/, crm/, calendar/, projects/, timesheets/, appointments/, marketing/
│   │   ├── server/          # api/ (REST routes), utils/ (Firestore access)
│   │   ├── shared -> ../../packages/shared   # symlink, see ARCHITECTURE.md
│   │   ├── i18n/locales/    # it, en, de, es, fr, ru, zh, ja
│   │   ├── assets/css/      # main.css (Tailwind entry)
│   │   ├── firebase.json, firestore.rules, firestore.indexes.json
│   │   ├── tailwind.config.ts  # VORA design tokens
│   │   └── nuxt.config.ts
│   └── mobile/               # Expo Router app — app/, components/, contexts/ (theme), i18n/, hooks/, lib/api.ts (see Mobile app below); its own npm-managed node_modules, outside the yarn workspace
├── packages/
│   └── shared/               # types/, validation/ (isomorphic, used by web + mobile) — no build step
└── package.json               # workspace root ("workspaces": ["apps/web", "packages/shared"])
```

## Design system

Colors, spacing (4px grid), and typography are centralized in [`tailwind.config.ts`](./tailwind.config.ts) — do not hardcode values in components; extend the tokens there.
