import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';

// ── Types ────────────────────────────────────────────────────────
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string; // ISO date string
}

function notificationFromJson(j: Record<string, unknown>): NotificationData {
  return {
    id: String(j.id),
    title: (j.title as string) ?? '',
    body: (j.body as string) ?? '',
    type: (j.type as string) ?? 'GENERAL',
    read: (j.read as boolean) ?? false,
    createdAt:
      typeof j.createdAt === 'string' && !isNaN(Date.parse(j.createdAt))
        ? j.createdAt
        : new Date().toISOString(),
  };
}

function asListOfMaps(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((e) => (e && typeof e === 'object' ? (e as Record<string, unknown>) : {}));
  }
  return [];
}

function extractError(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return `${fallback}: ${(e as { message?: string }).message ?? ''}`;
  }
  return fallback;
}

interface NotificationState {
  isLoading: boolean;
  error: string | null;
  items: NotificationData[];

  // Actions
  load: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// ── Store ────────────────────────────────────────────────────────
export const useNotificationStore = create<NotificationState>((set, get) => ({
  isLoading: false,
  error: null,
  items: [],

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (userId == null) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/users/${userId}/notifications`);
      const items = asListOfMaps(resp.data).map(notificationFromJson);
      set({ isLoading: false, items });
    } catch (e) {
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
    } catch {
      // silent
    }
  },

  markAllRead: async () => {
    try {
      const userId = await storage.getUserId();
      if (userId == null) return;
      await api.patch(`/users/${userId}/notifications/read-all`);
      const updated = get().items.map((n) => ({ ...n, read: true }));
      set({ items: updated });
    } catch {
      // silent
    }
  },
}));

// Derived value helper (parity with Flutter's NotificationState.unreadCount getter)
export function selectUnreadCount(items: NotificationData[]): number {
  return items.filter((n) => !n.read).length;
}
