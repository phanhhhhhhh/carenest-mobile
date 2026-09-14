import { parseStreak } from '../../store/visitStreakStore';
import { getVisitCardState } from './visitCardState';

const streak = parseStreak({
  elderlyId: 1,
  elderlyName: 'Mẹ',
  enabled: true,
  cycleType: 'WEEKLY',
  currentStreak: 3,
  longestStreak: 4,
  streakAtRisk: false,
  visitedThisCycle: false,
  recentVisits: [],
});

describe('getVisitCardState', () => {
  it('returns loading without exposing another profile state', () => {
    expect(getVisitCardState(undefined, null)).toBe('loading');
  });

  it('returns a retryable error state', () => {
    expect(getVisitCardState(undefined, 'Offline')).toBe('error');
  });

  it('returns setup for disabled or not-yet-configured state', () => {
    expect(getVisitCardState({ ...streak, enabled: false }, null)).toBe('disabled');
  });

  it('distinguishes completed, neutral unvisited, and reminder-window states', () => {
    expect(getVisitCardState({ ...streak, visitedThisCycle: true }, null)).toBe('completed');
    expect(getVisitCardState(streak, null)).toBe('unvisited');
    expect(getVisitCardState({ ...streak, streakAtRisk: true }, null)).toBe('reminder');
  });
});
