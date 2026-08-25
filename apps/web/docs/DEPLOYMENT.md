# Deployment

## Status: configured for Netlify, not yet live

The repo is wired up for a real Netlify deployment (build preset, `netlify.toml`, verified build), but no site has actually been created/connected on Netlify yet — that step needs the account owner (Netlify login is out of scope for an assistant to do on someone's behalf). Do not assume a URL other than `http://localhost:3100` (dev) is reachable until that's done.

## Web — Netlify

The web app is a standard Nuxt 3 app with two build targets:

```bash
yarn build      # SSR build (server + client) — needs a Node runtime to serve
yarn generate   # static generation — needs no Node runtime, but loses SSR/API routes
```

Because VORA's `server/api/**` routes are load-bearing (auth, all CRUD, AI, Firestore access), **`yarn generate` (static) is not viable** — the app needs its Nitro server running. `apps/web/nuxt.config.ts` sets `nitro.preset = 'netlify'`, so `yarn build` produces Netlify-ready output directly: static assets in `apps/web/dist`, the SSR request handler as a Netlify Function in `apps/web/.netlify/functions-internal` (verified by running the build locally — both directories are populated, gitignored, and Netlify wires the function to catch-all routing automatically, no `_redirects` needed).

The root-level `netlify.toml` tells Netlify how to build this from the monorepo:

```toml
[build]
  base = "apps/web"
  command = "cd ../.. && yarn install --frozen-lockfile && yarn workspace @vora/web build"
  publish = "dist"
```

`base` is `apps/web` because that's where Nitro writes `.netlify/functions-internal` (Netlify looks for it relative to `base`); the command still installs from the repo root first because the yarn workspace's lockfile and hoisted `node_modules` live there, not inside `apps/web`.

### Connecting the site (one-time, needs the account owner)

1. On [app.netlify.com](https://app.netlify.com), **Add new site → Import an existing project**, pick the `andreapiscioneri/VORA` GitHub repo. Netlify auto-detects `netlify.toml` — build settings don't need to be re-entered.
2. Set the environment variables below in **Site configuration → Environment variables** before the first deploy (a deploy without them will build successfully but fail at runtime on `getDb()` / OAuth / session).
3. Deploy. If the site is meant to live at `andreapiscioneri.netlify.app`, set that as the site's Netlify subdomain in **Site configuration → General → Site details → Change site name**.

### What a real deployment needs, at minimum

1. **Environment variables** — see [ENVIRONMENT.md](./ENVIRONMENT.md). Set these in the Netlify site's environment variables (not committed anywhere — `apps/web/.env` is gitignored and irrelevant to Netlify):
   - `NUXT_SESSION_PASSWORD` — a real random 32+ char secret (not the `.env.example` placeholder).
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — the real Firebase project's service-account credentials (see [DATABASE.md](./DATABASE.md#pointing-at-the-real-firebase-project)); `FIRESTORE_EMULATOR_HOST` must **not** be set in production, or `getDb()` will try to talk to a nonexistent local emulator.
   - `NUXT_PUBLIC_APP_URL` — the real deployed URL (e.g. `https://andreapiscioneri.netlify.app`), used for links generated in emails and OAuth redirects.
   - `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` — only if Google login should work in production; without them `/api/auth/google` cleanly redirects to `/login?error=oauth_failed` instead of crashing. The OAuth client's authorized redirect URI must be updated to `https://<netlify-site>/api/auth/google` (the existing Google Cloud Console client only has the `localhost:3100` dev URI registered).
2. **`NODE_ENV=production`** — Netlify sets this automatically for production deploys; matters here because `nuxt.config.ts` uses it to decide whether the session cookie gets the `Secure` flag (`runtimeConfig.session.cookie.secure = process.env.NODE_ENV === 'production'`). Shipping without it set would send session cookies without `Secure` over a connection that does have HTTPS — the opposite mistake from the one documented in [SECURITY.md § Mobile session cookies](./SECURITY.md#mobile-session-cookies), equally worth avoiding.
3. **HTTPS** — Netlify provides this automatically (including for the default `*.netlify.app` subdomain), so no extra config is needed here.
4. **Process management** — not applicable on Netlify (Functions are stateless/on-demand, no long-running process to supervise).

## Mobile

Not deployed to the App Store or Google Play — see [MOBILE.md § App Store / Google Play — not submitted](./MOBILE.md#app-store--google-play--not-submitted) for exactly what's ready (`expo-doctor` passes) and what's missing (`eas.json`, paid developer accounts).

## Database

The real Firebase project (`vora-piscioneri`) already exists with Firestore enabled and rules deployed — see [DATABASE.md](./DATABASE.md#pointing-at-the-real-firebase-project). A production web deployment would point at this project (via the service-account credentials) instead of the local emulator; the emulator is dev-only.

## CI

No CI pipeline (GitHub Actions or otherwise) exists in this repo. A reasonable minimum, if added: `yarn typecheck && yarn lint` for web, `npx tsc --noEmit && npm test` for mobile (`mobile/`), run on every push/PR — both command sets already work locally (see [SETUP.md § Verifying the install](./SETUP.md#verifying-the-install)), they're just not wired into an automated pipeline yet.
