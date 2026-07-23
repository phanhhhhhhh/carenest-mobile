import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { getStatus, extractError, isCancelled } from '../../../core/api/errors';
import { NotificationPreferencesSchema, safeParseOne } from '../../../shared/schemas';

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

function settingsFromParsed(p: ReturnType<typeof NotificationPreferencesSchema.parse>): NotificationSettingsData {
  return {
    medicationReminder: p.medicationReminder ?? true,
    reminderMinutesBefore: p.reminderMinutesBefore ?? 15,
    healthAlert: p.healthAlert ?? true,
    familyUpdate: p.familyUpdate ?? true,
    quietHoursStart: p.quietHoursStart ?? '22:00',
    quietHoursEnd: p.quietHoursEnd ?? '07:00',
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

interface NotificationSettingsState {
  isLoading: boolean;
  error: string | null;
  data: NotificationSettingsData;
  isSaving: boolean;
  fcmTokenSaved: boolean;

  medicationReminder: boolean;
  reminderMinutesBefore: number;
  healthAlert: boolean;
  familyUpdate: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  load: (signal?: AbortSignal) => Promise<void>;
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

export const useNotificationSettingsStore = create<NotificationSettingsState>((set, get) => ({
  isLoading: false,
  error: null,
  data: DEFAULT_SETTINGS_DATA,
  isSaving: false,
  fcmTokenSaved: false,
  ...deriveFrom(DEFAULT_SETTINGS_DATA),

  load: async (signal) => {
    const userId = await storage.getUserId();
    if (userId == null) return;
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/users/${userId}/notification-preferences`, { signal });
      const parsed = safeParseOne(NotificationPreferencesSchema, resp.data ?? {}, 'NotificationPreferences');
      const data = settingsFromParsed(parsed ?? {});
      set({ isLoading: false, data, ...deriveFrom(data) });
    } catch (e) {
      if (isCancelled(e)) return;
      if (getStatus(e) === 404) {
        set({ isLoading: false });
        return;
      }
      set({ isLoading: false, error: extractError(e, 'Không thể tải cài đặt') });
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
    } catch (e) {
      console.warn('[notificationSettingsStore.registerFcmToken]', e);
      return false;
    }
  },
}));

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
    set({ isSaving: false, error: extractError(e, 'Không thể lưu cài đặt') });
    await useNotificationSettingsStore.getState().load();
  }
}
