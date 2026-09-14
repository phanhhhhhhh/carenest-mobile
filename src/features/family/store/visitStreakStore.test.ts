import api from '../../../core/api/client';
import { parseStreak, useVisitStreakStore } from './visitStreakStore';

jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), patch: jest.fn() },
}));

const streakResponse = {
  elderlyId: 1,
  elderlyName: 'Ba Sau',
  enabled: true,
  cycleType: 'WEEKLY',
  currentStreak: 2,
  longestStreak: 3,
  streakAtRisk: false,
  visitedThisCycle: true,
  recentVisits: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  useVisitStreakStore.setState({
    byElderly: {},
    isLoading: false,
    isSubmitting: false,
    error: null,
  });
});

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

describe('confirmVisit', () => {
  it('returns success, stores the streak, and resets submitting', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: streakResponse });

    const result = await useVisitStreakStore.getState().confirmVisit('1', { note: 'Lunch' });

    expect(result).toEqual({ status: 'success' });
    expect(useVisitStreakStore.getState().byElderly['1'].currentStreak).toBe(2);
    expect(useVisitStreakStore.getState().isSubmitting).toBe(false);
  });

  it('returns possible_duplicate only for the exact 409 code without setting an error', async () => {
    (api.post as jest.Mock).mockRejectedValue({
      response: { status: 409, data: { code: 'POSSIBLE_DUPLICATE_VISIT' } },
    });

    const result = await useVisitStreakStore.getState().confirmVisit('1', {
      note: 'Keep this note',
    });

    expect(result).toEqual({ status: 'possible_duplicate' });
    expect(useVisitStreakStore.getState().error).toBeNull();
    expect(useVisitStreakStore.getState().byElderly).toEqual({});
    expect(useVisitStreakStore.getState().isSubmitting).toBe(false);
  });

  it('treats an unknown 409 as a normal error and resets submitting', async () => {
    (api.post as jest.Mock).mockRejectedValue({
      response: { status: 409, data: { code: 'SOME_OTHER_CONFLICT', error: 'Conflict' } },
    });

    const result = await useVisitStreakStore.getState().confirmVisit('1');

    expect(result).toEqual({ status: 'error', message: 'Không xác nhận được: Conflict' });
    expect(useVisitStreakStore.getState().error).toBe('Không xác nhận được: Conflict');
    expect(useVisitStreakStore.getState().isSubmitting).toBe(false);
  });

  it('includes the explicit separate-visit override and visit timestamp', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: streakResponse });

    await useVisitStreakStore.getState().confirmVisit('1', {
      note: 'Second visit',
      visitedAt: '2026-09-14T08:00:00+07:00',
      confirmSeparateVisit: true,
    });

    expect(api.post).toHaveBeenCalledWith('/elderly/1/visits', {
      note: 'Second visit',
      visitedAt: '2026-09-14T08:00:00+07:00',
      confirmSeparateVisit: true,
    });
    expect(useVisitStreakStore.getState().isSubmitting).toBe(false);
  });

  it('returns a normal failure and resets submitting', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Offline'));

    const result = await useVisitStreakStore.getState().confirmVisit('1');

    expect(result).toEqual({ status: 'error', message: 'Không xác nhận được: Offline' });
    expect(useVisitStreakStore.getState().isSubmitting).toBe(false);
  });
});
