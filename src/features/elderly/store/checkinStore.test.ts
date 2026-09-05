import { useCheckInStore, selectTodayCheckIn } from './checkinStore';
import api from '../../../core/api/client';

jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockApi = api as unknown as { get: jest.Mock; post: jest.Mock };

const apiRow = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 7,
  mood: 1,
  note: null,
  source: 'BUTTON',
  createdAt: '2026-09-06T07:30:00Z',
  ...over,
});

beforeEach(() => {
  useCheckInStore.setState({ todayByElderly: {}, submitting: false, error: null });
  jest.clearAllMocks();
});

describe('selectTodayCheckIn', () => {
  it('returns undefined when elderlyId is null (not loaded)', () => {
    expect(selectTodayCheckIn(useCheckInStore.getState(), null)).toBeUndefined();
  });

  it('returns undefined when that elderly has not been loaded yet', () => {
    expect(selectTodayCheckIn(useCheckInStore.getState(), '1')).toBeUndefined();
  });

  it('returns null once loaded with no check-in today', () => {
    useCheckInStore.setState({ todayByElderly: { '1': null } });
    expect(selectTodayCheckIn(useCheckInStore.getState(), '1')).toBeNull();
  });
});

describe('loadToday', () => {
  it('maps a check-in row into state keyed by elderly id', async () => {
    mockApi.get.mockResolvedValue({ status: 200, data: apiRow({ mood: 3 }) });

    await useCheckInStore.getState().loadToday('1');

    expect(mockApi.get).toHaveBeenCalledWith('/elderly/1/check-ins/today', { signal: undefined });
    expect(selectTodayCheckIn(useCheckInStore.getState(), '1')).toMatchObject({ id: '7', mood: 3 });
  });

  it('stores null for a 204 No Content response', async () => {
    mockApi.get.mockResolvedValue({ status: 204, data: '' });

    await useCheckInStore.getState().loadToday('2');

    expect(selectTodayCheckIn(useCheckInStore.getState(), '2')).toBeNull();
  });

  it('clamps an out-of-range mood to 2', async () => {
    mockApi.get.mockResolvedValue({ status: 200, data: apiRow({ mood: 9 }) });

    await useCheckInStore.getState().loadToday('3');

    expect(selectTodayCheckIn(useCheckInStore.getState(), '3')!.mood).toBe(2);
  });
});

describe('submit', () => {
  it('posts the mood and records the returned check-in as today', async () => {
    mockApi.post.mockResolvedValue({ status: 201, data: apiRow({ mood: 2 }) });

    const ok = await useCheckInStore.getState().submit('1', 2);

    expect(ok).toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/elderly/1/check-ins', {
      mood: 2,
      source: 'BUTTON',
    });
    expect(selectTodayCheckIn(useCheckInStore.getState(), '1')).toMatchObject({ mood: 2 });
    expect(useCheckInStore.getState().submitting).toBe(false);
  });

  it('returns false and sets an error when the request throws', async () => {
    mockApi.post.mockRejectedValue({ response: { data: { message: 'boom' } } });

    const ok = await useCheckInStore.getState().submit('1', 1);

    expect(ok).toBe(false);
    expect(useCheckInStore.getState().submitting).toBe(false);
    expect(useCheckInStore.getState().error).toMatch(/boom/);
  });
});
