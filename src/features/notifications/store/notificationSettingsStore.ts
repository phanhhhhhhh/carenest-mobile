import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';

// ── Types ────────────────────────────────────────────────────────
export interface NotificationSettingsData {
  medicationReminder: boolean;
  reminderMinutesBefore: number;
  healthAlert: boolean;
  familyUpdate: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const DEFAULT_SETTINGS_DATA: NotificationSettingsData = {
  medicationReminder: true,
  reminderMinutesBefore: 15,
  healthAlert: true,
  familyUpdate: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

function settingsFromJson(j: Record<string, unknown>): NotificationSettingsData {
  return {
    medicationReminder: (j.medicationReminder as boolean) ?? true,
    reminderMinutesBefore:
      typeof j.reminderMinutesBefore === 'number' ? j.reminderMinutesBefore : 15,
    healthAlert: (j.healthAlert as boolean) ?? true,
    familyUpdate: (j.familyUpdate as boolean) ?? true,
    quietHoursStart: (j.quietHoursStart as string) ?? '22:00',
    quietHoursEnd: (j.quietHoursEnd as string) ?? '07:00',
  };
}

function settingsToJson(d: NotificationSettingsData): Record<string, unknown> {
  return {
    medicationReminder: d.medicationReminder,
    reminderMinutesBefore: d.reminderMinutesBefore,
    healthAlert: d.healthAlert,
    familyUpdate: d.familyUpdate,
    quietHoursStart: d.quietHoursStart,
    quietHoursEnd: d.quietHoursEnd,
  };
}

export function quietHoursEnabled(d: NotificationSettingsData): boolean {
  return d.quietHoursStart.length > 0 && d.quietHoursEnd.length > 0;
}

function getStatus(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function extractError(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return `${fallback}: ${(e as { message?: string }).message ?? ''}`;
  }
  return fallback;
}

interface NotificationSettingsState {
  isLoading: boolean;
  error: string | null;
  data: NotificationSettingsData;
  isSaving: boolean;
  fcmTokenSaved: boolean;

  // Derived getters (parity with Flutter state getters)
  medicationReminder: boolean;
  reminderMinutesBefore: number;
  healthAlert: boolean;
  familyUpdate: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // Actions
  load: () => Promise<void>;
  setMedicationReminder: (v: boolean) => Promise<void>;
  setReminderMinutes: (v: number) => Promise<void>;
  setHealthAlert: (v: boolean) => Promise<void>;
  setFamilyUpdate: (v: boolean) => Promise<void>;
  setQuietHoursStart: (v: string) => Promise<void>;
  setQuietHoursEnd: (v: string) => Promise<void>;
  registerFcmToken: (token: string) => Promise<boolean>;
}

function deriveFrom(data: NotificationSettingsData) {
  return {
    medicationReminder: data.medicationReminder,
    reminderMinutesBefore: data.reminderMinutesBefore,
    healthAlert: data.healthAlert,
    familyUpdate: data.familyUpdate,
    quietHoursEnabled: quietHoursEnabled(data),
    quietHoursStart: data.quietHoursStart,
    quietHoursEnd: data.quietHoursEnd,
  };
}

// ── Store ────────────────────────────────────────────────────────
export const useNotificationSettingsStore = create<NotificationSettingsState>((set, get) => ({
  isLoading: false,
  error: null,
  data: DEFAULT_SETTINGS_DATA,
  isSaving: false,
  fcmTokenSaved: false,
  ...deriveFrom(DEFAULT_SETTINGS_DATA),

  load: async () => {
    const userId = await storage.getUserId();
    if (userId == null) return;
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/users/${userId}/notification-preferences`);
      const data = settingsFromJson(resp.data ?? {});
      set({ isLoading: false, data, ...deriveFrom(data) });
    } catch (e) {
      if (getStatus(e) === 404) {
        set({ isLoading: false });
        return;
      }
      set({ isLoading: false, error: extractError(e, 'Could not load settings') });
    }
  },

  setMedicationReminder: async (v) => save(set, get, { medicationReminder: v }),
  setReminderMinutes: async (v) => save(set, get, { reminderMinutesBefore: v }),
  setHealthAlert: async (v) => save(set, get, { healthAlert: v }),
  setFamilyUpdate: async (v) => save(set, get, { familyUpdate: v }),
  setQuietHoursStart: async (v) => save(set, get, { quietHoursStart: v }),
  setQuietHoursEnd: async (v) => save(set, get, { quietHoursEnd: v }),

  registerFcmToken: async (token) => {
    const userId = await storage.getUserId();
    if (userId == null) return false;
    try {
      await api.put(`/users/${userId}/fcm-token`, { fcmToken: token });
      set({ fcmTokenSaved: true });
      return true;
    } catch {
      return false;
    }
  },
}));

// Internal save helper (parity with Flutter notifier's private `_save`).
async function save(
  set: (partial: Partial<NotificationSettingsState>) => void,
  get: () => NotificationSettingsState,
  patch: Partial<NotificationSettingsData>
) {
  const userId = await storage.getUserId();
  if (userId == null) return;
  const updated = { ...get().data, ...patch };
  set({ data: updated, isSaving: true, ...deriveFrom(updated) });
  try {
    await api.put(`/users/${userId}/notification-preferences`, settingsToJson(updated));
    set({ isSaving: false });
  } catch (e) {
    if (getStatus(e) === 404) {
      set({ isSaving: false });
      return;
    }
    set({ isSaving: false, error: extractError(e, 'Could not save settings') });
    await useNotificationSettingsStore.getState().load();
  }
}
