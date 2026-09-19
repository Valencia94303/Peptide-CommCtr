// Dates are treated as calendar days anchored at local noon, matching the legacy
// app's `new Date(str + 'T12:00:00')` convention (keeps day math off DST edges).
const NOON = 'T12:00:00';

export function toDate(dateStr: string): Date {
  return new Date(dateStr + NOON);
}

export function todayStr(now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(fromStr: string, toStr: string): number {
  return Math.floor((toDate(toStr).getTime() - toDate(fromStr).getTime()) / 86400000);
}

export function daysSince(dateStr: string, now: Date = new Date()): number {
  return daysBetween(dateStr, todayStr(now));
}

export function weekNum(programStart?: string | null, now: Date = new Date()): number {
  if (!programStart) return 1;
  return Math.max(1, Math.floor(daysSince(programStart, now) / 7) + 1);
}
