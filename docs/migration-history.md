# Migration History

All migrations live in the `docs/` directory and are run manually in the Supabase SQL Editor.

---

## Migration 001 -- Initial Schema

**File:** `docs/supabase-migration.sql`
**Date:** 2026-03-24

### What it creates

**Tables:**

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (display name, is_admin, start/goal weight, macro targets, peptide_type, current_doses, no_go_foods, program_start, warning_threshold) |
| `daily_logs` | One row per user per day (calories, protein, weight, water, fiber, shots JSONB, workout JSONB); unique on `(user_id, log_date)` |
| `mixed_vials` | Legacy single-step mixed vials (peptide, vial_mg, water_ml, mixed_date, depleted) |
| `peptide_types` | Catalog of available peptides (name, vial_size) |
| `inventory` | Unmixed vial counts (item_name, count) |

**Helper function:**

- `public.is_admin()` -- `security definer` SQL function that returns `true` if the calling user's profile has `is_admin = true`.

**RLS policies:**

- `profiles`: authenticated read all; insert own; update own or admin updates any.
- `daily_logs`: CRUD own rows; admin can also read all.
- `mixed_vials`, `peptide_types`, `inventory`: all authenticated can read; only admin can write.

**Seed data:**

- 4 peptide types: Retatrutide (20mg), Tirzepatide (10mg), MOTS-c (15mg), Glow Stack (70mg).
- 4 matching inventory rows initialized to count 0.

**Realtime:**

- `mixed_vials`, `inventory`, `peptide_types` added to `supabase_realtime` publication.

---

## Migration 002 -- Two-Tier Mixing

**File:** `docs/migration-002-two-tier-mixing.sql`
**Date:** 2026-03-26

### Rationale

The physical workflow has two steps: (1) reconstitute a lyophilized vial with BAC water to create a "master vial" (mother vial), then (2) draw from the master into smaller 3 mL injection pens, optionally diluting with additional BAC water. The original `mixed_vials` table modeled a single-step process and could not track remaining volume or per-pen concentrations.

### What it creates

**Tables:**

| Table | Key columns |
|-------|-------------|
| `master_vials` | `peptide`, `total_mg`, `total_ml`, `concentration` (mg/mL), `remaining_ml`, `mixed_date`, `depleted` |
| `pens` | `master_vial_id` (FK), `peptide`, `ml_from_master`, `ml_fresh_water`, `total_ml`, `mg_content`, `concentration` (mg/mL), `filled_date`, `depleted` |

**RLS policies:**

- Both tables: all authenticated can read; only admin can insert, update, delete.

**Realtime:**

- `master_vials` and `pens` added to `supabase_realtime` publication.

---

## Migration 003 -- Pen User Assignment (Zero-Shared Hardware)

**File:** `docs/migration-003-pen-user-assignment.sql`
**Date:** 2026-03-27

### Rationale

Injection pens must never be shared between users. Each pen needs to be assigned to a specific person so the dashboard only shows that person's pens and calculates dosing from the correct concentration.

### What it changes

- Adds `assigned_to uuid references public.profiles(id)` column to the `pens` table.
- Drops the old `pens_select` policy (which allowed all authenticated users to see all pens).
- Creates a new `pens_select` policy: `auth.uid() = assigned_to OR public.is_admin()`. Non-admin users see only pens assigned to them; admins see all.

### Impact on application code

- The Admin Lab "Fill a Pen" form gained an "Assign To" dropdown populated from all profiles.
- The dashboard calls `fetchMyActivePens()` which filters by `assigned_to = currentSession.user.id`.
- The Admin Lab calls `fetchActivePens()` which returns all non-depleted pens (admin sees all via RLS).

---

## Migration 007 -- Protocol Overrides

**File:** `docs/migration-007-protocol-overrides.sql`
**Date:** 2026-05-24

### Rationale

Weekly schedules used to live as hardcoded JS constants (`GRUMPY_SCHEDULE`, `KAREN_SCHEDULE`, etc.). Any tweak required a code change and redeploy. The admin needs to retune the protocol from the UI -- switch a day's window between morning fasted and evening bedtime, add or drop a peptide for a specific day -- without touching the source.

### What it changes

- Adds a nullable `schedule_override jsonb` column to `profiles`.
- Null means "use the built-in base schedule" (no behavior change).
- When set, the column is a partial map keyed by day-of-week (`0`..`6`, Sunday=0). Each value may contain `window` (`"morning"` or `"evening"`) and/or `shots` (an array of peptide names). Missing days fall back to the base schedule for that user.

### Impact on application code

- `getSchedule(profile)` now layers `profile.schedule_override` on top of the hardcoded base schedule from `getBaseSchedule(profile)`.
- The Admin Lab gains a "Protocol Editor" card that exposes a 7-day grid per user with a window dropdown and per-peptide toggle chips.
- `daily_logs.shots` entries are now objects (`{ at, mg, units }`) instead of bare ISO strings. The reader helper `getShotMeta()` accepts both formats, so legacy rows continue to render correctly.

---

## Migration 008 -- Titration, Cycles, and Daily Check-In

**File:** `docs/migration-008-titration-cycles-checkin.sql`
**Date:** 2026-05-25

### Rationale

Three Phase 2 features wanted small schema additions, so they were bundled into a single migration to keep deploys cheap.

1. **Dose titration schedules.** GLP-1 protocols (Tirzepatide, Retatrutide) escalate in stepped fashion. The admin defines a per-peptide list of `{ week, mg }` steps; the dashboard surfaces a "Time to step up" banner when the user reaches a scheduled week and their `current_doses` value lags.
2. **Peptide cycles.** Many peptides (MOTS-c is the canonical example) are run on/off for tissue tolerance. Admin defines `{ on_weeks, off_weeks, anchor_date }`. `getSchedule()` automatically drops the peptide on days that fall inside an off-week.
3. **Daily check-in fields.** Mood, energy, non-scale-victory text, and free-form notes per day. Surfaced as a dashboard card; powers future trend analysis and the upcoming AI coach.

### What it changes

- `profiles.titration_schedules jsonb` (nullable). Map of peptide → step array.
- `profiles.peptide_cycles jsonb` (nullable). Map of peptide → cycle config.
- `daily_logs.mood smallint`, `daily_logs.energy smallint`: 1–5 ratings, nullable.
- `daily_logs.nsv text`, `daily_logs.notes text`: free-form text, nullable.

### Impact on application code

- New helpers: `getDueTitrations(profile)`, `isPeptideOnCycle(profile, peptide, refDate)`.
- `getSchedule()` now filters per-peptide cycle on top of the stack filter from Migration 007.
- Dashboard renders a titration banner (with Apply / Not yet) and a Daily Check-In card.
- Admin Lab gains a "Titration & Cycles" card per user, per peptide.
- Backup payload includes the new columns automatically (it dumps the whole row).

---

## Writing New Migrations

### Naming convention

```
migration-NNN-short-description.sql
```

Examples: `migration-004-dose-escalation-log.sql`, `migration-005-add-notes-to-pens.sql`.

### File structure

Every migration file should start with a header comment block:

```sql
-- =====================================================
-- Migration NNN: Short Description
-- =====================================================
-- Run this AFTER migration NNN-1.
-- Purpose: one-sentence summary of what this adds or changes.
-- =====================================================
```

### Checklist

1. **Enable RLS** on any new table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
2. **Create RLS policies** following the existing pattern: authenticated read, admin write (or user-scoped read where appropriate).
3. **Add to realtime** if the table's changes should push live updates to the UI (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`).
4. **Test in a scratch Supabase project** before committing. Run the full migration sequence (001 through your new one) on a fresh project to verify no ordering issues.
5. **Update this file** (`migration-history.md`) with the new migration's date, rationale, and what it creates or changes.
6. **Commit the `.sql` file** to `docs/` alongside the existing migrations.
