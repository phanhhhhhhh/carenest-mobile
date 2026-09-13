import { parseStreak } from './visitStreakStore';

describe('parseStreak', () => {
  it.each([true, false])('parses enabled=%s from the Visit Streak response', (enabled) => {
    const parsed = parseStreak({
      elderlyId: 1,
      elderlyName: 'Ba Sau',
      enabled,
      cycleType: 'WEEKLY',
      currentStreak: 0,
      longestStreak: 0,
      streakAtRisk: false,
      visitedThisCycle: false,
      recentVisits: [],
    });

    expect(parsed.enabled).toBe(enabled);
  });
});
