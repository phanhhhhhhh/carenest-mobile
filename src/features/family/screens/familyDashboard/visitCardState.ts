import type { VisitStreak } from '../../store/visitStreakStore';

export type VisitCardState =
  'loading' | 'error' | 'disabled' | 'completed' | 'reminder' | 'unvisited';

export function getVisitCardState(
  streak: VisitStreak | undefined,
  error: string | null,
): VisitCardState {
  if (error && !streak) return 'error';
  if (!streak) return 'loading';
  if (!streak.enabled) return 'disabled';
  if (streak.visitedThisCycle) return 'completed';
  return streak.streakAtRisk ? 'reminder' : 'unvisited';
}
