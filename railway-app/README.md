# Peptide Command Center — v2 (Railway rebuild)

React (Vite) + Hono, Postgres via Drizzle, deployed on Railway. See
`../docs/railway-rebuild-plan.md` for the full plan.

## Layout
- `src/shared` — framework-free, unit-tested domain logic (dosing math, injection
  windows, reconstitution reference, cycles, titration). Imported by both client
  and server via the `@shared/*` alias.
- `src/server` — Hono API + static hosting of the built client.
- `src/client` — React app (Vite, PWA).

## Scripts
- `npm test` — run the domain unit tests (no DB or network needed).
- `npm run dev:server` / `npm run dev:client` — local dev.
- `npm run build` — build the client into `dist/client`.
- `npm start` — run the server (serves API + built client).
- `npm run db:generate` / `db:migrate` — Drizzle migrations.

## Status
Phase 1 scaffold. Domain logic ported from the legacy single-file app with parity
tests. Auth, data endpoints, SSE, coach, and uploads land in Phase 2.
