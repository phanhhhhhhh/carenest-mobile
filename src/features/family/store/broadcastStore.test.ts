import { useBroadcastStore, selectActiveBroadcast } from './broadcastStore';
import api from '../../../core/api/client';
import { showErrorToast } from '../../../shared/components/toastStore';

jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock('../../../shared/components/toastStore', () => ({ showErrorToast: jest.fn() }));

const mockApi = api as unknown as { get: jest.Mock; patch: jest.Mock };

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 3,
  elderlyId: 10,
  triggerType: 'CHECK_IN_UNWELL',
  title: 'Bà đang mệt',
  body: 'x',
  status: 'ACTIVE',
  startedAt: '2026-09-06T08:00:00Z',
  ...over,
});

beforeEach(() => {
  useBroadcastStore.setState({ byElderly: {}, acknowledgingId: null });
  jest.clearAllMocks();
});

describe('load / selectActiveBroadcast', () => {
  it('exposes the first ACTIVE or ESCALATED broadcast', async () => {
    mockApi.get.mockResolvedValue({ data: [row({ status: 'ESCALATED' })] });

    await useBroadcastStore.getState().load('10');

    const b = selectActiveBroadcast(useBroadcastStore.getState(), '10');
    expect(b?.id).toBe('3');
    expect(b?.status).toBe('ESCALATED');
  });

  it('fails quiet on error (banner is non-critical)', async () => {
    mockApi.get.mockRejectedValue(new Error('boom'));
    await useBroadcastStore.getState().load('10');
    expect(selectActiveBroadcast(useBroadcastStore.getState(), '10')).toBeUndefined();
  });
});

describe('acknowledge', () => {
  beforeEach(() => {
    useBroadcastStore.setState({
      byElderly: { '10': [{ ...row(), id: '3' } as never] },
    });
  });

  it('removes the broadcast from state on success', async () => {
    mockApi.patch.mockResolvedValue({});

    const ok = await useBroadcastStore.getState().acknowledge('10', '3');

    expect(ok).toBe(true);
    expect(mockApi.patch).toHaveBeenCalledWith('/broadcasts/3/acknowledge');
    expect(selectActiveBroadcast(useBroadcastStore.getState(), '10')).toBeUndefined();
  });

  it('keeps state and toasts on failure', async () => {
    mockApi.patch.mockRejectedValue(new Error('nope'));

    const ok = await useBroadcastStore.getState().acknowledge('10', '3');

    expect(ok).toBe(false);
    expect(showErrorToast).toHaveBeenCalled();
    expect(selectActiveBroadcast(useBroadcastStore.getState(), '10')?.id).toBe('3');
  });
});
