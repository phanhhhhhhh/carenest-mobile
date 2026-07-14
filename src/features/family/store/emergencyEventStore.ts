import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { asListOfMaps, getErrorMessage } from '../../../core/api/errors';
import type { EmergencyEvent } from '../../../shared/types';

/**
 * Port of Flutter's emergency_event_provider.dart (EmergencyEventNotifier).
 *
 * The Flutter provider was a `StateNotifierProvider.family<..., String>`
 * keyed by elderlyId. Following the same convention used elsewhere in this
 * port (e.g. medicationStore.ts / cameraStore.ts), this is a single shared
 * store whose actions take `elderlyId` as a parameter.
 *
 * Note: the Flutter notifier called `load()` from its constructor. Callers
 * here should invoke `load(elderlyId)` from a screen's mount effect instead.
 */

function parseEmergencyEvent(j: Record<string, unknown>): EmergencyEvent {
  return {
    id: j.id != null ? String(j.id) : '',
    type: (j.type as string) ?? 'SOS',
    description: (j.description as string) ?? ((j.notes as string) ?? ''),
    status: (j.status as string) ?? 'ACTIVE',
    createdAt: (j.createdAt as string) ?? new Date().toISOString(),
  };
}

// ── State ───────────────────────────────────────────────────────────

interface EmergencyEventState {
  isLoading: boolean;
  error: string | null;
  events: EmergencyEvent[];

  load: (elderlyId: string) => Promise<void>;
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

  load: async (elderlyId) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/elderly/${elderlyId}/emergency-events`);
      const list = asListOfMaps(resp.data).map(parseEmergencyEvent);
      set({ isLoading: false, events: list });
    } catch (e) {
      set({ isLoading: false, error: `Error: ${getErrorMessage(e)}` });
    }
  },

  // POST /api/elderly/{elderlyId}/emergency-events — create SOS event.
  // Returns true on success (201/200), false otherwise.
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
        await get().load(elderlyId); // refresh list after creating
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[emergencyEventStore.createSosEvent]', e);
      return false;
    }
  },

  // PATCH /api/emergency-events/{id}/acknowledge — acknowledge an emergency.
  acknowledge: async (elderlyId, eventId) => {
    try {
      const userId = await storage.getUserId();
      if (!userId) return false;
      await api.patch(`/emergency-events/${eventId}/acknowledge`);
      await get().load(elderlyId);
      return true;
    } catch (e) {
      console.warn('[emergencyEventStore.acknowledge]', e);
      return false;
    }
  },

  // PATCH /api/users/{userId}/emergency-events/read-all — mark all alerts as read.
  markAllRead: async (elderlyId, userId) => {
    try {
      await api.patch(`/users/${userId}/emergency-events/read-all`);
      await get().load(elderlyId);
      return true;
    } catch (e) {
      console.warn('[emergencyEventStore.markAllRead]', e);
      return false;
    }
  },

  refresh: (elderlyId) => {
    get().load(elderlyId);
  },

  activeCount: () => get().events.filter((e) => e.status === 'ACTIVE').length,
}));
