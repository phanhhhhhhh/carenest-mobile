import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { AppointmentItem } from '../../../shared/types';
import { AppointmentSchema, safeParseList } from '../../../shared/schemas';

function toAppointmentItem(a: ReturnType<typeof AppointmentSchema.parse>): AppointmentItem {
  return {
    id: a.id,
    doctor: a.doctor,
    specialty: a.specialty ?? '',
    location: a.location ?? undefined,
    appointmentDate: a.datetime,
    status: a.status,
    notes: a.notes ?? undefined,
    createdAt: a.createdAt ?? undefined,
  };
}

function isUpcoming(a: AppointmentItem): boolean {
  return a.status === 'SCHEDULED' || a.status === 'RESCHEDULED';
}

function isPast(a: AppointmentItem): boolean {
  return a.status === 'COMPLETED' || a.status === 'CANCELLED';
}

interface AppointmentState {
  isLoading: boolean;
  error: string | null;
  appointments: AppointmentItem[];
  isSaving: boolean;
  /** Elderly whose appointments are currently loaded — remembered so create/update/delete
   *  can reload the same list instead of falling back to the logged-in user's own id. */
  currentElderlyId: string | null;

  load: (elderlyId?: string, signal?: AbortSignal) => Promise<void>;
  create: (params: {
    doctor: string;
    specialty: string;
    location?: string;
    appointmentDate: Date;
    notes?: string;
    elderlyId?: string;
  }) => Promise<boolean>;
  update: (params: {
    appointmentId: string;
    doctor?: string;
    specialty?: string;
    location?: string;
    appointmentDate?: Date;
    notes?: string;
  }) => Promise<boolean>;
  delete: (appointmentId: string) => Promise<boolean>;
  updateStatus: (appointmentId: string, newStatus: string) => Promise<boolean>;
  refresh: () => void;
  upcoming: () => AppointmentItem[];
  past: () => AppointmentItem[];
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  isLoading: false,
  error: null,
  appointments: [],
  isSaving: false,
  currentElderlyId: null,

  load: async (elderlyId, signal) => {
    set({ isLoading: true, error: null });
    try {
      const userId = elderlyId ?? (await storage.getUserId());
      if (!userId) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/users/${userId}/appointments`, { signal });
      if (!Array.isArray(resp.data)) {
        console.warn('[schema] AppointmentList: expected an array — keeping previous state');
        set({ isLoading: false, error: 'Phản hồi không hợp lệ từ máy chủ' });
        return;
      }
      const items = safeParseList(AppointmentSchema, resp.data, 'AppointmentList').map(
        toAppointmentItem,
      );
      set({ isLoading: false, appointments: items, currentElderlyId: userId });
    } catch (e) {
      if (isCancelled(e)) return;
      set({ isLoading: false, error: `Lỗi khi tải lịch hẹn: ${getErrorMessage(e)}` });
    }
  },

  create: async ({ doctor, specialty, location, appointmentDate, notes, elderlyId }) => {
    set({ isSaving: true, error: null });
    try {
      const eId = elderlyId ?? get().currentElderlyId ?? (await storage.getUserId());
      const data: Record<string, unknown> = {};
      if (eId != null) data.elderlyId = Number.parseInt(eId, 10);
      data.doctor = doctor;
      data.specialty = specialty;
      if (location && location.length > 0) data.location = location;
      data.datetime = appointmentDate.toISOString();
      if (notes && notes.length > 0) data.notes = notes;

      await api.post('/appointments', data);
      await get().load(get().currentElderlyId ?? undefined);
      set({ isSaving: false });
      return true;
    } catch (e) {
      set({ isSaving: false, error: `Lỗi khi tạo lịch hẹn: ${getErrorMessage(e)}` });
      return false;
    }
  },

  update: async ({ appointmentId, doctor, specialty, location, appointmentDate, notes }) => {
    set({ isSaving: true, error: null });
    try {
      const data: Record<string, unknown> = {};
      if (doctor !== undefined) data.doctor = doctor;
      if (specialty !== undefined) data.specialty = specialty;
      if (location !== undefined) data.location = location;
      if (appointmentDate !== undefined) data.datetime = appointmentDate.toISOString();
      if (notes !== undefined) data.notes = notes;
      await api.patch(`/appointments/${appointmentId}`, data);
      await get().load(get().currentElderlyId ?? undefined);
      set({ isSaving: false });
      return true;
    } catch (e) {
      set({ isSaving: false, error: `Lỗi khi cập nhật lịch hẹn: ${getErrorMessage(e)}` });
      return false;
    }
  },

  delete: async (appointmentId) => {
    try {
      await api.delete(`/appointments/${appointmentId}`);
      await get().load(get().currentElderlyId ?? undefined);
      return true;
    } catch (e) {
      set({ error: `Lỗi khi xóa lịch hẹn: ${getErrorMessage(e)}` });
      return false;
    }
  },

  updateStatus: async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      await get().load(get().currentElderlyId ?? undefined);
      return true;
    } catch (e) {
      set({ error: `Lỗi khi cập nhật trạng thái: ${getErrorMessage(e)}` });
      return false;
    }
  },

  refresh: () => {
    get().load(get().currentElderlyId ?? undefined);
  },

  upcoming: () =>
    get()
      .appointments.filter(isUpcoming)
      .slice()
      .sort(
        (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
      ),

  past: () =>
    get()
      .appointments.filter(isPast)
      .slice()
      .sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime(),
      ),
}));
