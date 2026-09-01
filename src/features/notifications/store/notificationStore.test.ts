import {
  useNotificationStore,
  selectUnreadCount,
  type NotificationData,
} from './notificationStore';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { showErrorToast } from '../../../shared/components/toastStore';

// jest.mock calls are hoisted above the imports by babel-jest.
jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock('../../../core/storage/secureStorage', () => ({
  getUserId: jest.fn(),
}));
jest.mock('../../../shared/components/toastStore', () => ({
  showErrorToast: jest.fn(),
}));

const mockApi = api as unknown as { get: jest.Mock; patch: jest.Mock };
const mockGetUserId = storage.getUserId as jest.Mock;

/** An API row as the backend returns it (`readAt` present ⇒ read). */
const apiRow = (id: string, readAt: string | null = null) => ({
  id,
  title: `t${id}`,
  body: null,
  type: 'HEALTH_ALERT',
  readAt,
  createdAt: '2026-01-01T00:00:00Z',
});

/** A row in the shape the store keeps in `items`. */
const stateRow = (id: string, read: boolean): NotificationData => ({
  id,
  title: `t${id}`,
  body: '',
  type: 'HEALTH_ALERT',
  data: null,
  read,
  createdAt: '2026-01-01T00:00:00Z',
});

beforeEach(() => {
  useNotificationStore.setState({ isLoading: false, error: null, items: [] });
  mockGetUserId.mockResolvedValue('42');
});

describe('selectUnreadCount', () => {
  it('counts only unread items', () => {
    const items = [stateRow('1', false), stateRow('2', true), stateRow('3', false)];
    expect(selectUnreadCount(items)).toBe(2);
  });
});

describe('load', () => {
  it('maps API rows to NotificationData (readAt → read boolean)', async () => {
    mockApi.get.mockResolvedValue({ data: [apiRow('1'), apiRow('2', '2026-01-02T00:00:00Z')] });

    await useNotificationStore.getState().load();

    const { items, isLoading, error } = useNotificationStore.getState();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(items.map((n) => [n.id, n.read])).toEqual([
      ['1', false],
      ['2', true],
    ]);
  });

  it('bails out quietly when there is no signed-in user', async () => {
    mockGetUserId.mockResolvedValue(null);
    await useNotificationStore.getState().load();
    expect(mockApi.get).not.toHaveBeenCalled();
    expect(useNotificationStore.getState().items).toEqual([]);
  });

  it('records an error message when the request throws', async () => {
    mockApi.get.mockRejectedValue({ response: { data: { message: 'Server down' } } });
    await useNotificationStore.getState().load();
    expect(useNotificationStore.getState().error).toBe('Lỗi khi tải thông báo: Server down');
  });

  it('keeps previous state when the payload is not an array', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    useNotificationStore.setState({ items: [stateRow('9', false)] });
    mockApi.get.mockResolvedValue({ data: { oops: true } });
    await useNotificationStore.getState().load();
    expect(useNotificationStore.getState().items).toHaveLength(1);
    expect(useNotificationStore.getState().error).toMatch(/không hợp lệ/);
  });
});

describe('markAsRead', () => {
  it('flips the local row and calls the API', async () => {
    useNotificationStore.setState({
      items: [stateRow('1', false), stateRow('2', false)],
    });
    mockApi.patch.mockResolvedValue({});

    await useNotificationStore.getState().markAsRead('1');

    expect(mockApi.patch).toHaveBeenCalledWith('/notifications/1/read');
    expect(useNotificationStore.getState().items.find((n) => n.id === '1')!.read).toBe(true);
    expect(useNotificationStore.getState().items.find((n) => n.id === '2')!.read).toBe(false);
  });

  it('shows a toast and leaves state untouched on failure', async () => {
    useNotificationStore.setState({ items: [stateRow('1', false)] });
    mockApi.patch.mockRejectedValue(new Error('nope'));

    await useNotificationStore.getState().markAsRead('1');

    expect(showErrorToast).toHaveBeenCalled();
    expect(useNotificationStore.getState().items[0].read).toBe(false);
  });
});
