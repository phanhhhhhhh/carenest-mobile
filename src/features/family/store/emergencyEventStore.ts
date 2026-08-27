import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { EmergencyEvent } from '../../../shared/types';
import { EmergencyEventSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

function toEmergencyEvent(e: ReturnType<typeof EmergencyEventSchema.parse>): EmergencyEvent {
  return {
    id: e.id,
    type: e.type ?? 'SOS',
    // `??` would keep the backend's empty-string description and hide the notes.
    description: e.description || e.notes || '',
    status: e.status,
    createdAt: e.triggeredAt ?? e.createdAt ?? new Date().toISOString(),
  };
}

interface EmergencyEventState {
  isLoading: boolean;
  error: string | null;
  events: EmergencyEvent[];

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  createSosEvent: (elderlyId: string) => Promise<boolean>;
  acknowledge: (elderlyId: string, eventId: string) => Promise<boolean>;
  markAllRead: (elderlyId: string, userId: string) => Promise<boolean>;
  refresh: (elderlyId: string) => void;
  activeCount: () => number;
}

export const useEmergencyEventStore = create<EmergencyEventState>((set, get) => ({
  isLoading: false,
  error: null,
  events: [],

  load: async (elderlyId, signal) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/elderly/${elderlyId}/emergency-events`, { signal });
      if (!Array.isArray(resp.data)) {
        console.warn('[schema] EmergencyEventList: expected an array — keeping previous state');
        set({ isLoading: false, error: 'Phản hồi không hợp lệ từ máy chủ' });
        return;
      }
      const list = safeParseList(EmergencyEventSchema, resp.data, 'EmergencyEventList').map(
        toEmergencyEvent,
      );
      set({ isLoading: false, events: list });
    } catch (e) {
      if (isCancelled(e)) return;
      set({ isLoading: false, error: `Lỗi: ${getErrorMessage(e)}` });
    }
  },

  createSosEvent: async (elderlyId) => {
    try {
      const resp = await api.post(`/elderly/${elderlyId}/emergency-events`, {
        elderlyId: Number.parseInt(elderlyId, 10) || undefined,
        type: 'SOS',
        description: 'User pressed emergency SOS button',
        latitude: null,
        longitude: null,
        address: null,
        notes: null,
      });
      if (resp.status === 201 || resp.status === 200) {
        await get().load(elderlyId);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[emergencyEventStore.createSosEvent]', e);
      return false;
    }
  },

  acknowledge: async (elderlyId, eventId) => {
    try {
      const userId = await storage.getUserId();
      if (!userId) return false;
      await api.patch(`/emergency-events/${eventId}/acknowledge`);
      await get().load(elderlyId);
      return true;
    } catch (e) {
      showErrorToast(`Không thể xác nhận cảnh báo: ${getErrorMessage(e)}`);
      return false;
    }
  },

  markAllRead: async (elderlyId, userId) => {
    try {
      await api.patch(`/users/${userId}/emergency-events/read-all`);
      await get().load(elderlyId);
      return true;
    } catch (e) {
      showErrorToast(`Không thể đánh dấu đã đọc cảnh báo: ${getErrorMessage(e)}`);
      return false;
    }
  },

  refresh: (elderlyId) => {
    get().load(elderlyId);
  },

  activeCount: () => get().events.filter((e) => e.status === 'ACTIVE').length,
}));
