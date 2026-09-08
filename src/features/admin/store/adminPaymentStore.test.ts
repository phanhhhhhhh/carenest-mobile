import { useAdminPaymentStore } from './adminPaymentStore';
import api from '../../../core/api/client';
import { showErrorToast, showSuccessToast } from '../../../shared/components/toastStore';

jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../../../shared/components/toastStore', () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const mockApi = api as unknown as { get: jest.Mock; post: jest.Mock };

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  transactionId: 'TXN-1',
  userId: 5,
  userName: 'Linda Nguyen',
  planType: 'PREMIUM_MONTHLY',
  amount: 49000,
  provider: 'VIETQR',
  createdAt: '2026-09-08T10:00:00Z',
  ...over,
});

beforeEach(() => {
  useAdminPaymentStore.setState({ pending: [], isLoading: false, actingId: null, error: null });
  jest.clearAllMocks();
});

describe('load', () => {
  it('parses the pending list', async () => {
    mockApi.get.mockResolvedValue({ data: [row(), row({ transactionId: 'TXN-2' })] });

    await useAdminPaymentStore.getState().load();

    const { pending, isLoading } = useAdminPaymentStore.getState();
    expect(isLoading).toBe(false);
    expect(pending.map((p) => p.transactionId)).toEqual(['TXN-1', 'TXN-2']);
    expect(pending[0].userName).toBe('Linda Nguyen');
  });

  it('drops rows with no transactionId (cannot be actioned)', async () => {
    mockApi.get.mockResolvedValue({
      data: [row(), { userName: 'x', planType: 'PREMIUM_MONTHLY' }],
    });

    await useAdminPaymentStore.getState().load();

    expect(useAdminPaymentStore.getState().pending).toHaveLength(1);
  });

  it('surfaces an error message on failure', async () => {
    mockApi.get.mockRejectedValue(new Error('boom'));

    await useAdminPaymentStore.getState().load();

    expect(useAdminPaymentStore.getState().error).toContain('Không tải được');
  });
});

describe('confirm', () => {
  beforeEach(() => {
    useAdminPaymentStore.setState({
      pending: [row() as never, row({ transactionId: 'TXN-2' }) as never],
    });
  });

  it('removes the row and toasts on ACTIVATED', async () => {
    mockApi.post.mockResolvedValue({ data: { status: 'ACTIVATED' } });

    const ok = await useAdminPaymentStore.getState().confirm('TXN-1');

    expect(ok).toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/payment/vietqr/confirm', {
      transactionId: 'TXN-1',
    });
    expect(useAdminPaymentStore.getState().pending.map((p) => p.transactionId)).toEqual(['TXN-2']);
    expect(showSuccessToast).toHaveBeenCalled();
    expect(useAdminPaymentStore.getState().actingId).toBeNull();
  });

  it('also removes on ALREADY_ACTIVE', async () => {
    mockApi.post.mockResolvedValue({ data: { status: 'ALREADY_ACTIVE' } });

    await useAdminPaymentStore.getState().confirm('TXN-1');

    expect(useAdminPaymentStore.getState().pending).toHaveLength(1);
  });

  it('on NOT_FOUND: warns and reloads', async () => {
    mockApi.post.mockResolvedValue({ data: { status: 'NOT_FOUND' } });
    mockApi.get.mockResolvedValue({ data: [] });

    const ok = await useAdminPaymentStore.getState().confirm('TXN-1');

    expect(ok).toBe(false);
    expect(showErrorToast).toHaveBeenCalled();
    expect(mockApi.get).toHaveBeenCalledWith('/payment/pending', expect.anything());
  });

  it('toasts and keeps the row on a network error', async () => {
    mockApi.post.mockRejectedValue(new Error('offline'));

    const ok = await useAdminPaymentStore.getState().confirm('TXN-1');

    expect(ok).toBe(false);
    expect(showErrorToast).toHaveBeenCalled();
    expect(useAdminPaymentStore.getState().pending).toHaveLength(2);
  });
});

describe('reject', () => {
  beforeEach(() => {
    useAdminPaymentStore.setState({ pending: [row() as never] });
  });

  it('removes the row on REJECTED', async () => {
    mockApi.post.mockResolvedValue({ data: { status: 'REJECTED' } });

    const ok = await useAdminPaymentStore.getState().reject('TXN-1');

    expect(ok).toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/payment/vietqr/reject', { transactionId: 'TXN-1' });
    expect(useAdminPaymentStore.getState().pending).toHaveLength(0);
  });
});
