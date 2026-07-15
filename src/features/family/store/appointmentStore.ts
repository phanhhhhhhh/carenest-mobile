import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { asListOfMaps, getErrorMessage } from '../../../core/api/errors';
import type { AppointmentItem } from '../../../shared/types';



function isValidIsoDate(s: string): boolean {
  return s !== '' && !Number.isNaN(new Date(s).getTime());
}

function parseAppointmentItem(j: Record<string, unknown>): AppointmentItem {
  const rawDate = (j.appointmentDate as string) ?? '';
  return {
    id: j.id != null ? String(j.id) : '',
    doctor: (j.doctor as string) ?? '',
    specialty: (j.specialty as string) ?? '',
    location: (j.location as string | null) ?? undefined,
    appointmentDate: isValidIsoDate(rawDate) ? rawDate : new Date().toISOString(),
    status: ((j.status as string) ?? 'SCHEDULED') as AppointmentItem['status'],
    notes: (j.notes as string | null) ?? undefined,
    createdAt: j.createdAt != null ? String(j.createdAt) : undefined,
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

  load: () => Promise<void>;
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

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (!userId) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/users/${userId}/appointments`);
      const items = asListOfMaps(resp.data).map(parseAppointmentItem);
      set({ isLoading: false, appointments: items });
    } catch (e) {
      set({ isLoading: false, error: `Error loading appointments: ${getErrorMessage(e)}` });
    }
  },

  create: async ({ doctor, specialty, location, appointmentDate, notes, elderlyId }) => {
    set({ isSaving: true, error: null });
    try {
      const eId = elderlyId ?? (await storage.getUserId());
      const data: Record<string, unknown> = {};
      if (eId != null) data.elderlyId = Number.parseInt(eId, 10);
      data.doctor = doctor;
      data.specialty = specialty;
      if (location && location.length > 0) data.location = location;
      data.appointmentDate = appointmentDate.toISOString();
      if (notes && notes.length > 0) data.notes = notes;

      await api.post('/appointments', data);
      await get().load();
      set({ isSaving: false });
      return true;
    } catch (e) {
      set({ isSaving: false, error: `Error creating appointment: ${getErrorMessage(e)}` });
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
      if (appointmentDate !== undefined) data.appointmentDate = appointmentDate.toISOString();
      if (notes !== undefined) data.notes = notes;
      await api.patch(`/appointments/${appointmentId}`, data);
      await get().load();
      set({ isSaving: false });
      return true;
    } catch (e) {
      set({ isSaving: false, error: `Error updating appointment: ${getErrorMessage(e)}` });
      return false;
    }
  },

  delete: async (appointmentId) => {
    try {
      await api.delete(`/appointments/${appointmentId}`);
      await get().load();
      return true;
    } catch (e) {
      set({ error: `Error deleting appointment: ${getErrorMessage(e)}` });
      return false;
    }
  },

  updateStatus: async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      await get().load();
      return true;
    } catch (e) {
      set({ error: `Error updating status: ${getErrorMessage(e)}` });
      return false;
    }
  },

  refresh: () => {
    get().load();
  },

  upcoming: () =>
    get()
      .appointments.filter(isUpcoming)
      .slice()
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()),

  past: () =>
    get()
      .appointments.filter(isPast)
      .slice()
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
}));
