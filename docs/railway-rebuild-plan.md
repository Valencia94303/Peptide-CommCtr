# Railway Rebuild Plan — Peptide Command Center

**Status:** Planning complete, not yet started.
**Created:** 2026-09-19
**Goal:** Rebuild the app off the single-file monolith and move hosting from GitHub
Pages + Supabase to a self-hosted stack on a personal Railway account, **without
losing any user data**.

---

## Locked decisions

| Decision | Choice |
|---|---|
| Frontend | **React 19 + Vite** (SPA), `vite-plugin-pwa` (Workbox) for the PWA |
| API / server | **Hono** (Node 22 LTS; Bun optional). Serves API under `/api/*` and the built React assets from one service — single URL, no CORS |
| Database | **Railway managed Postgres** (persistent, backed by a volume) |
| ORM / migrations | **Drizzle ORM** + drizzle-kit (migrations live in the repo, run on deploy) |
| Auth | Own session-cookie auth (httpOnly / SameSite=Lax / Secure) + **bcrypt**, reusing Supabase's existing password hashes |
| Authorization | Hono middleware (admin + owner checks) — replaces Supabase RLS |
| Realtime | **SSE** (`/api/events`, in-memory pub/sub) — replaces the 9 Supabase subscriptions |
| File storage | **Railway volume** at `/data/uploads` + an `attachments` table — for **progress photos / attachments** (new capability) |
| AI coach | Port the Deno edge function to a Hono `/api/coach` route |
| Cutover | **Phased** (get off GitHub Pages early; migrate DB + auth in a later phase) |
| Hard constraint | **Zero data loss for all users** (all `daily_logs` history, pens, measurements, profiles, etc.) |

---

## Why leaving Supabase means building a real backend

Supabase's model is *browser talks straight to Postgres*, with RLS as the security
layer and the anon key shipped in the client. A raw Railway Postgres **cannot** be
safely exposed to a browser, so self-hosting the DB forces a backend that re-creates
four things Supabase gave us for free: **auth, authorization (RLS), realtime, and the
edge function**. The upside: it's Postgres → Postgres, so **schema and data migrate
cleanly**, and the domain logic (mixing math, three-window scheduling, titration,
cycles, reference guide) ports as-is.

### Current coupling surface (measured 2026-09-19)
- **9 tables**, **57 `sb.from()` calls**: `daily_logs` (18), `pens` (11),
  `measurements` (6), `profiles` (5), `peptide_types` (4), `master_vials` (4),
  `coach_messages` (4), `inventory` (3), `messages` (2).
- **6 auth methods**: signUp, signInWithPassword, signOut, getSession,
  refreshSession, onAuthStateChange.
- **9 realtime subscriptions**.
- **0 storage usage** today (so no existing files to migrate).
- **1 Deno edge function** (Gemini coach).
- **15 hand-written `.sql` migration files** applied manually in the Supabase SQL editor.

---

## Target architecture

```
Railway project
├── web service (Node 22 + Hono)
│     ├── /api/*   → REST endpoints + /api/events (SSE) + /api/coach
│     └── /*       → built React/Vite assets (served static)
├── Postgres (managed, persistent)
└── volume mounted at /data/uploads  → progress photos / attachments
```

- **`/shared` domain package** (TypeScript, unit-tested): mixing/units math, the
  three-window logic (`morning`/`postbreakfast`/`evening`), titration, cycles, and
  `RECON_REFERENCE`. Imported by both client and server. **Ported with parity tests
  that prove identical results vs. the current app** — this is the health-critical core.
- **Secrets** via Railway env: `DATABASE_URL`, `SESSION_SECRET`, `GEMINI_API_KEY`.
- **PWA**: Workbox generates the precache manifest automatically → **the manual
  `sw.js CACHE_VERSION` bump ritual goes away permanently.**

### Data model port
- 9 existing tables map 1:1 into a Drizzle schema.
- New tables: `users` (id, email, bcrypt hash, created_at), `sessions`, `attachments`
  (path, owner, size, mime, created_at). `profiles.id` links to `users.id` (today
  `profiles.id == auth.users.id`).

---

## No-data-loss migration runbook

Postgres → Postgres dump-and-restore; Supabase is never edited in place.

1. `pg_dump` Supabase (schema + all rows) → keep as a snapshot artifact.
2. Restore into Railway Postgres. Export `auth.users` (id, email, **bcrypt
   `encrypted_password`**) into the new `users` table → **every user keeps their
   existing password, no resets** (bcrypt is bcrypt).
3. **Verify:** per-table row counts match Supabase, plus per-user spot checks
   (each of Grumpy/Karen/Daisy's `daily_logs`, `pens`, `measurements`, etc.).
4. Supabase stays the **live source of truth + fallback** through the whole build.
   At cutover: re-sync the delta, re-verify, flip the URL, then keep Supabase
   **read-only for ~2 weeks** before decommissioning. Worst case, flip back.

---

## Phases

### Phase 1 — Get off GitHub Pages + lay foundations (Supabase untouched)
- Stand up the Railway service; serve today's app from it with `Cache-Control:
  no-cache` on `index.html`/`sw.js` → immediate end to the cache-staleness pain,
  still pointing at Supabase.
- Scaffold the new stack (Vite/React/Hono/Drizzle/Dockerfile); provision Postgres
  + volume; add `/healthz` and push-to-deploy.
- Extract + unit-test the `/shared` domain logic.
- **Dry-run the data migration** into a staging Railway DB; verify counts.

### Phase 2 — Rebuild on the new stack (against Railway staging)
- Auth (bcrypt verify against imported hashes + session cookies), authz middleware
  (port the RLS rules), API endpoints replacing the 57 `sb.from` calls, SSE, the
  coach route, uploads to the volume.
- Rebuild the UI feature-for-feature (dashboard/windows, Lab, People, Inventory,
  Coach, onboarding), reusing `/shared`.
- Old app stays live for the family; new app on a staging URL for testing.

### Phase 3 — Verify + cutover
- Short maintenance window (3 users), final delta migration, re-verify
  counts/spot-checks.
- Flip everyone to the Railway URL (re-add PWA to home screen).
- Supabase read-only fallback + snapshot retained; decommission Supabase +
  GitHub Pages once confident.

---

## Risks & mitigations
- **Health-critical math** → parity unit tests before porting; never silently change a formula.
- **Rolling own auth** → minimal, vetted primitives (bcrypt, httpOnly/SameSite cookies), reuse existing hashes.
- **Realtime parity** → SSE tested for the "log on phone → see on iPad" flow.
- **Cutover** → fallback DB + snapshot + delta re-verify.

---

## Open items / to start Phase 1
- **Railway access:** decide how to drive it — `railway login` / `railway init`
  locally, or create the project + Postgres in the dashboard and provide `DATABASE_URL`.
- **First Phase-1 task:** either (a) scaffold repo + extract the tested `/shared`
  domain package, or (b) run the data-migration dry-run first.
