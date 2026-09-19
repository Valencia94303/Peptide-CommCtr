import { describe, it, expect } from 'vitest';
import { getPeptideWindow, groupShotsByWindow, isShotWindow, SHOT_WINDOWS } from '@shared/windows';
import type { PeptideType } from '@shared/types';

const types: PeptideType[] = [
  { name: 'AOD-9604', defaultWindow: 'morning' },
  { name: '5-Amino-1MQ', defaultWindow: 'morning' },
  { name: 'NAD+', defaultWindow: 'postbreakfast' },
  { name: 'CJC / Ipamorelin', defaultWindow: 'evening' },
  { name: 'Retatrutide', defaultWindow: 'morning' },
  { name: 'MOTS-c', defaultWindow: 'morning' },
];

describe('windows', () => {
  it('NAD+ resolves to post-breakfast from its type default', () => {
    expect(getPeptideWindow('NAD+', types)).toBe('postbreakfast');
  });

  it('unknown peptide falls back to morning', () => {
    expect(getPeptideWindow('Mystery', types)).toBe('morning');
  });

  it('a user override beats the type default', () => {
    expect(getPeptideWindow('NAD+', types, { 'NAD+': 'evening' })).toBe('evening');
  });

  it("splits a Friday stack into all three windows", () => {
    const g = groupShotsByWindow(['AOD-9604', '5-Amino-1MQ', 'NAD+', 'CJC / Ipamorelin'], types);
    expect(g.morning).toEqual(['AOD-9604', '5-Amino-1MQ']);
    expect(g.postbreakfast).toEqual(['NAD+']);
    expect(g.evening).toEqual(['CJC / Ipamorelin']);
  });

  it('isShotWindow guards + SHOT_WINDOWS ordering', () => {
    expect(isShotWindow('postbreakfast')).toBe(true);
    expect(isShotWindow('midnight')).toBe(false);
    expect(SHOT_WINDOWS).toEqual(['morning', 'postbreakfast', 'evening']);
  });
});
