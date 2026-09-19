// Dosing math, ported from the legacy `calcUnits` / `calcUnitsFromConc`.
// The legacy helpers returned a `toFixed(1)` STRING; here the core functions
// return numbers and `formatUnits` handles presentation, so callers can compute
// and format independently. Parity is covered in dosing.test.ts.

export function concentration(mg: number, ml: number): number {
  if (!mg || !ml) return 0;
  return mg / ml;
}

/** Syringe units for a dose given a mg/mL concentration (100 units = 1 mL). */
export function unitsFromConcentration(doseMg: number, concMgPerMl: number): number {
  if (!doseMg || !concMgPerMl) return 0;
  return (doseMg / concMgPerMl) * 100;
}

/** Syringe units for a dose drawn from a vial of `vialMg` reconstituted in `waterMl`. */
export function unitsFromVial(doseMg: number, vialMg: number, waterMl: number): number {
  if (!doseMg || !vialMg || !waterMl) return 0;
  return (doseMg / vialMg) * waterMl * 100;
}

/** Presentation helper matching the legacy `.toFixed(1)` output (e.g. "25.0"). */
export function formatUnits(units: number): string {
  return units.toFixed(1);
}
