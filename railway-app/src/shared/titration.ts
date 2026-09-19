import type { SchedulingProfile, TitrationStep } from './types';
import { daysSince } from './time';

// 1-indexed week for a single peptide, measured from its titration anchor
// (falls back to programStart). Ported from the legacy peptideWeek.
export function peptideWeek(
  profile: SchedulingProfile,
  peptide: string,
  now: Date = new Date(),
): number {
  const anchor = profile.titrationAnchors?.[peptide] || profile.programStart;
  if (!anchor) return 1;
  return Math.max(1, Math.floor(daysSince(anchor, now) / 7) + 1);
}

export interface DueTitration {
  peptide: string;
  from: number | undefined;
  to: number;
  week: number;
}

// Peptides whose latest applicable titration step doesn't match current_doses,
// i.e. the user is due to step up. Ported from the legacy getDueTitrations.
export function getDueTitrations(
  profile: SchedulingProfile,
  now: Date = new Date(),
): DueTitration[] {
  const sched = profile.titrationSchedules || {};
  const doses = profile.currentDoses || {};
  const due: DueTitration[] = [];
  for (const [peptide, steps] of Object.entries(sched)) {
    if (!Array.isArray(steps) || steps.length === 0) continue;
    const wk = peptideWeek(profile, peptide, now);
    const applicable = steps
      .filter((s: TitrationStep) => s && typeof s.mg === 'number' && Number(s.week) <= wk)
      .sort((a, b) => b.week - a.week)[0];
    if (!applicable) continue;
    const current = doses[peptide];
    if (current !== applicable.mg) {
      due.push({ peptide, from: current, to: applicable.mg, week: applicable.week });
    }
  }
  return due;
}
