import { createHealthReportExportService } from './healthReportExportService';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { cache: {} } }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

function response(status = 200, bytes = new Uint8Array([37, 80, 68, 70, 45])): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({
      'content-type': status === 200 ? 'application/pdf' : 'application/json',
    }),
    bytes: jest.fn().mockResolvedValue(bytes),
  } as unknown as Response;
}

function setup(overrides: Record<string, unknown> = {}) {
  const file = { uri: 'file:///cache/report.pdf', create: jest.fn(), write: jest.fn() };
  const dependencies = {
    platform: 'ios',
    fetch: jest.fn().mockResolvedValue(response()),
    getToken: jest.fn().mockResolvedValue('jwt'),
    createCacheFile: jest.fn().mockReturnValue(file),
    isSharingAvailable: jest.fn().mockResolvedValue(true),
    share: jest.fn().mockResolvedValue(undefined),
    expireSession: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { file, dependencies, service: createHealthReportExportService(dependencies) };
}

const params = {
  elderlyId: '11',
  from: '2026-08-01T00:00:00+07:00',
  to: '2026-08-31T23:59:59+07:00',
};

describe('healthReportExportService', () => {
  it('writes a successful PDF and opens the native share sheet', async () => {
    const { service, dependencies, file } = setup();

    await expect(service(params)).resolves.toEqual({ kind: 'shared', uri: file.uri });
    expect(file.create).toHaveBeenCalledWith({ overwrite: true });
    expect(file.write).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(dependencies.share).toHaveBeenCalledWith(file.uri);
  });

  it('returns premium_required for HTTP 402 without writing a file', async () => {
    const { service, dependencies, file } = setup({
      fetch: jest.fn().mockResolvedValue(response(402)),
    });

    await expect(service(params)).resolves.toEqual({ kind: 'premium_required' });
    expect(file.write).not.toHaveBeenCalled();
    expect(dependencies.share).not.toHaveBeenCalled();
  });

  it('does not write invalid successful content', async () => {
    const { service, file } = setup({
      fetch: jest.fn().mockResolvedValue(response(200, new Uint8Array([123, 125]))),
    });

    await expect(service(params)).resolves.toEqual({ kind: 'error' });
    expect(file.write).not.toHaveBeenCalled();
  });

  it('handles unavailable sharing before requesting health data', async () => {
    const { service, dependencies } = setup({
      isSharingAvailable: jest.fn().mockResolvedValue(false),
    });

    await expect(service(params)).resolves.toEqual({ kind: 'unsupported' });
    expect(dependencies.fetch).not.toHaveBeenCalled();
  });

  it('blocks a duplicate export while the first request is in progress', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const { service } = setup({ fetch: jest.fn().mockReturnValue(pendingFetch) });

    const first = service(params);
    await Promise.resolve();
    await expect(service(params)).resolves.toEqual({ kind: 'busy' });
    resolveFetch?.(response());
    await expect(first).resolves.toMatchObject({ kind: 'shared' });
  });
});
