import { describe, it, expect } from 'vitest';
import { unitsFromConcentration, unitsFromVial, concentration, formatUnits } from '@shared/dosing';

describe('dosing', () => {
  it('units from concentration match the 270lb protocol', () => {
    expect(unitsFromConcentration(100, 400)).toBe(25); // NAD+ 100mg @ 400 mg/mL
    expect(unitsFromConcentration(0.5, 10)).toBe(5); // MOTS-c 0.5mg @ 10 mg/mL
    expect(unitsFromConcentration(5, 20)).toBe(25); // Retatrutide 5mg @ 20 mg/mL
    expect(unitsFromConcentration(0.5, 5)).toBe(10); // AOD-9604 0.5mg @ 5 mg/mL
  });

  it('guards missing inputs to 0 (parity with legacy)', () => {
    expect(unitsFromConcentration(0, 400)).toBe(0);
    expect(unitsFromConcentration(100, 0)).toBe(0);
  });

  it('units from vial (legacy calcUnits parity)', () => {
    expect(unitsFromVial(1, 20, 2)).toBe(10);
  });

  it('concentration', () => {
    expect(concentration(1000, 2.5)).toBe(400);
    expect(concentration(40, 4)).toBe(10);
    expect(concentration(0, 5)).toBe(0);
  });

  it('formatUnits matches legacy toFixed(1) strings', () => {
    expect(formatUnits(25)).toBe('25.0');
    expect(formatUnits(5)).toBe('5.0');
  });
});
