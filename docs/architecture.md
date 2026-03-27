# Architecture Overview

## System Overview

Peptide Command Center is a single-file web application (`index.html`, ~1585 lines) deployed as a static site on GitHub Pages. The entire frontend -- HTML, CSS, and JavaScript -- lives in one file with no build step.

**Backend:** Supabase (PostgreSQL + Auth + Realtime)

**CDN dependencies (loaded in `<head>`):**

| Library | CDN URL |
|---------|---------|
| Tailwind CSS | `https://cdn.tailwindcss.com` |
| Chart.js 4 | `https://cdn.jsdelivr.net/npm/chart.js@4` |
| Supabase JS v2 | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` |

No bundler, no framework, no npm -- the browser loads all three from CDN at runtime.

---

## Application Screens

The app has five screens plus a modal overlay, all declared as `<div>` blocks inside a single `<div id="app">` container. Only one screen is visible at a time; the others carry the `hidden` class.

| Screen | Element ID | Purpose |
|--------|-----------|---------|
| Auth | `screen-auth` | Email/password sign-in and sign-up |
| Dashboard | `screen-dashboard` | Daily protocol, shot logging, macro tracking, weight chart, date navigator |
| Admin Lab | `screen-lab` | Mixing calculator, master vial reconstitution, pen filling, inventory, dose management, peptide type management (admin only) |
| Workout Plan | `screen-workout` | Full multi-week workout plan view (Grumpy calisthenics, Karen treadmill) |
| Settings | `screen-settings` | Profile summary, all-users admin summary, data export, log history, sign-out |
| Modal | `modal-overlay` | Bottom-sheet overlay used for No-Go Foods list |

Transitions between screens use CSS slide animations (`slide-in-right` / `slide-in-left`) based on screen order, with the auth screen using a fade-in.

---

## Code Organization

The JavaScript in `<script>` is divided into 17 numbered sections:

| # | Section | Line | Description |
|---|---------|------|-------------|
| 1 | Supabase Config | 220 | `SUPABASE_URL`, `SUPABASE_ANON`, `ADMIN_EMAIL` constants; client init |
| 2 | Constants | 236 | Day names, per-user schedules (`GRUMPY_SCHEDULE`, `KAREN_SCHEDULE`, `GENERIC_SCHEDULE`), workout plans, no-go food lists |
| 3 | State | 319 | Module-level variables: `currentSession`, `currentProfile`, `todayLog`, `viewingDate`, cached arrays |
| 4 | Utilities | 333 | Date math, unit calculators (`calcUnits`, `calcUnitsFromConc`), schedule lookup (`getSchedule`), profile defaults (`getProfileDefaults`) |
| 5 | Supabase Data Layer | 390 | All async CRUD functions: `fetchProfile`, `ensureTodayLog`, `upsertTodayLog`, `fetchActiveMasters`, `fetchMyActivePens`, `insertPen`, inventory, etc. |
| 6 | Auth | 575 | `handleSignIn`, `handleSignUp`, `handleLogout` |
| 7 | Navigation | 621 | `showScreen`, `showModal`, `closeModal`; screen order array for directional slides |
| 8 | Auth Screen | 665 | `renderAuthForm` -- toggles between login and sign-up modes |
| 9 | Dashboard | 683 | `loadDashboard`, `renderDashboard` -- protocol card, shot buttons, macro tracker, workout section, weight chart, warnings |
| 10 | Daily Logging | 901 | `navDate`, `navToToday`, `saveDailyField`, `logShot`, `toggleWorkout`, `launchCelebration` |
| 11 | Weight Chart | 994 | `renderWeightChart` using Chart.js line chart with goal line |
| 12 | Admin Lab | 1020 | `loadLab`, `renderLab`, reconstitution, pen filling, dose management, inventory, peptide type CRUD |
| 13 | Workout Plan | 1345 | `renderWorkoutPlan` -- full plan view for Grumpy (4-week calisthenics) and Karen (12-week treadmill) |
| 14 | No-Go Modal | 1407 | `showNoGoModal` -- renders user's no-go foods in a bottom-sheet modal |
| 15 | Settings | 1430 | `loadSettings`, `renderSettings`, `exportMyData` |
| 16 | Real-Time Subscriptions | 1513 | `setupRealtime` -- subscribes to Postgres changes on `master_vials`, `pens`, `inventory`, `peptide_types` |
| 17 | Init | 1540 | `init` -- checks session, registers `onAuthStateChange`, boots into dashboard or auth |

---

## Authentication Model

- **Provider:** Supabase Auth with email/password (no OAuth, no magic link).
- **Admin detection:** The `isAdmin()` JS function checks `profile.is_admin === true` OR `currentSession.user.email === ADMIN_EMAIL`. The SQL helper `public.is_admin()` checks only the `is_admin` column in `profiles`.
- **ADMIN_EMAIL constant:** Hardcoded at line 227 as `grumpy94303@gmail.com`.
- **Auto-profile creation:** On first login, if no row exists in `profiles`, `fetchProfile()` auto-inserts one using `getProfileDefaults(displayName)`. Known names ("Grumpy"/"Miguel" and "Karen") get pre-populated macro targets, peptide stacks, doses, no-go foods, and a `program_start` date. Unknown names get generic defaults.
- **Sign-up flow:** `handleSignUp` calls `sb.auth.signUp` with `display_name` in user metadata, then immediately inserts a `profiles` row with defaults.

---

## Data Flow Pattern

1. **Parallel loading:** Dashboard calls `Promise.all` to fetch the day's log, user's active pens, active masters, weight history, weekly loss rate, and latest weight in one batch.
2. **Upsert pattern:** `upsertTodayLog` uses Supabase's `.upsert()` with `onConflict: 'user_id,log_date'`, so the first save creates the row and subsequent saves update it.
3. **Cached state:** `cachedMasters`, `cachedPens`, `cachedPeptideTypes`, and `cachedInventory` are refreshed on every data fetch and used for cross-referencing (e.g., finding a pen's concentration for unit calculation).
4. **Real-time subscriptions:** `setupRealtime()` opens a single Supabase channel (`lab-changes`) that listens for Postgres changes on four tables. When a change fires, it re-renders whichever screen is currently visible (dashboard or lab).
5. **Optimistic navigation:** `viewingDate` lets the user browse past dates. When navigating away from the dashboard, `viewingDate` resets to `null` (today).

---

## User-Specific Logic

The app customizes behavior based on `profile.display_name`:

- **Schedule selection:** `getSchedule()` returns `GRUMPY_SCHEDULE` for "Grumpy" or "Miguel", `KAREN_SCHEDULE` for "Karen", and `GENERIC_SCHEDULE` for anyone else.
- **Profile defaults:** `getProfileDefaults()` sets macro targets, peptide stacks, current doses, no-go foods, and program start date per user. Grumpy gets 2150 cal / 190-210g protein / 120 oz water; Karen gets 1200 cal / 90-100g protein / 80 oz water.
- **Workout plans:** Grumpy sees a 4-week progressive calisthenics plan (`GRUMPY_CALISTHENICS`). Karen sees a 12-week treadmill progression with weighted vest (`KAREN_TREADMILL`).
- **Zero-Shared Hardware:** Each pen is assigned to a specific user via `pens.assigned_to`. The dashboard fetches only `fetchMyActivePens()` (filtered by `currentSession.user.id`). No user ever sees dosing information for another user's pen.
- **Karen exclusions:** Karen's schedule omits "Wolverine" and "Retatrutide". She gets a "Protein First" reminder on morning workout days. Her no-go list includes a spinach allergy alert.
- **No-Go foods:** Stored as JSONB arrays of `{icon, text, alert}` objects in `profiles.no_go_foods`. Rendered in a modal with special red styling for allergy items (`alert: true`).

---

## Security Model

- **Row Level Security (RLS):** Enabled on all seven tables (`profiles`, `daily_logs`, `mixed_vials`, `peptide_types`, `inventory`, `master_vials`, `pens`).
- **Profiles:** Any authenticated user can read all profiles; users can only insert/update their own row (admins can update any).
- **Daily logs:** Users can CRUD their own logs. Admins can also read all logs (for the Settings summary).
- **Mixed vials / peptide_types / inventory / master_vials:** All authenticated users can read. Only admins can insert, update, or delete.
- **Pens:** After Migration 003, the select policy was replaced: users can only see pens where `assigned_to = auth.uid()`, while admins see all. Insert/update/delete remain admin-only.
- **Admin gating in UI:** The Admin Lab button (`btn-lab`) is hidden unless `isAdmin(profile)` returns true. All write operations for lab data call admin-gated Supabase functions that will be rejected by RLS if the caller is not an admin.
- **SQL helper function:** `public.is_admin()` is a `security definer` function that checks the `is_admin` column on the caller's profile row.
