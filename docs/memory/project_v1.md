---
name: Peptide Command Center v1.0
description: Project milestone - v1.0 released with full two-tier mixing, Supabase backend, multi-user auth, and verified protocols
type: project
---

Peptide Command Center v1.0 shipped 2026-03-27.

**Why:** Miguel (Grumpy) managing 297→200lb weight loss journey with peptide stack, plus fiancée Karen's 15lb goal.

**How to apply:** This is the baseline. Future work builds on Supabase backend, two-tier mixing (Master Vials → Pens), and verified protocol docs in /docs/.

Key architecture:
- Single-file HTML/JS on GitHub Pages
- Supabase backend (auth, RLS, real-time)
- Admin gated by email (grumpy94303@gmail.com) + is_admin flag
- 5 peptides: Retatrutide, MOTS-c, Wolverine (BPC-157+TB-500), Diamond Glow (GHK-Cu), Tirzepatide
- One Shot Window rule: morning OR evening per day, never both
- Zero-Shared Hardware: pens assigned per user
- Stall Rule and lifecycle tracking planned for future
