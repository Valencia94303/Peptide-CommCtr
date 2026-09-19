import type { ShotWindow, PeptideType } from './types';

// Three injection windows in daily order:
//   morning       = fasted (~7:30 AM, before food)
//   postbreakfast = with/after the first protein meal (~9:30 AM)
//   evening       = bedtime (2+ hrs after last meal)
export const SHOT_WINDOWS: ShotWindow[] = ['morning', 'postbreakfast', 'evening'];

export interface WindowMeta {
  chip: string;
  full: string;
  short: string;
  color: string;
}

export const WINDOW_META: Record<ShotWindow, WindowMeta> = {
  morning: { chip: '🌅 Fasted', full: '🌅 Morning — fasted', short: '🌅 AM', color: 'text-blue-400' },
  postbreakfast: { chip: '🍳 Post-BF', full: '🍳 Post-breakfast', short: '🍳 Post-BF', color: 'text-emerald-400' },
  evening: { chip: '🌙 Bedtime', full: '🌙 Evening — bedtime', short: '🌙 PM', color: 'text-purple-400' },
};

export function isShotWindow(w: unknown): w is ShotWindow {
  return w === 'morning' || w === 'postbreakfast' || w === 'evening';
}

// Effective window for a peptide: user override → peptide-type default → morning.
export function getPeptideWindow(
  peptide: string,
  peptideTypes: PeptideType[] = [],
  overrides: Record<string, ShotWindow> = {},
): ShotWindow {
  const own = overrides[peptide];
  if (isShotWindow(own)) return own;
  const type = peptideTypes.find((t) => t && t.name === peptide);
  if (type && isShotWindow(type.defaultWindow)) return type.defaultWindow;
  return 'morning';
}

export function groupShotsByWindow(
  shots: string[],
  peptideTypes: PeptideType[] = [],
  overrides: Record<string, ShotWindow> = {},
): Record<ShotWindow, string[]> {
  const out: Record<ShotWindow, string[]> = { morning: [], postbreakfast: [], evening: [] };
  for (const name of shots || []) {
    out[getPeptideWindow(name, peptideTypes, overrides)].push(name);
  }
  return out;
}
