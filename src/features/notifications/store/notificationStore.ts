import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { extractError, getErrorMessage, isCancelled } from '../../../core/api/errors';
import { NotificationSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

function toNotificationData(n: ReturnType<typeof NotificationSchema.parse>): NotificationData {
  return {
    id: n.id,
    title: n.title,
    body: n.body ?? '',
    type: n.type,
    read: n.readAt != null,
    createdAt: n.createdAt,
  };
}

interface NotificationState {
  isLoading: boolean;
  error: string | null;
  items: NotificationData[];

  load: (signal?: AbortSignal) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  isLoading: false,
  error: null,
  items: [],

  load: async (signal) => {
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (userId == null) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/users/${userId}/notifications`, { signal });
      if (!Array.isArray(resp.data)) {
        console.warn('[schema] NotificationList: expected an array — keeping previous state');
        set({ isLoading: false, error: 'Unexpected response from server' });
        return;
      }
      const items = safeParseList(NotificationSchema, resp.data, 'NotificationList').map(toNotificationData);
      set({ isLoading: false, items });
    } catch (e) {
      if (isCancelled(e)) return;
      set({
        isLoading: false,
        error: extractError(e, 'Error loading notifications'),
      });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      const updated = get().items.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      set({ items: updated });
    } catch (e) {
      showErrorToast(`Could not mark as read: ${getErrorMessage(e)}`);
    }
  },

  markAllRead: async () => {
    try {
      const userId = await storage.getUserId();
      if (userId == null) return;
      await api.patch(`/users/${userId}/notifications/read-all`);
      const updated = get().items.map((n) => ({ ...n, read: true }));
      set({ items: updated });
    } catch (e) {
      showErrorToast(`Could not mark all as read: ${getErrorMessage(e)}`);
    }
  },
}));

export function selectUnreadCount(items: NotificationData[]): number {
  return items.filter((n) => !n.read).length;
}
