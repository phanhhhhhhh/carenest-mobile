import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { FeedItem } from '../../../shared/types';
import { FeedItemSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

function toFeedItem(f: ReturnType<typeof FeedItemSchema.parse>): FeedItem {
  return {
    id: f.id,
    type: f.type,
    itemRef: f.itemRef,
    occurredAt: f.occurredAt,
    title: f.title,
    subtitle: f.subtitle ?? '',
    handled: f.handled,
    reactionCount: f.reactionCount,
    reactedByMe: f.reactedByMe,
  };
}

interface FeedState {
  itemsByElderly: Record<string, FeedItem[]>;
  loading: boolean;
  error: string | null;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  toggleReaction: (elderlyId: string, item: FeedItem) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  itemsByElderly: {},
  loading: false,
  error: null,

  load: async (elderlyId, signal) => {
    set({ loading: true, error: null });
    try {
      const resp = await api.get(`/elderly/${elderlyId}/feed`, { signal });
      const items = safeParseList(FeedItemSchema, resp.data, 'FamilyFeed').map(toFeedItem);
      set((s) => ({ loading: false, itemsByElderly: { ...s.itemsByElderly, [elderlyId]: items } }));
    } catch (e) {
      if (isCancelled(e)) return;
      set({ loading: false, error: `Lỗi khi tải dòng thời gian: ${getErrorMessage(e)}` });
    }
  },

  toggleReaction: async (elderlyId, item) => {
    const current = get().itemsByElderly[elderlyId] ?? [];
    const patch = (updater: (it: FeedItem) => FeedItem) =>
      set((s) => ({
        itemsByElderly: {
          ...s.itemsByElderly,
          [elderlyId]: (s.itemsByElderly[elderlyId] ?? []).map((it) =>
            it.id === item.id ? updater(it) : it,
          ),
        },
      }));

    // optimistic
    const wasReacted = item.reactedByMe;
    patch((it) => ({
      ...it,
      reactedByMe: !wasReacted,
      reactionCount: Math.max(0, it.reactionCount + (wasReacted ? -1 : 1)),
      handled: it.type === 'CHECK_IN' ? !wasReacted || it.reactionCount - 1 > 0 : it.handled,
    }));

    try {
      const resp = await api.post(`/elderly/${elderlyId}/feed/react`, {
        itemType: item.type,
        itemRef: item.itemRef,
      });
      const { reacted, reactionCount, handled } = resp.data ?? {};
      patch((it) => ({
        ...it,
        reactedByMe: reacted ?? it.reactedByMe,
        reactionCount: typeof reactionCount === 'number' ? reactionCount : it.reactionCount,
        handled: typeof handled === 'boolean' ? handled : it.handled,
      }));
    } catch (e) {
      // revert to the snapshot we had before the optimistic flip
      const snapshot = current.find((it) => it.id === item.id);
      if (snapshot) patch(() => snapshot);
      showErrorToast(`Không thể thả tim: ${getErrorMessage(e)}`);
    }
  },
}));

export function selectFeed(state: FeedState, elderlyId: string | null): FeedItem[] {
  if (!elderlyId) return [];
  return state.itemsByElderly[elderlyId] ?? [];
}
