import { useFeedStore, selectFeed } from './feedStore';
import api from '../../../core/api/client';
import { showErrorToast } from '../../../shared/components/toastStore';
import type { FeedItem } from '../../../shared/types';

jest.mock('../../../core/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../../../shared/components/toastStore', () => ({ showErrorToast: jest.fn() }));

const mockApi = api as unknown as { get: jest.Mock; post: jest.Mock };

const apiRow = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'CHECK_IN:5',
  type: 'CHECK_IN',
  itemRef: 5,
  occurredAt: '2026-09-06T07:30:00Z',
  title: 'Đã báo tin: khỏe mạnh 😊',
  subtitle: 'x',
  handled: false,
  reactionCount: 0,
  reactedByMe: false,
  ...over,
});

const stateItem = (over: Partial<FeedItem> = {}): FeedItem => ({
  id: 'CHECK_IN:5',
  type: 'CHECK_IN',
  itemRef: 5,
  occurredAt: '2026-09-06T07:30:00Z',
  title: 't',
  subtitle: '',
  handled: false,
  reactionCount: 0,
  reactedByMe: false,
  ...over,
});

beforeEach(() => {
  useFeedStore.setState({ itemsByElderly: {}, loading: false, error: null });
  jest.clearAllMocks();
});

describe('selectFeed', () => {
  it('returns [] for a null elderly or one not loaded', () => {
    expect(selectFeed(useFeedStore.getState(), null)).toEqual([]);
    expect(selectFeed(useFeedStore.getState(), '1')).toEqual([]);
  });
});

describe('load', () => {
  it('maps rows and keys them by elderly id', async () => {
    mockApi.get.mockResolvedValue({
      data: [apiRow(), apiRow({ id: 'EMERGENCY:9', type: 'EMERGENCY', itemRef: 9 })],
    });

    await useFeedStore.getState().load('1');

    const items = selectFeed(useFeedStore.getState(), '1');
    expect(items.map((i) => i.id)).toEqual(['CHECK_IN:5', 'EMERGENCY:9']);
    expect(useFeedStore.getState().loading).toBe(false);
  });

  it('records an error when the request throws', async () => {
    mockApi.get.mockRejectedValue({ response: { data: { message: 'down' } } });
    await useFeedStore.getState().load('1');
    expect(useFeedStore.getState().error).toMatch(/down/);
  });
});

describe('toggleReaction', () => {
  it('optimistically adds a heart then reconciles with the server', async () => {
    useFeedStore.setState({ itemsByElderly: { '1': [stateItem()] } });
    mockApi.post.mockResolvedValue({ data: { reacted: true, reactionCount: 1, handled: true } });

    await useFeedStore.getState().toggleReaction('1', stateItem());

    const item = selectFeed(useFeedStore.getState(), '1')[0];
    expect(item.reactedByMe).toBe(true);
    expect(item.reactionCount).toBe(1);
    expect(item.handled).toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/elderly/1/feed/react', {
      itemType: 'CHECK_IN',
      itemRef: 5,
    });
  });

  it('reverts and toasts when the request fails', async () => {
    const original = stateItem({ reactedByMe: false, reactionCount: 2, handled: true });
    useFeedStore.setState({ itemsByElderly: { '1': [original] } });
    mockApi.post.mockRejectedValue(new Error('nope'));

    await useFeedStore.getState().toggleReaction('1', original);

    expect(selectFeed(useFeedStore.getState(), '1')[0]).toEqual(original);
    expect(showErrorToast).toHaveBeenCalled();
  });
});
