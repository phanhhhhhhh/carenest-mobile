import api from '../../../core/api/client';
import { useCameraStore } from './cameraStore';

jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), put: jest.fn() },
}));

const mockApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

const linkedCamera = {
  id: 42,
  deviceSn: 'ABC_123',
  label: 'Phòng khách',
  status: 'OFFLINE',
  capabilities: ['Talk', 'PTZ'],
};

beforeEach(() => {
  useCameraStore.setState({
    isLoading: false,
    error: null,
    isProcessing: false,
    linkError: null,
    status: {
      hasCamera: false,
      cameraCount: 0,
      allOnline: false,
      indicatorColor: 'GRAY',
      statusText: '',
    },
    cameras: [],
    timeline: [],
  });
  jest.clearAllMocks();
});

describe('bindCamera', () => {
  it('normalizes the request, refreshes status/list, and exposes confirmed capabilities', async () => {
    mockApi.post.mockResolvedValue({ data: linkedCamera });
    mockApi.get
      .mockResolvedValueOnce({
        data: {
          hasCamera: true,
          cameraCount: 1,
          allOnline: false,
          indicatorColor: 'RED',
          statusText: 'Some cameras offline',
        },
      })
      .mockResolvedValueOnce({ data: [linkedCamera] })
      .mockResolvedValueOnce({ data: { snapshots: [] } });

    const result = await useCameraStore.getState().bindCamera('7', ' abc_123 ', '  Phòng   khách ');

    expect(result).toEqual({ ok: true });
    expect(mockApi.post).toHaveBeenCalledWith('/elderly/7/cameras', {
      deviceSn: 'ABC_123',
      label: 'Phòng khách',
    });
    expect(mockApi.get).toHaveBeenCalledTimes(3);
    expect(useCameraStore.getState().cameras[0]).toMatchObject({
      id: 42,
      status: 'OFFLINE',
      capabilities: ['Talk', 'PTZ'],
    });
    expect(useCameraStore.getState().isProcessing).toBe(false);
  });

  it('returns and stores the backend provider-specific failure', async () => {
    mockApi.post.mockRejectedValue({
      response: {
        status: 409,
        data: { code: 'IMOU_BOUND_TO_ANOTHER_ACCOUNT', error: 'provider detail' },
      },
    });

    const result = await useCameraStore.getState().bindCamera('7', 'ABC123', 'Phòng ngủ');

    expect(result).toMatchObject({ ok: false, code: 'IMOU_BOUND_TO_ANOTHER_ACCOUNT' });
    expect(useCameraStore.getState().linkError).toEqual(result);
    expect(useCameraStore.getState().error).toBeNull();
  });

  it('prevents a second submission while the first request is pending', async () => {
    let rejectFirst!: (reason: unknown) => void;
    mockApi.post.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );

    const first = useCameraStore.getState().bindCamera('7', 'ABC123', 'Phòng ngủ');
    const second = await useCameraStore.getState().bindCamera('7', 'ABC123', 'Phòng ngủ');

    expect(second).toMatchObject({ ok: false, code: 'REQUEST_IN_PROGRESS' });
    expect(mockApi.post).toHaveBeenCalledTimes(1);

    rejectFirst({ response: { status: 503, data: { code: 'IMOU_UNAVAILABLE' } } });
    await first;
  });
});
