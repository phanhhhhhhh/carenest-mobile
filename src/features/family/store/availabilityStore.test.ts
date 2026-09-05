import { useAvailabilityStore, selectAvailability } from './availabilityStore';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { showErrorToast } from '../../../shared/components/toastStore';

jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock('../../../core/storage/secureStorage', () => ({ getUserId: jest.fn() }));
jest.mock('../../../shared/components/toastStore', () => ({ showErrorToast: jest.fn() }));

const mockApi = api as unknown as { get: jest.Mock; patch: jest.Mock };
const mockGetUserId = storage.getUserId as jest.Mock;

beforeEach(() => {
  useAvailabilityStore.setState({ byElderly: {}, loading: false, error: null });
  jest.clearAllMocks();
  mockGetUserId.mockResolvedValue('55');
});

describe('load', () => {
  it('keys each link by elderly id with its FREE/BUSY status', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        { linkId: 1, elderlyId: 10, availabilityStatus: 'FREE' },
        { linkId: 2, elderlyId: 20, availabilityStatus: 'BUSY' },
      ],
    });

    await useAvailabilityStore.getState().load();

    expect(mockApi.get).toHaveBeenCalledWith('/family/55/elderly', { signal: undefined });
    expect(selectAvailability(useAvailabilityStore.getState(), '10')).toEqual({
      linkId: '1',
      status: 'FREE',
    });
    expect(selectAvailability(useAvailabilityStore.getState(), '20')!.status).toBe('BUSY');
  });

  it('does nothing without a signed-in user', async () => {
    mockGetUserId.mockResolvedValue(null);
    await useAvailabilityStore.getState().load();
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});

describe('setStatus', () => {
  beforeEach(() => {
    useAvailabilityStore.setState({ byElderly: { '10': { linkId: '1', status: 'FREE' } } });
  });

  it('optimistically flips then PATCHes the link', async () => {
    mockApi.patch.mockResolvedValue({});

    await useAvailabilityStore.getState().setStatus('10', 'BUSY');

    expect(mockApi.patch).toHaveBeenCalledWith('/family-links/1/availability', {
      availabilityStatus: 'BUSY',
    });
    expect(selectAvailability(useAvailabilityStore.getState(), '10')!.status).toBe('BUSY');
  });

  it('reverts and toasts on failure', async () => {
    mockApi.patch.mockRejectedValue(new Error('nope'));

    await useAvailabilityStore.getState().setStatus('10', 'BUSY');

    expect(selectAvailability(useAvailabilityStore.getState(), '10')!.status).toBe('FREE');
    expect(showErrorToast).toHaveBeenCalled();
  });

  it('ignores an unknown elderly', async () => {
    await useAvailabilityStore.getState().setStatus('999', 'BUSY');
    expect(mockApi.patch).not.toHaveBeenCalled();
  });
});
