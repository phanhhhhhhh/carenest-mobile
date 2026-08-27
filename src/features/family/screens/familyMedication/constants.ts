export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HISTORY_DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export type TabKey = 'today' | 'list' | 'history';

export interface TimeValue {
  hour: number;
  minute: number;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatIsoTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatLogDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function dayPatternLabel(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 0 || daysOfWeek.length === 7) return 'Hàng ngày';
  return [...daysOfWeek]
    .sort((a, b) => a - b)
    .map((d) => HISTORY_DAY_LABELS[d])
    .join(',');
}
