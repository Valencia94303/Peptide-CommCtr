import type { CycleConfig } from './types';
import { daysBetween } from './time';

// True if a peptide is in its "on" phase for the given reference date.
// No cycle configured (or degenerate config) = always on. Ported from the legacy
// isPeptideOnCycle: week index from the anchor, modulo the (on+off) period.
export function isPeptideOnCycle(
  cycle: CycleConfig | null | undefined,
  refDate: string,
): boolean {
  if (!cycle) return true;
  const on = Number(cycle.onWeeks) || 0;
  const off = Number(cycle.offWeeks) || 0;
  if (on <= 0 || on + off <= 0) return true;
  if (!cycle.anchorDate) return true;
  const days = daysBetween(cycle.anchorDate, refDate);
  if (days < 0) return true; // before anchor: treat as on
  const period = on + off;
  const week = Math.floor(days / 7);
  return week % period < on;
}
