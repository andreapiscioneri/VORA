# Database

VORA uses **Firestore** (via `firebase-admin`, server-side only — the client never talks to Firestore directly, only to the Nuxt API). There is no ORM; `server/utils/*.ts` files are thin, explicit wrappers around the Firestore SDK, one file per entity.

## Local development: the emulator

```bash
firebase emulators:start --only firestore
```

No real Firebase project or credentials are needed for this — it's a local, in-memory Firestore emulator, configured by `firebase.json` and pointed at by `FIRESTORE_EMULATOR_HOST=localhost:8080` in `.env`. Data does not persist across emulator restarts unless you pass `--export-on-exit`/`--import`.

Emulator UI (browse collections, inspect documents): http://127.0.0.1:4000

### JDK version

The emulator needs JDK 21+. If only JDK 17 is on `PATH`:

```bash
JAVA_HOME=$(brew --prefix openjdk@21) PATH="$(brew --prefix openjdk@21)/bin:$PATH" firebase emulators:start --only firestore
```

## Pointing at the real Firebase project

A real project (`vora-piscioneri`, under `andrypiscioneri@gmail.com`) exists, with Firestore enabled and `firestore.rules` deployed:

```bash
cp .env.production.example .env.production
# GOOGLE_APPLICATION_CREDENTIALS must point at .secrets/firebase-adminsdk.json (gitignored)
```

Run without `FIRESTORE_EMULATOR_HOST` set — don't run the emulator alongside a real-project connection, they're mutually exclusive. The service-account key lives in `.secrets/firebase-adminsdk.json`; never commit it or paste its contents anywhere.

## Collections

One Firestore collection per entity, named after the plural entity (e.g. `tasks`, `contacts`, `opportunities`). No subcollections are used — every document is flat and top-level, scoped by an `organizationId` field rather than by nesting, which keeps every `server/utils/*.ts` query shape identical:

```
users
organizations
organizationMembers
contacts
opportunities   (CRM)
tasks
projects
timesheetEntries
calendarEvents
appointments
communications
tickets          (Helpdesk)
knowledgeDocuments
employees
leaveRequests
expenses
socialPosts
campaigns        (Email marketing)
microsites
```

## Multi-tenancy

Every collection except `users`, `organizations`, and `organizationMembers` carries an `organizationId: string` field. The isolation rule is enforced uniformly across every `server/utils/*.ts` file:

- **List** queries filter with `.where('organizationId', '==', organizationId)`. Results are sorted in application code (not via Firestore `.orderBy()`), specifically to avoid the composite-index requirement that combining `.where()` + `.orderBy()` on different fields would otherwise force.
- **Get / update / delete** first fetch the document, then check `doc.data()?.organizationId !== organizationId` — on mismatch, the function returns `null`/`false`, and the calling API route responds with a plain **404**, not 403. This is deliberate: a 403 confirms to a malicious caller that a document with that ID exists in someone else's organization; a 404 gives no such signal, matching how Firestore document IDs are globally unique but must never leak cross-tenant existence.

Two collections are intentionally **not** organization-scoped:
- `microsites`' `getSiteBySlug` / `isSlugTaken` — site slugs (`/site/<slug>`) are public and must be globally unique across all organizations, by design.
- `users` — a user's core identity record is global; their organization membership (and therefore their access scope) lives in `organizationMembers`.

See [ARCHITECTURE.md](./ARCHITECTURE.md#multi-tenancy) for how this ties into the API layer (`requireOrgId(event)`), and [SECURITY.md](./SECURITY.md#tenant-isolation) for how it was verified.

## Indexes

`firestore.indexes.json` — currently empty/minimal because the org-scoping strategy above (in-memory sort instead of `.orderBy()` combined with `.where()`) avoids most composite-index requirements. Add an index here (and redeploy with `firebase deploy --only firestore:indexes`) only if a genuinely new query pattern needs one — don't add indexes speculatively.

## Seed data

```bash
yarn dev            # terminal 1 — must be running first
yarn db:seed         # terminal 2
```

`scripts/seed.mjs` registers a fresh demo organization (`demo-<timestamp>@vora.test` / `DemoPass1234`, printed at the end) and populates it with realistic fake data across every core module — 6 contacts, 5 CRM opportunities, 3 projects, 8 tasks, 4 appointments, 6 inbox communications (mixed email/WhatsApp/internal, inbound/outbound), 4 helpdesk tickets, 3 knowledge documents, 3 employees, 3 leave requests, 6 timesheet entries, 3 expenses, 4 calendar events. No real personal information anywhere — names/companies/emails are all obviously fictional (`@*.example` domains, generic Italian names).

It's a plain Node script (`.mjs`, no TypeScript build step) that calls the real REST API (`fetch` against `http://localhost:3100/api`, manually carrying the session cookie across requests) rather than writing to Firestore directly — so every seeded record goes through the same validation, multi-tenancy scoping, and business logic as data created through the UI. Re-running it registers a new demo organization each time (the email has a timestamp suffix) instead of duplicating data into an existing one.
