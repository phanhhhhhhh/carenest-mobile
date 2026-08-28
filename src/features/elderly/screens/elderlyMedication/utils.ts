export const UPCOMING_WINDOW_MS = 15 * 60 * 1000;

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}
