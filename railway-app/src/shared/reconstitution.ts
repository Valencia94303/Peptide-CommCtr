// Reconstitution reference, keyed by "<name>||<vial_size>" because the same
// peptide can carry different concentrations across sizes/protocols. Ported from
// the legacy RECON_REFERENCE. Recommended BAC water = vial mg / target conc.

export interface ReconEntry {
  conc: number; // target master concentration, mg/mL
  dose?: string;
  pull?: string;
  freq?: string;
}

export const RECON_REFERENCE: Record<string, ReconEntry> = {
  // Current concentrated SubQ stack (270 lb)
  'Retatrutide||30mg': { conc: 20, dose: '5.0 mg', pull: '25 units', freq: '1×/week (Mon)' },
  'AOD-9604||10mg': { conc: 5, dose: '500 mcg', pull: '10 units', freq: 'Daily' },
  '5-Amino-1MQ||50mg': { conc: 20, dose: '5.0 mg', pull: '25 units', freq: 'Daily' },
  'MOTS-c||40mg': { conc: 10, dose: '0.5 mg', pull: '5 units (10u @ 8mL)', freq: '4×/week (M/T/Th/S)' },
  'NAD+||1000mg': { conc: 400, dose: '100 mg', pull: '25 units', freq: '3×/week (M/W/F)' },
  'CJC / Ipamorelin||10mg': { conc: 5, dose: '250 mcg ea.', pull: '10 units', freq: 'Daily' },
  // Legacy household sizes (mix ratio only)
  'Retatrutide||20mg': { conc: 10 },
  'Wolverine||20mg': { conc: 10 },
  'MOTS-c||15mg': { conc: 10 },
  'Diamond Glow||70mg': { conc: 10 },
  'Tirzepatide||10mg': { conc: 5 },
};

export function parseVialMg(size?: string | null): number | null {
  if (!size) return null;
  const m = String(size).match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

export function reconRefFor(name: string, size?: string | null): ReconEntry | null {
  if (!name) return null;
  const target = `${name}||${size ?? ''}`;
  if (RECON_REFERENCE[target]) return RECON_REFERENCE[target];
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
  const key = Object.keys(RECON_REFERENCE).find((k) => norm(k) === norm(target));
  return key ? RECON_REFERENCE[key] : null;
}

/** BAC water (mL) to reconstitute `vialMg` at target `conc` mg/mL, rounded to 0.01. */
export function recommendedBacMl(vialMg: number, conc: number): number {
  if (!vialMg || !conc) return 0;
  return +(vialMg / conc).toFixed(2);
}
