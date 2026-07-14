import { create } from 'zustand';
import api from '../../../core/api/client';
import { getUserId } from '../../../core/storage/secureStorage';
import { getStatus, getErrorMessage } from '../../../core/api/errors';
import type { ElderlyProfile } from '../../../shared/types';

/**
 * Port of Flutter's elderly_provider.dart (ElderlyProfileNotifier).
 *
 * Note: the Flutter notifier called `load()` automatically from its
 * constructor. Zustand stores are plain singletons created at module load
 * time (before login), so callers must invoke `load()` themselves (e.g. in
 * a screen's mount effect) instead of relying on store construction.
 */

// ── Types ────────────────────────────────────────────────────────
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

  load: () => Promise<void>;
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

// ── Helpers ──────────────────────────────────────────────────────
function parseProfile(j: Record<string, unknown>): ElderlyProfile {
  return {
    id: String(j.id ?? ''),
    name: (j.userName as string) ?? '',
    healthConditions: Array.isArray(j.healthConditions)
      ? (j.healthConditions as string[])
      : [],
    bloodType: (j.bloodType as string) ?? undefined,
    weight: typeof j.weightKg === 'number' ? j.weightKg : undefined,
    height: typeof j.heightCm === 'number' ? j.heightCm : undefined,
    allergies: Array.isArray(j.allergies) ? (j.allergies as string[]) : [],
    notes: (j.notes as string) ?? undefined,
  };
}

// ── Store ────────────────────────────────────────────────────────
export const useElderlyProfileStore = create<ElderlyProfileState>((set, get) => ({
  isLoading: false,
  isUpdating: false,
  error: null,
  profile: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await getUserId();
      if (!userId) {
        set({ isLoading: false, error: 'Not logged in' });
        return;
      }
      const resp = await api.get(`/elderly-profiles/${userId}`);
      const data = (resp.data && typeof resp.data === 'object' ? resp.data : {}) as Record<
        string,
        unknown
      >;
      set({ isLoading: false, profile: parseProfile(data) });
    } catch (e) {
      const status = getStatus(e);
      set({
        isLoading: false,
        error: status === 404 ? null : 'Error loading profile',
      });
    }
  },

  loadEmergencyContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await getUserId();
      if (!userId) {
        set({ isLoading: false, error: 'Not logged in' });
        return [];
      }
      const resp = await api.get(`/elderly-profiles/${userId}`);
      const data = (resp.data && typeof resp.data === 'object' ? resp.data : {}) as Record<
        string,
        unknown
      >;
      const emergencyContacts = Array.isArray(data.emergencyContacts)
        ? (data.emergencyContacts as unknown[])
        : [];
      const contacts: EmergencyContact[] = emergencyContacts.map((c) => {
        const contact = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
        return {
          id: contact.id != null ? String(contact.id) : undefined,
          name: (contact.name as string) ?? '',
          phone: (contact.phone as string) ?? '',
          relationship: (contact.relationship as string) ?? '',
        };
      });
      set({ isLoading: false });
      return contacts;
    } catch (e) {
      set({ isLoading: false, error: `Error loading contacts: ${getErrorMessage(e)}` });
      return [];
    }
  },

  updateEmergencyContacts: async (contacts) => {
    set({ isUpdating: true, error: null });
    try {
      const userId = await getUserId();
      if (!userId) {
        set({ isUpdating: false, error: 'Not logged in' });
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
      set({ isUpdating: false, error: `Update error: ${getErrorMessage(e)}` });
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
      set({ isUpdating: false, error: `Update error: ${getErrorMessage(e)}` });
    }
  },
}));
