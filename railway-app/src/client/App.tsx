import { SHOT_WINDOWS, WINDOW_META } from '@shared/windows';

// Placeholder shell — proves the @shared alias resolves in the client build.
// The real UI (dashboard/lab/people/inventory/coach) is ported in Phase 2.
export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1>Peptide Command Center — v2</h1>
      <p>Railway rebuild scaffold is online.</p>
      <p>Injection windows: {SHOT_WINDOWS.map((w) => WINDOW_META[w].chip).join('  ·  ')}</p>
    </main>
  );
}
