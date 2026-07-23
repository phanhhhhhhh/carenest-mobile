import { create } from 'zustand';
import api from '../../../core/api/client';
import { getUserId } from '../../../core/storage/secureStorage';
import { getStatus, getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { ElderlyProfile } from '../../../shared/types';
import { ElderlyProfileSchema, safeParseOne } from '../../../shared/schemas';



export interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

interface ElderlyProfileState {
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  profile: ElderlyProfile | null;

  load: (signal?: AbortSignal) => Promise<void>;
  loadEmergencyContacts: () => Promise<EmergencyContact[]>;
  updateEmergencyContacts: (contacts: EmergencyContact[]) => Promise<boolean>;
  updateProfile: (params: {
    name?: string;
    healthConditions?: string[];
    bloodType?: string;
    weight?: number;
    height?: number;
    allergies?: string[];
    notes?: string;
  }) => Promise<void>;
}

function toProfile(p: ReturnType<typeof ElderlyProfileSchema.parse>): ElderlyProfile {
  return {
    id: p.id ?? '',
    name: p.userName ?? '',
    healthConditions: p.healthConditions ?? [],
    bloodType: p.bloodType ?? undefined,
    weight: p.weightKg ?? undefined,
    height: p.heightCm ?? undefined,
    allergies: Array.isArray(p.allergies) ? p.allergies : [],
    notes: p.notes ?? undefined,
  };
}

export const useElderlyProfileStore = create<ElderlyProfileState>((set, get) => ({
  isLoading: false,
  isUpdating: false,
  error: null,
  profile: null,

  load: async (signal) => {
    set({ isLoading: true, error: null });
    try {
      const userId = await getUserId();
      if (!userId) {
        set({ isLoading: false, error: 'Chưa đăng nhập' });
        return;
      }
      const resp = await api.get(`/elderly-profiles/${userId}`, { signal });
      const parsed = safeParseOne(ElderlyProfileSchema, resp.data ?? {}, 'ElderlyProfile');
      set({ isLoading: false, profile: toProfile(parsed ?? {}) });
    } catch (e) {
      if (isCancelled(e)) return;
      const status = getStatus(e);
      set({
        isLoading: false,
        error: status === 404 ? null : 'Lỗi khi tải hồ sơ',
      });
    }
  },

  loadEmergencyContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await getUserId();
      if (!userId) {
        set({ isLoading: false, error: 'Chưa đăng nhập' });
        return [];
      }
      const resp = await api.get(`/elderly-profiles/${userId}`);
      const parsed = safeParseOne(ElderlyProfileSchema, resp.data ?? {}, 'ElderlyProfile');
      const contacts: EmergencyContact[] = (parsed?.emergencyContacts ?? []).map((c) => ({
        id: c.id,
        name: c.name ?? '',
        phone: c.phone ?? '',
        relationship: c.relationship ?? '',
      }));
      set({ isLoading: false });
      return contacts;
    } catch (e) {
      set({ isLoading: false, error: `Lỗi khi tải danh bạ khẩn cấp: ${getErrorMessage(e)}` });
      return [];
    }
  },

  updateEmergencyContacts: async (contacts) => {
    set({ isUpdating: true, error: null });
    try {
      const userId = await getUserId();
      if (!userId) {
        set({ isUpdating: false, error: 'Chưa đăng nhập' });
        return false;
      }
      await api.put(`/elderly-profiles/${userId}`, {
        emergencyContacts: contacts.map((c) => ({
          ...(c.id != null ? { id: c.id } : {}),
          name: c.name,
          phone: c.phone,
          relationship: c.relationship,
        })),
      });
      set({ isUpdating: false });
      return true;
    } catch (e) {
      set({ isUpdating: false, error: `Lỗi cập nhật: ${getErrorMessage(e)}` });
      return false;
    }
  },

  updateProfile: async (params) => {
    set({ isUpdating: true, error: null });
    try {
      const userId = await getUserId();
      if (!userId) return;
      const data: Record<string, unknown> = {};
      if (params.name !== undefined) data.name = params.name;
      if (params.healthConditions !== undefined) data.healthConditions = params.healthConditions;
      if (params.bloodType !== undefined) data.bloodType = params.bloodType;
      if (params.weight !== undefined) data.weightKg = params.weight;
      if (params.height !== undefined) data.heightCm = params.height;
      if (params.allergies !== undefined) data.allergies = params.allergies;
      if (params.notes !== undefined) data.notes = params.notes;
      await api.put(`/elderly-profiles/${userId}`, data);
      await get().load();
    } catch (e) {
      set({ isUpdating: false, error: `Lỗi cập nhật: ${getErrorMessage(e)}` });
    }
  },
}));
