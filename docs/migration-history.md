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
