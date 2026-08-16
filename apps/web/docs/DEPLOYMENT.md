# Deployment

## Status: not deployed

VORA has not been deployed anywhere — this document describes how to, not a record of an existing live environment. No hosting provider, domain, or CI/CD pipeline has been configured or invented. Do not assume a URL other than `http://localhost:3100` (dev) exists.

## Web

The web app is a standard Nuxt 3 app with two build targets:

```bash
yarn build      # SSR build (server + client) — needs a Node runtime to serve
yarn generate   # static generation — needs no Node runtime, but loses SSR/API routes
```

Because VORA's `server/api/**` routes are load-bearing (auth, all CRUD, AI, Firestore access), **`yarn generate` (static) is not viable** — the app needs its Nitro server running, so deployment targets are runtimes that can host a Nuxt SSR build: a Node server (`node .output/server/index.mjs` after `yarn build`), or a Nitro-supported platform preset (Vercel, Netlify, Cloudflare Workers, etc. — see [Nuxt's deployment docs](https://nuxt.com/docs/getting-started/deployment) for the preset list; none has been configured here).

### What a real deployment needs, at minimum

1. **Environment variables** — see [ENVIRONMENT.md](./ENVIRONMENT.md). At minimum: a real `NUXT_SESSION_PASSWORD`, `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` (real Firebase project, not the emulator — see [DATABASE.md](./DATABASE.md#pointing-at-the-real-firebase-project)).
2. **`NODE_ENV=production`** — this specifically matters beyond convention here: `nuxt.config.ts` uses it to decide whether the session cookie gets the `Secure` flag (`runtimeConfig.session.cookie.secure = process.env.NODE_ENV === 'production'`). Deploying without `NODE_ENV=production` set would ship session cookies without `Secure` in a context that does have HTTPS — the opposite mistake from the one documented in [SECURITY.md § Mobile session cookies](./SECURITY.md#mobile-session-cookies), equally worth avoiding.
3. **HTTPS** — required in any real deployment (session cookie security depends on it once `Secure` is set per the point above).
4. **A process manager / platform restart policy** — this repo doesn't configure one; whatever host is chosen provides it (e.g. a platform's own process supervision, or `pm2`/systemd on a bare VM).

## Mobile

Not deployed to the App Store or Google Play — see [MOBILE.md § App Store / Google Play — not submitted](./MOBILE.md#app-store--google-play--not-submitted) for exactly what's ready (`expo-doctor` passes) and what's missing (`eas.json`, paid developer accounts).

## Database

The real Firebase project (`vora-piscioneri`) already exists with Firestore enabled and rules deployed — see [DATABASE.md](./DATABASE.md#pointing-at-the-real-firebase-project). A production web deployment would point at this project (via the service-account credentials) instead of the local emulator; the emulator is dev-only.

## CI

No CI pipeline (GitHub Actions or otherwise) exists in this repo. A reasonable minimum, if added: `yarn typecheck && yarn lint` for web, `npx tsc --noEmit && npm test` for mobile (`mobile/`), run on every push/PR — both command sets already work locally (see [SETUP.md § Verifying the install](./SETUP.md#verifying-the-install)), they're just not wired into an automated pipeline yet.
