# Setup

This is the expanded version of the README's Quick Start — full detail for a new machine. For the day-to-day command reference once you're set up, see [COMMANDS.md](../COMMANDS.md).

## Prerequisites

- **Node.js** 20+ and **Yarn** (web app package manager)
- **npm** (mobile app uses `npm`, not `yarn` — see [MOBILE.md](./MOBILE.md#why-npm-not-yarn))
- **JDK 21+** — only needed to run the Firestore emulator locally (`firebase emulators:start`). If your machine only has JDK 17 on `PATH`, see the workaround in [DATABASE.md](./DATABASE.md#jdk-version).
- **Xcode + iOS Simulator** (macOS only) or **Android Studio + emulator** — only needed to run the mobile app. The web app needs neither.
- **Expo Go** app on a physical phone, if you want to test on real hardware instead of a simulator (free, no developer account needed — see [MOBILE.md](./MOBILE.md)).

## 1. Install dependencies

```bash
yarn install          # web app, from the VORA/ root
cd apps/mobile && npm install && cd ..   # mobile app (separate package.json, separate lockfile)
```

## 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set `NUXT_SESSION_PASSWORD` to a real random 32+ character string (a placeholder is generated automatically by `nuxt-auth-utils` on first `yarn dev` if you skip this, so this step is optional in local dev — but do it before anything resembling production). See [ENVIRONMENT.md](./ENVIRONMENT.md) for what every variable does and which are actually required.

## 3. Start the database

```bash
firebase emulators:start --only firestore
```

This needs JDK 21+ — see [DATABASE.md](./DATABASE.md) if that's not your default. No real Firebase project or credentials are needed for local development; the emulator is a local, in-memory Firestore.

## 4. Run the web app

In a second terminal:

```bash
yarn dev
```

Open http://localhost:3100. Register a new account (organization + user are created together — see [ARCHITECTURE.md](./ARCHITECTURE.md) and [SECURITY.md](./SECURITY.md#authentication)).

## 5. Run the mobile app

The mobile app has no data of its own — it talks to the same Nuxt server from step 4, so that must already be running.

```bash
cd apps/mobile
npx expo start --ios
```

This opens the app in **Expo Go** on the iOS Simulator (installs Expo Go automatically if missing). See [MOBILE.md](./MOBILE.md) for Android, physical devices, and troubleshooting.

## Verifying the install

```bash
yarn typecheck     # web
yarn lint          # web
cd apps/mobile && npx tsc --noEmit && npm test && cd ..   # mobile
```

All four should pass clean on a fresh checkout. If they don't, something in this setup was skipped — check [COMMANDS.md § Troubleshooting](../COMMANDS.md#troubleshooting) first.
