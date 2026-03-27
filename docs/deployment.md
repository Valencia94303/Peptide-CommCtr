# Deployment Guide

## Prerequisites

- A GitHub account with a repository for the app
- A Supabase project (free tier is sufficient)

---

## GitHub Pages Setup

1. Push `index.html` to the root of the `main` branch.
2. Go to **Settings > Pages** in the repository.
3. Under **Source**, select **Deploy from a branch**.
4. Set the branch to `main` and the folder to `/ (root)`.
5. Save. GitHub will build and deploy the site within a few minutes.

**Live URL:** https://valencia94303.github.io/Peptide-CommCtr/

---

## Supabase Fresh Install

### 1. Run the three migrations in order

Open the **SQL Editor** in your Supabase dashboard and run each file sequentially:

| Order | File | What it creates |
|-------|------|-----------------|
| 1 | `docs/supabase-migration.sql` | `profiles`, `daily_logs`, `mixed_vials`, `peptide_types`, `inventory` tables; `is_admin()` function; RLS policies; seed data (4 peptide types + 4 inventory rows); realtime publication |
| 2 | `docs/migration-002-two-tier-mixing.sql` | `master_vials`, `pens` tables; RLS policies; realtime publication |
| 3 | `docs/migration-003-pen-user-assignment.sql` | `assigned_to` column on `pens`; updated `pens_select` RLS policy (user sees only own pens, admin sees all) |

Each migration must complete before running the next.

### 2. Disable email confirmation

Go to **Auth > Settings** (or **Auth > Providers > Email**) and turn off **Confirm email**. This allows immediate sign-in after sign-up without clicking a confirmation link.

### 3. Create the admin user

1. Open the app in a browser and click **New user? Create Account**.
2. Sign up with display name **Grumpy** and any email/password.
3. Back in the Supabase SQL Editor, run:
   ```sql
   UPDATE profiles SET is_admin = true WHERE display_name = 'Grumpy';
   ```
4. Refresh the app. The Admin Lab button (beaker icon) should now appear in the dashboard header.

### 4. Create the second user

1. Sign out of the app.
2. Sign up with display name **Karen** and a different email/password.
3. Karen's profile auto-populates with her specific macro targets, peptide stack, and no-go foods. No SQL needed.

---

## Making Changes

The entire application is a single file:

1. Edit `index.html` locally.
2. Commit and push to `main`.
3. GitHub Pages auto-deploys within 1-2 minutes.

There is no build step, no bundler, no CI pipeline. The file the browser loads is the file in the repository.

---

## Environment Variables

There are no `.env` files. Three constants are hardcoded near the top of `index.html` (lines 225-227):

```javascript
const SUPABASE_URL  = 'https://dyclhfmqhpogevecenxx.supabase.co';   // line 225
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';    // line 226
const ADMIN_EMAIL   = 'grumpy94303@gmail.com';                        // line 227
```

| Constant | Purpose | Where to find it |
|----------|---------|-------------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase dashboard > Settings > API > Project URL |
| `SUPABASE_ANON` | Public anonymous key (safe to expose in client code) | Supabase dashboard > Settings > API > Project API keys > `anon` `public` |
| `ADMIN_EMAIL` | Email address that always gets admin privileges in the JS `isAdmin()` check | Set to whatever email the admin user signs up with |

To point the app at a different Supabase project, replace all three values and push.

---

## Troubleshooting

- **"Permission denied" on inventory or lab actions:** The logged-in user's `profiles.is_admin` is `false`. Run the UPDATE statement from step 3 above.
- **Sign-up works but sign-in fails immediately after:** Email confirmation is still enabled. Disable it in Auth > Settings.
- **Pens not showing on dashboard:** Pens must have `assigned_to` set to the user's profile ID. Assign pens in the Admin Lab when filling them.
- **Changes not appearing after push:** GitHub Pages can take 1-2 minutes to rebuild. Hard-refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`) to bypass CDN cache.
