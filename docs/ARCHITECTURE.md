# Architecture

## Why this shape, not a monorepo

The master spec suggests a monorepo (`apps/web`, `apps/mobile`, `packages/*`). VORA doesn't use one, deliberately: it was built as a sibling extension of the existing `portfolio-andrea` Nuxt codebase, whose stack (Nuxt 3, Vue 3, Tailwind, Firestore-less-yet) it inherits rather than replacing. Introducing a Turborepo/pnpm-workspace monorepo would mean rewriting the build tooling `portfolio-andrea` already has working, for no functional gain at this project's size — that's exactly the overengineering the spec's own §70 warns against ("prefer existing compatible technology... if the existing stack can be extended cleanly, prefer that over unnecessary rewrites").

Instead, sharing between web and mobile is done directly:

```
VORA/
├── shared/types/*.ts        # isomorphic TypeScript interfaces (Task, Contact, ...)
├── shared/validation/*.ts   # zod schemas, imported by both server/api and mobile forms
├── mobile/                  # Expo Router app, imports shared/ via a tsconfig path alias
```

`mobile/tsconfig.json` maps `@vora/shared/*` to `../shared/*`, and Metro's `watchFolders` includes the parent directory so the bundler can resolve it. There is no publish/build step for `shared/` — it's plain `.ts` consumed directly by both the Nuxt server (Node) and Expo (Hermes/Metro), which both support importing loose TypeScript from outside their own root without a package boundary.

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
