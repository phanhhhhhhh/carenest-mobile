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
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

function toNotificationData(n: ReturnType<typeof NotificationSchema.parse>): NotificationData {
  return {
    id: n.id,
    title: n.title,
    body: n.body ?? '',
    type: n.type,
    data: n.data ?? null,
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
  respondToFamilyLinkRequest: (linkId: number, accept: boolean) => Promise<boolean>;
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
        set({ isLoading: false, error: 'Phản hồi không hợp lệ từ máy chủ' });
        return;
      }
      const items = safeParseList(NotificationSchema, resp.data, 'NotificationList').map(toNotificationData);
      set({ isLoading: false, items });
    } catch (e) {
      if (isCancelled(e)) return;
      set({
        isLoading: false,
        error: extractError(e, 'Lỗi khi tải thông báo'),
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
      showErrorToast(`Không thể đánh dấu đã đọc: ${getErrorMessage(e)}`);
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
      showErrorToast(`Không thể đánh dấu tất cả đã đọc: ${getErrorMessage(e)}`);
    }
  },

  respondToFamilyLinkRequest: async (linkId, accept) => {
    try {
      await api.patch(`/family-links/${linkId}/status`, {
        status: accept ? 'ACTIVE' : 'REVOKED',
      });
      return true;
    } catch (e) {
      showErrorToast(`Không thể xử lý yêu cầu kết nối: ${getErrorMessage(e)}`);
      return false;
    }
  },
}));

export function selectUnreadCount(items: NotificationData[]): number {
  return items.filter((n) => !n.read).length;
}
