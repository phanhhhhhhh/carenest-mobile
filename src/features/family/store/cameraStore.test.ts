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
    liveStreamUrl: null,
    liveView: { phase: 'idle', message: null, stream: null, lastSeenAt: null },
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

  it('sends a trimmed verification code without retaining it in store state', async () => {
    mockApi.post.mockRejectedValue({
      response: { status: 422, data: { code: 'IMOU_INVALID_DEVICE_CODE' } },
    });

    await useCameraStore.getState().bindCamera('7', 'ABC123', 'Room', ' SC1234 ');

    expect(mockApi.post).toHaveBeenCalledWith('/elderly/7/cameras', {
      deviceSn: 'ABC123',
      label: 'Room',
      verificationCode: 'SC1234',
    });
    expect(JSON.stringify(useCameraStore.getState())).not.toContain('SC1234');
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

describe('D3 live view', () => {
  const liveResponse = {
    cameraId: 42,
    label: 'Phòng khách',
    status: 'ONLINE',
    confirmedAt: '2026-09-09T10:00:00Z',
    lastSeenAt: '2026-09-09T10:00:00Z',
    playbackProtocol: 'HLS',
    contentType: 'application/vnd.apple.mpegurl',
    streamId: 0,
    streamUrl: 'https://video.example/fresh.m3u8?proto=https',
  };

  it('stores an ephemeral HLS stream only after a successful response', async () => {
    mockApi.get.mockResolvedValue({ data: liveResponse });

    const stream = await useCameraStore.getState().getLiveStream(42);

    expect(stream?.streamUrl).toBe(liveResponse.streamUrl);
    expect(useCameraStore.getState().liveView.phase).toBe('ready');
    expect(useCameraStore.getState().liveStreamUrl).toBe(liveResponse.streamUrl);
  });

  it('prevents duplicate requests while one is pending', async () => {
    let resolve!: (value: unknown) => void;
    mockApi.get.mockImplementation(() => new Promise((done) => { resolve = done; }));

    const first = useCameraStore.getState().getLiveStream(42);
    const second = await useCameraStore.getState().getLiveStream(42);

    expect(second).toBeNull();
    expect(mockApi.get).toHaveBeenCalledTimes(1);
    resolve({ data: liveResponse });
    await first;
  });

  it.each([
    ['CAMERA_OFFLINE', 'offline'],
    ['CAMERA_PRIVACY_ACTIVE', 'privacy'],
    ['CAMERA_CONSENT_REQUIRED', 'consent'],
    ['IMOU_PROVIDER_UNAVAILABLE', 'providerError'],
    ['CAMERA_STREAM_EXPIRED', 'expired'],
    ['CAMERA_UNSUPPORTED_STREAM', 'unsupported'],
  ])('maps %s to a specific Vietnamese state', async (code, phase) => {
    mockApi.get.mockRejectedValue({ response: { data: { code, lastSeenAt: '2026-09-09T09:00:00Z' } } });

    await useCameraStore.getState().getLiveStream(42);

    expect(useCameraStore.getState().liveView.phase).toBe(phase);
    expect(useCameraStore.getState().liveView.message).toBeTruthy();
    expect(useCameraStore.getState().liveStreamUrl).toBeNull();
  });

  it('retry requests a fresh URL and clear removes it from memory', async () => {
    mockApi.get
      .mockRejectedValueOnce({ response: { data: { code: 'CAMERA_STREAM_EXPIRED' } } })
      .mockResolvedValueOnce({ data: liveResponse });

    await useCameraStore.getState().getLiveStream(42);
    await useCameraStore.getState().getLiveStream(42);
    expect(mockApi.get).toHaveBeenCalledTimes(2);
    expect(useCameraStore.getState().liveStreamUrl).toBe(liveResponse.streamUrl);

    useCameraStore.getState().clearLiveStream();
    expect(useCameraStore.getState().liveStreamUrl).toBeNull();
    expect(useCameraStore.getState().liveView.phase).toBe('idle');
  });
});
