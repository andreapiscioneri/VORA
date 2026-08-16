# Architecture

## Monorepo layout

VORA is a yarn-workspaces monorepo:

```
VORA/
├── apps/
│   ├── web/                 # this Nuxt 3 app — pages/, server/, components/, composables/, ...
│   └── mobile/               # Expo Router app — its own npm-managed node_modules (see below)
├── packages/
│   └── shared/
│       ├── types/*.ts        # isomorphic TypeScript interfaces (Task, Contact, ...)
│       └── validation/*.ts   # zod schemas, imported by both apps/web's server/api and mobile forms
├── package.json               # workspace root: "workspaces": ["apps/web", "packages/shared"]
```

`apps/web` and `packages/shared` are real yarn workspaces (hoisted into the root `node_modules`). `apps/mobile` deliberately stays **outside** the yarn workspace and keeps its own `package-lock.json`-managed `node_modules` — Metro/Expo's bundler assumes it owns its dependency tree, and hoisting React Native's native-module deps into a shared workspace `node_modules` is a well-known source of Metro resolution bugs. `apps/mobile` reaches `packages/shared` the same way it always did: `apps/mobile/tsconfig.json` maps `@vora/shared/*` to `../../packages/shared/*`, and Metro's `watchFolders` includes that directory so the bundler resolves it.

`apps/web` reaches `packages/shared` via a plain filesystem symlink, `apps/web/shared -> ../../packages/shared` — every `~/shared/...` import already used throughout this app's source (180+ call sites) keeps working completely unchanged, because Nuxt's built-in `~` alias already resolves to `apps/web`'s own directory contents, symlink included. A custom Nuxt `alias` entry pointing outside the app root was tried first and rejected: it satisfies TypeScript and the client Vite bundle, but Nitro's dev-time on-demand module runner does not reliably pick up cross-directory `alias` entries in this Nuxt/Vite version, so pages importing `~/shared/*` 500'd at runtime despite passing typecheck. The symlink sidesteps that gap entirely since every tool (Vite, Nitro, TypeScript, Vitest, Playwright) resolves a symlinked directory identically to a real one.

There is no publish/build step for `packages/shared` — it's plain `.ts` consumed directly by both the Nuxt server (Node) and Expo (Hermes/Metro), which both support importing loose TypeScript from outside their own root without a package boundary. No `services/` package exists separately from `apps/web/server/`: VORA's backend is Nuxt's own Nitro server layer, not a standalone deployable service, so splitting it out would mean rebuilding routing/auth/session handling outside Nuxt for no functional gain — the same "don't rewrite working tooling for no gain" reasoning that originally kept this project out of a monorepo now shapes how much of one it became.

## System diagram

```
                         VORA
                           │
                ┌──────────┴──────────┐
                │                     │
              WEB                   MOBILE
        (Nuxt 3 / Vue 3)        (Expo Router / RN)
                │                     │
                └──────────┬──────────┘
                           │
                    Nuxt server API
                  (server/api/**/*.ts)
                           │
                ┌──────────┼──────────┐
                │          │          │
           Firestore   AIService   Email/WhatsApp
          (server/utils) (server/services/ai) (server/services/{email,whatsapp})
```

Mobile is a genuine second client of the same HTTP API the web app calls — not a WebView, and not a separate backend. Every mobile screen calls the same `server/api/**` routes as the equivalent web page, via `mobile/lib/api.ts`, and gets cookie-based session auth via `credentials: 'include'` (see [SECURITY.md](./SECURITY.md#mobile-session-cookies) for why that mattered).

## Layers

**`pages/` + `components/`** — Nuxt/Vue UI. Pages are thin: they call a `composables/use*.ts` hook for data and render it. No direct Firestore or `$fetch` calls inside `.vue` files beyond the composable layer.

**`composables/`** — client-side data hooks (`useContacts`, `useTasks`, ...), each wrapping `$fetch` to the matching `server/api/*` route and exposing `{ data, loading, error, reload }`. The mobile equivalents live in `mobile/hooks/*.ts` with the same shape, calling the same endpoints via `mobile/lib/api.ts`.

**`server/api/**`** — Nuxt server routes (Nitro), one file per REST operation (`tasks/index.get.ts`, `tasks/[id].put.ts`, ...). Every protected route calls `requireOrgId(event)` (`server/utils/auth.ts`) first and threads the returned `organizationId` into the matching `server/utils/*.ts` function — this is what enforces multi-tenant isolation (see [DATABASE.md](./DATABASE.md#multi-tenancy)).

**`server/utils/*.ts`** — one file per entity (`tasks.ts`, `contacts.ts`, ...), each exporting `list/get/create/update/delete` functions that take `organizationId` and talk to Firestore via `firebase-admin`. This is the only layer that touches Firestore directly.

**`server/services/{ai,email,whatsapp}/`** — provider abstractions. Each exposes a TypeScript interface (`AIService`, `EmailProvider`, `WhatsAppProvider`) plus a real mock/heuristic implementation used when no API key is configured, and a factory function (`getAIService()`, etc.) that picks the implementation based on environment variables. See [AI.md](./AI.md).

**`shared/`** — isomorphic types and zod validation schemas, imported by both `server/api` (request validation) and the UI (`pages/`, `mobile/app/`) for form validation, with zero duplication of field lists between client and server.

## Request flow example (create a task)

```
mobile/app/tasks.tsx or pages/tasks/index.vue
  → useTasks().create(input)                       (composable / hook)
  → shared/validation/task.ts: taskSchema.parse()   (client-side validation)
  → POST /api/tasks  (api.post / $fetch)
  → server/api/tasks/index.post.ts
      → requireUserSession(event)                   (nuxt-auth-utils)
      → requireOrgId(event)                          (server/utils/auth.ts)
      → shared/validation/task.ts: taskSchema.parse() (server-side validation, same schema)
      → server/utils/tasks.ts: createTask(input, organizationId)
      → Firestore write
  → 201 { task }
  → composable/hook updates local state
  → UI re-renders
```

The same zod schema validates both ends — there is exactly one definition of what a valid `Task` looks like, in `shared/validation/task.ts`.

## Multi-tenancy

See [DATABASE.md](./DATABASE.md#multi-tenancy) for the full data-isolation model (`organizationId` on every document, ownership checks returning 404 rather than 403 on mismatch).

## What's not built (see main README roadmap table for status)

- **RBAC beyond org membership** — `OrgRole` (`owner`/`admin`/`member`) exists on `OrganizationMember` but nothing currently branches on it; every member of an organization has full read/write access to that organization's data. See [SECURITY.md](./SECURITY.md#authorization).
- **Marketing Automation** (visual trigger/condition/action builder) — deliberately skipped; see README.
- **RAG / vector search** on Knowledge — the data model is ready (see [AI.md](./AI.md#knowledge--future-rag)), no embedding pipeline exists yet.
