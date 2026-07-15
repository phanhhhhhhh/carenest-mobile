import { create } from 'zustand';
import api from '../../../core/api/client';
import { getUserId } from '../../../core/storage/secureStorage';
import type { MedicationItem, MedicationLogEntry } from '../../../shared/types';
import { getErrorMessage, asListOfMaps } from '../../../core/api/errors';
import { scheduleFrom } from '../../medication/services/medicationReminderService';



interface MedicationListState {
  isLoading: boolean;
  error: string | null;
  items: MedicationItem[];
  logs: MedicationLogEntry[];
  logsError: string | null;

  load: (elderlyId?: string) => Promise<void>;
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
  toggleTaken: (
    medicationId: string,
    onError?: (error: string) => void,
  ) => Promise<boolean>;
}

function parseMedicationItem(j: Record<string, unknown>): MedicationItem {
  const schedule = (j.schedule && typeof j.schedule === 'object'
    ? (j.schedule as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  return {
    id: String(j.id ?? ''),
    name: (j.name as string) ?? '',
    dosage: (j.dosage as string) ?? '',
    instructions: (j.instructions as string) ?? undefined,
    nextDoseTime: (j.nextDoseTime as string) ?? undefined,
    scheduleTimes: Array.isArray(schedule.times)
      ? (schedule.times as unknown[]).map((e) => String(e))
      : [],
    daysOfWeek: Array.isArray(schedule.daysOfWeek)
      ? (schedule.daysOfWeek as unknown[]).map((e) => Number(e))
      : [],
    taken: false,
  };
}

function parseLogEntry(j: Record<string, unknown>): MedicationLogEntry {
  return {
    id: String(j.id ?? ''),
    medicationId: j.medicationId != null ? String(j.medicationId) : '',
    status: ((j.status as string) ?? 'TAKEN') as MedicationLogEntry['status'],
    takenAt: (j.takenAt as string) ?? new Date().toISOString(),
  };
}

export const useMedicationStore = create<MedicationListState>((set, get) => ({
  isLoading: false,
  error: null,
  items: [],
  logs: [],
  logsError: null,

  load: async (elderlyId) => {
    set({ isLoading: true, error: null });
    try {
      const userId = elderlyId ?? (await getUserId());
      if (!userId) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/users/${userId}/medications`);
      const items = asListOfMaps(resp.data).map(parseMedicationItem);
      set({ isLoading: false, items });
      scheduleFrom(items);
    } catch (e) {
      set({ isLoading: false, error: `Error loading medication: ${getErrorMessage(e)}` });
    }
  },

  addMedication: async ({ name, dosage, instructions, elderlyId, scheduleTimes, daysOfWeek }) => {
    try {
      const userId = elderlyId ?? (await getUserId());
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
      await get().load();
    } catch (e) {
      set({ error: `Error adding medication: ${getErrorMessage(e)}` });
    }
  },

  updateMedication: async ({ medicationId, name, dosage, instructions, scheduleTimes, daysOfWeek }) => {
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
      await get().load();
    } catch (e) {
      set({ error: `Error updating medication: ${getErrorMessage(e)}` });
    }
  },

  deleteMedication: async (medicationId) => {
    try {
      await api.delete(`/medications/${medicationId}`);
      await get().load();
      return true;
    } catch (e) {
      console.warn('[medicationStore.deleteMedication]', e);
      return false;
    }
  },

  fetchLogs: async (medicationId) => {
    set({ logsError: null });
    try {
      const resp = await api.get(`/medications/${medicationId}/logs`);
      const logs = asListOfMaps(resp.data).map(parseLogEntry);
      set({ logs });
    } catch (e) {
      set({ logsError: `Error loading history: ${getErrorMessage(e)}` });
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
      onError?.(`Error: ${getErrorMessage(e)}`);
      return false;
    }
  },
}));
