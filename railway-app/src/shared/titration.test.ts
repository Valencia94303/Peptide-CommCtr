import { describe, it, expect } from 'vitest';
import { getDueTitrations, peptideWeek } from '@shared/titration';
import type { SchedulingProfile } from '@shared/types';

describe('titration', () => {
  const now = new Date('2026-09-19T12:00:00');
  const profile: SchedulingProfile = {
    programStart: '2026-07-24',
    currentDoses: { Semax: 0.25 },
    titrationSchedules: { Semax: [{ week: 1, mg: 0.25 }, { week: 3, mg: 0.5 }] },
  };

  it('computes peptide week from the anchor', () => {
    // 2026-07-24 -> 2026-09-19 = 57 days -> floor(57/7)+1 = 9
    expect(peptideWeek(profile, 'Semax', now)).toBe(9);
  });

  it('flags a due step-up when the current dose lags the applicable step', () => {
    const due = getDueTitrations(profile, now);
    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({ peptide: 'Semax', from: 0.25, to: 0.5, week: 3 });
  });

  it('no due titration once the current dose matches', () => {
    const matched: SchedulingProfile = { ...profile, currentDoses: { Semax: 0.5 } };
    expect(getDueTitrations(matched, now)).toHaveLength(0);
  });
});
