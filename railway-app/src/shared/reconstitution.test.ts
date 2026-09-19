import { describe, it, expect } from 'vitest';
import { reconRefFor, recommendedBacMl, parseVialMg } from '@shared/reconstitution';

describe('reconstitution', () => {
  it('recommended BAC water for the current stack', () => {
    expect(recommendedBacMl(1000, 400)).toBe(2.5); // NAD+ 1000mg -> 400 mg/mL
    expect(recommendedBacMl(40, 10)).toBe(4); // MOTS-c 40mg -> 10 mg/mL
    expect(recommendedBacMl(30, 20)).toBe(1.5); // Retatrutide 30mg -> 20 mg/mL
    expect(recommendedBacMl(50, 20)).toBe(2.5); // 5-Amino-1MQ 50mg -> 20 mg/mL
  });

  it('is size-aware: legacy vs current concentrations differ', () => {
    expect(reconRefFor('Retatrutide', '30mg')?.conc).toBe(20);
    expect(reconRefFor('Retatrutide', '20mg')?.conc).toBe(10);
    expect(reconRefFor('NAD+', '1000mg')?.conc).toBe(400);
    expect(reconRefFor('NAD+', '100mg')).toBeNull(); // legacy 100mg has no stored formula
  });

  it('lookup is case/space tolerant', () => {
    expect(reconRefFor('cjc / ipamorelin', '10mg')?.conc).toBe(5);
  });

  it('parseVialMg pulls the leading number', () => {
    expect(parseVialMg('1000mg')).toBe(1000);
    expect(parseVialMg('40mg')).toBe(40);
    expect(parseVialMg(null)).toBeNull();
  });
});
