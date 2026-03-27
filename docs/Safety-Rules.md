# Safety & App Logic Rules

## One Shot Window Rule

Each day has exactly ONE injection window -- morning OR evening, never both.

- **Morning Shot Days** (Mon/Tue/Thu/Sat): Fasted shots only. Evening dashboard is empty.
- **Evening Shot Days** (Wed/Fri/Sun): Bedtime shots only. Morning dashboard is empty.

The app must enforce this. Zero days where both windows are active.

---

## Zero-Shared Hardware

Miguel and Karen have separate physical pens. The app must:

- Track pens as user-assigned (each pen has an owner)
- Never show another user's pens on the dashboard
- Allow different dilution ratios for the same peptide across users (e.g., Grumpy's Glow pen at 1:1 vs Karen's at a different ratio)

---

## Fasting Protocols

### Morning Fasted Shots
- Must be strictly fasted (water only)
- Inject 30 minutes before activity
- Do not eat for at least 1 hour after injection

### Evening Bedtime Shots
- Ideally 2 hours after last bite of food
- **Late Meal Rule**: If eating late, do not stay up to hit the 2-hour window. Take the shot and go to sleep. Rest is more important than perfect timing.

---

## The Stall Rule

The app does NOT automatically suggest a dose increase. It checks for "Metabolic Stall" conditions:

### Conditions (ALL must be true for 3 consecutive weeks)

1. **Weight**: Less than 0.5% body weight loss per week
2. **Compliance**: 100% of MOTS-c + Wolverine (Grumpy) or MOTS-c (Karen) shots logged
3. **Protein**: Daily floor met consistently (210g Grumpy / 100g Karen)

### Alerts
- Grumpy: "Metabolic Stall Detected. Consider 0.5mg Reta increase."
- Karen: "Metabolic Stall Detected. Consider Tirz increase to next tier."

### Dose Increase Rules
- Only increase in 0.5mg or 1mg increments
- Never skip tiers (e.g., 1.0mg to 1.5mg, not 1.0mg to 3.0mg)
- The 3-Week Rule resets after every adjustment

---

## Gaunt Check

Applies to users under 150 lbs. If weight loss exceeds 2 lbs/week:

- Trigger: "Warning: Losing too fast"
- Action: Suggest increasing calories by 150 kcal
- Purpose: Protect muscle mass, collagen, skin, and hair

---

## Over-Loss Warning

Per-user thresholds for weekly loss rate:

- **Grumpy**: Alert if losing more than 4 lbs/week (risk of muscle wasting, "Ozempic face")
- **Karen**: Alert if losing more than 2 lbs/week (Gaunt Check threshold)

---

## Vial & Pen Expiry

- **28-day rule**: Both master vials and pen cartridges should be replaced after 28 days from reconstitution/fill date
- **25-day warning**: Amber warning when approaching expiry
- **28+ days**: Red pulsing alert, "EXPIRED -- REPLACE"

---

## Prohibited Foods

### Grumpy
- Fried foods
- Carbonated drinks
- Liquid sugar (juice, soda, sweet tea)
- Raw cruciferous veggies (broccoli, cauliflower, cabbage)

### Karen (all of the above PLUS)
- SPINACH -- ALLERGY (substitute: Bok Choy, Romaine, Cabbage)
- Fried tempura, crispy tacos

---

## Supplies Checklist

- Insulin syringes: 1mL (100 unit) for accuracy
- Insulin pens: 1mL (100 unit) for daily shots
- 3mL pen cartridges for secondary fills
- Bacteriostatic water for reconstitution
- Alcohol swabs for vial tops and injection sites
- Sharps container for safe disposal
- Dedicated fridge section for peptides
