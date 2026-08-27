import { create } from 'zustand';
import api from '../../../core/api/client';
import { getUserId } from '../../../core/storage/secureStorage';
import type { MedicationItem, MedicationLogEntry } from '../../../shared/types';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import { scheduleFrom } from '../../medication/services/medicationReminderService';
import { MedicationSchema, MedicationLogSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

interface MedicationListState {
  isLoading: boolean;
  error: string | null;
  items: MedicationItem[];
  logs: MedicationLogEntry[];
  logsError: string | null;
  /** Logs of ALL medications — used for the compliance chart by day. */
  allLogs: MedicationLogEntry[];
  /** Elderly whose medications are currently loaded — remembered so add/update/delete
   *  can reload the same list instead of falling back to the logged-in user's own id. */
  currentElderlyId: string | null;

  load: (elderlyId?: string, signal?: AbortSignal) => Promise<void>;
  addMedication: (params: {
    name: string;
    dosage: string;
    instructions?: string;
    elderlyId?: string;
    scheduleTimes?: string[];
    daysOfWeek?: number[];
  }) => Promise<void>;
  updateMedication: (params: {
    medicationId: string;
    name?: string;
    dosage?: string;
    instructions?: string;
    scheduleTimes?: string[];
    daysOfWeek?: number[];
  }) => Promise<void>;
  deleteMedication: (medicationId: string) => Promise<boolean>;
  fetchLogs: (medicationId: string) => Promise<void>;
  fetchAllLogs: () => Promise<void>;
  toggleTaken: (medicationId: string, onError?: (error: string) => void) => Promise<boolean>;
}

function toMedicationItem(m: ReturnType<typeof MedicationSchema.parse>): MedicationItem {
  return {
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    instructions: m.instructions ?? undefined,
    nextDoseTime: m.nextDoseTime ?? undefined,
    scheduleTimes: m.schedule?.times ?? [],
    daysOfWeek: m.schedule?.daysOfWeek ?? [],
    // Real taken-today status is filled in by `load()` from today's medication
    // logs — the medication list endpoint itself has no `taken` field.
    taken: false,
  };
}

function startAndEndOfToday(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

function toLogEntry(l: ReturnType<typeof MedicationLogSchema.parse>): MedicationLogEntry {
  return {
    id: l.id,
    medicationId: l.medicationId ?? '',
    status: l.status as MedicationLogEntry['status'],
    takenAt: l.takenAt,
  };
}

export const useMedicationStore = create<MedicationListState>((set, get) => ({
  isLoading: false,
  error: null,
  items: [],
  allLogs: [],
  logs: [],
  logsError: null,
  currentElderlyId: null,

  load: async (elderlyId, signal) => {
    set({ isLoading: true, error: null });
    try {
      const ownId = await getUserId();
      const userId = elderlyId ?? ownId;
      if (!userId) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/users/${userId}/medications`, { signal });
      if (!Array.isArray(resp.data)) {
        console.warn('[schema] MedicationList: expected an array — keeping previous state');
        set({ isLoading: false, error: 'Phản hồi không hợp lệ từ máy chủ' });
        return;
      }
      let items = safeParseList(MedicationSchema, resp.data, 'MedicationList').map(
        toMedicationItem,
      );

      try {
        const { from, to } = startAndEndOfToday();
        const logResp = await api.get(`/elderly/${userId}/medication-logs`, {
          params: { from, to },
          signal,
        });
        const takenIds = new Set(
          safeParseList(MedicationLogSchema, logResp.data, 'MedicationLog')
            .filter((l) => l.status === 'TAKEN')
            .map((l) => l.medicationId ?? ''),
        );
        items = items.map((item) => ({ ...item, taken: takenIds.has(item.id) }));
      } catch {
        // today's logs unavailable — leave `taken` as false rather than guessing
      }

      set({ isLoading: false, items, currentElderlyId: userId });
      // Local daily reminders belong on the elderly's own device — don't
      // schedule them on a family phone that views this list remotely.
      if (userId === ownId) scheduleFrom(items);
    } catch (e) {
      if (isCancelled(e)) return;
      set({ isLoading: false, error: `Lỗi khi tải thuốc: ${getErrorMessage(e)}` });
    }
  },

  addMedication: async ({ name, dosage, instructions, elderlyId, scheduleTimes, daysOfWeek }) => {
    try {
      const userId = elderlyId ?? get().currentElderlyId ?? (await getUserId());
      if (!userId) return;
      const data: Record<string, unknown> = {
        elderlyId: Number.parseInt(userId, 10) || undefined,
        name,
        dosage,
        instructions,
      };
      if (scheduleTimes && scheduleTimes.length > 0) {
        data.schedule = {
          times: scheduleTimes,
          ...(daysOfWeek && daysOfWeek.length > 0 ? { daysOfWeek } : {}),
        };
      }
      await api.post('/medications', data);
      await get().load(userId);
    } catch (e) {
      set({ error: `Lỗi khi thêm thuốc: ${getErrorMessage(e)}` });
    }
  },

  updateMedication: async ({
    medicationId,
    name,
    dosage,
    instructions,
    scheduleTimes,
    daysOfWeek,
  }) => {
    try {
      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name;
      if (dosage !== undefined) data.dosage = dosage;
      if (instructions !== undefined) data.instructions = instructions;
      if (scheduleTimes !== undefined) {
        const schedule: Record<string, unknown> = { times: scheduleTimes };
        if (daysOfWeek !== undefined) schedule.daysOfWeek = daysOfWeek;
        data.schedule = schedule;
      }
      await api.patch(`/medications/${medicationId}`, data);
      await get().load(get().currentElderlyId ?? undefined);
    } catch (e) {
      set({ error: `Lỗi khi cập nhật thuốc: ${getErrorMessage(e)}` });
    }
  },

  deleteMedication: async (medicationId) => {
    try {
      await api.delete(`/medications/${medicationId}`);
      await get().load(get().currentElderlyId ?? undefined);
      return true;
    } catch (e) {
      showErrorToast(`Không thể xóa thuốc: ${getErrorMessage(e)}`);
      return false;
    }
  },

  fetchLogs: async (medicationId) => {
    set({ logsError: null });
    try {
      const resp = await api.get(`/medications/${medicationId}/logs`);
      const logs = safeParseList(MedicationLogSchema, resp.data, 'MedicationLog').map(toLogEntry);
      set({ logs });
    } catch (e) {
      set({ logsError: `Lỗi khi tải lịch sử: ${getErrorMessage(e)}` });
    }
  },

  fetchAllLogs: async () => {
    const { items, allLogs: previousAllLogs } = get();
    if (items.length === 0) {
      set({ allLogs: [] });
      return;
    }
    try {
      const results = await Promise.allSettled(
        items.map(async (m) => {
          const resp = await api.get(`/medications/${m.id}/logs`);
          return safeParseList(MedicationLogSchema, resp.data, 'MedicationLog').map((l) => ({
            ...toLogEntry(l),
            medicationId: l.medicationId ?? m.id,
          }));
        }),
      );
      const merged: MedicationLogEntry[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') merged.push(...r.value);
      }
      set({ allLogs: merged });
    } catch (e) {
      console.warn('[medicationStore.fetchAllLogs]', e);
      set({ allLogs: previousAllLogs });
    }
  },

  toggleTaken: async (medicationId, onError) => {
    const { items } = get();
    const idx = items.findIndex((m) => m.id === medicationId);
    if (idx < 0) return false;
    const previousTaken = items[idx].taken;
    const newTaken = !previousTaken;

    const updated = [...items];
    updated[idx] = { ...updated[idx], taken: newTaken };
    set({ items: updated });

    try {
      await api.post(`/medications/${medicationId}/logs`, {
        medicationId: Number.parseInt(medicationId, 10) || undefined,
        status: newTaken ? 'TAKEN' : 'MISSED',
        takenAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      const reverted = [...get().items];
      const revertIdx = reverted.findIndex((m) => m.id === medicationId);
      if (revertIdx >= 0) reverted[revertIdx] = { ...reverted[revertIdx], taken: previousTaken };
      set({ items: reverted });
      onError?.(`Lỗi: ${getErrorMessage(e)}`);
      return false;
    }
  },
}));
