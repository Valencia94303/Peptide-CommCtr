# Changelog

## v1.0.0 -- 2026-03-27

Initial public release of Peptide Command Center.

### Authentication and Multi-User

- Email/password authentication via Supabase Auth.
- Auto-profile creation with per-user defaults (Grumpy, Karen, or generic).
- Admin role with `is_admin` flag and `ADMIN_EMAIL` fallback.
- Admin Lab screen gated to admin users only.

### Two-Tier Mixing System

- Master Vial reconstitution: record peptide, mg, BAC water volume, and date; auto-calculate concentration (mg/mL) and track remaining volume.
- Pen filling: draw from a master vial into a 3 mL pen, optionally dilute with fresh BAC water; auto-calculate pen concentration.
- Mixing Calculator with quick dose lookup (mg to units).
- Inventory tracker for unmixed vial counts, auto-decremented on reconstitution.
- Manage Peptide Types: add and remove peptides available across the app.

### Zero-Shared Hardware

- Each pen assigned to a specific user via `assigned_to` column.
- Dashboard shows only the logged-in user's pens.
- RLS policy enforces pen visibility at the database level.

### Schedules and Protocols

- Per-user weekly schedules: Grumpy (Retatrutide + MOTS-c + Wolverine + Diamond Glow), Karen (Tirzepatide + MOTS-c + Diamond Glow), Generic.
- One Shot Window rule: each day is either morning fasted or evening bedtime, never both.
- Five peptides seeded: Retatrutide (20mg), Tirzepatide (10mg), MOTS-c (15mg), Glow Stack (70mg), plus Wolverine and Diamond Glow in user schedules.
- Per-peptide shot logging with individual Log Shot buttons and auto-calculated unit dosing from pen concentration.
- User Dose Management in Admin Lab: set each user's current mg dose per peptide.

### Daily Tracking

- Macro tracker: calories, protein, water, fiber (Grumpy) or calories, protein, water, weight (Karen/generic).
- Weight logging with daily weigh-in prompt.
- Upsert pattern: first save creates the day's log, subsequent saves update it.

### Weight Chart

- Chart.js 4 line chart showing weight history with goal line overlay.
- Progress bar: total lbs lost, lbs remaining, percentage to goal.

### Safety Warnings

- No-Go Foods modal with per-user food lists; allergy items highlighted in red (Karen: spinach allergy).
- Gaunt Check warning: triggers when weight is below 150 lbs and weekly loss rate exceeds 2 lbs/week.
- Losing Too Fast warning: triggers when weekly loss rate exceeds the user's `warning_threshold`.
- Expiry warnings: master vials and pens show yellow at 25 days, red with pulse animation at 28 days.

### Real-Time Sync

- Supabase Realtime subscriptions on `master_vials`, `pens`, `inventory`, and `peptide_types`.
- Dashboard and Admin Lab auto-refresh when another client makes changes.

### Celebrations

- Firework animation and motivational sticker on workout completion (12 randomized messages).

### Data Export

- Settings screen: "Export My Logs" downloads profile and all daily log history as a JSON file.

### Date Navigator

- Left/right arrows to browse past dates from the dashboard.
- "Jump to Today" button when viewing a past date.
- Past-date indicator banner.

### UI Polish

- Dark theme with amber accent gradient (Tailwind CSS utility classes).
- Glass-effect sticky header with backdrop blur.
- Staggered card entrance animations, slide transitions between screens.
- Progress bar fill animations with staggered delays.
- Protocol card breathing glow animation.
- Shot button check-pop and ripple animations on log.
- Floating idle animation on auth screen icon.
- Bottom-sheet modal pattern on mobile, centered on desktop.
- Safe-area padding for notched mobile devices.
- Number spinner removal on numeric inputs.
- Mobile-optimized: `maximum-scale=1.0`, `user-scalable=no`, touch highlight suppression.

### Workout Plans

- Grumpy: 4-week progressive calisthenics (Foundation, Build, Progress, Push) with specific exercises and rep schemes.
- Karen: 12-week treadmill program (Baseline, Progression, Power Burn) with 8 lb weighted vest, incline, speed, and session targets.
- Karen: "Protein First" reminder on morning workout days.

### Settings

- Profile summary with current week calculation.
- Admin view: all-users daily summary (today's weight, calories, protein, workout status).
- Recent 14-day log history.
- Sign-out button.
