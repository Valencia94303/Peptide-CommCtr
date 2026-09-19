import { describe, it, expect } from 'vitest';
import { isPeptideOnCycle } from '@shared/cycles';

describe('cycles', () => {
  // MOTS-c: 8 weeks on, 4 weeks off, anchored at the block start.
  const cyc = { onWeeks: 8, offWeeks: 4, anchorDate: '2026-07-24' };

  it('on during weeks 0–7', () => {
    expect(isPeptideOnCycle(cyc, '2026-07-24')).toBe(true); // week 0
    expect(isPeptideOnCycle(cyc, '2026-09-10')).toBe(true); // ~week 6
  });

  it('off during weeks 8–11', () => {
    expect(isPeptideOnCycle(cyc, '2026-09-18')).toBe(false); // week 8
  });

  it('back on after the 12-week period wraps', () => {
    expect(isPeptideOnCycle(cyc, '2026-10-16')).toBe(true); // week 12 -> 0
  });

  it('no cycle = always on', () => {
    expect(isPeptideOnCycle(null, '2026-09-18')).toBe(true);
  });

  it('before the anchor = on', () => {
    expect(isPeptideOnCycle(cyc, '2026-07-01')).toBe(true);
  });
});
