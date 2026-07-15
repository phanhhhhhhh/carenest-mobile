import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { asListOfMaps, getErrorMessage, getStatus, getResponseData } from '../../../core/api/errors';
import type { ElderlySummary } from '../../../shared/types';



function parseElderlySummary(j: Record<string, unknown>): ElderlySummary {
  return {
    elderlyId: j.elderlyId != null ? String(j.elderlyId) : '',
    elderlyName: (j.elderlyName as string) ?? '',
    healthConditions: Array.isArray(j.healthConditions)
      ? (j.healthConditions as unknown[]).map((e) => String(e))
      : [],
  };
}


export interface FamilyDashboardData {
  linkedElderly: ElderlySummary[];
  selectedIndex: number;
  totalMedications: number;
  takenMedications: number;
}

interface FamilyDashboardState {
  isLoading: boolean;
  error: string | null;
  data: FamilyDashboardData | null;
  lastRefreshed: Date | null;

  load: () => Promise<void>;
  selectElderly: (index: number) => Promise<void>;
  refresh: () => void;
  elderlyId: () => string | null;
  elderlyName: () => string | null;
  healthConditions: () => string[];
}

export const useFamilyDashboardStore = create<FamilyDashboardState>((set, get) => ({
  isLoading: false,
  error: null,
  data: null,
  lastRefreshed: null,

  load: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (!userId) {
        set({ isLoading: false, error: 'Not logged in' });
        return;
      }

      let elderlyList: ElderlySummary[] = [];
      try {
        const familyResp = await api.get(`/family/${userId}/elderly`);
        elderlyList = asListOfMaps(familyResp.data).map(parseElderlySummary);
      } catch (e) {
        set({
          isLoading: false,
          error: `API error: ${getStatus(e) ?? ''} ${getErrorMessage(e)}`,
        });
        return;
      }

      const prevIndex = get().data?.selectedIndex ?? 0;
      const selectedIndex = prevIndex < elderlyList.length ? prevIndex : 0;
      const selectedElderlyId =
        elderlyList.length > 0 ? elderlyList[selectedIndex].elderlyId : null;

      let totalMeds = 0;
      let takenMeds = 0;
      if (selectedElderlyId != null) {
        try {
          const medResp = await api.get(`/users/${selectedElderlyId}/medications`);
          const meds: unknown[] = Array.isArray(medResp.data) ? medResp.data : [];
          totalMeds = meds.length;

          try {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const logResp = await api.get(`/elderly/${selectedElderlyId}/medication-logs`, {
              params: { date: todayStr },
            });
            const logs: unknown[] = Array.isArray(logResp.data) ? logResp.data : [];
            takenMeds = logs.filter(
              (l) => l && typeof l === 'object' && (l as Record<string, unknown>).status === 'TAKEN',
            ).length;
          } catch {
            takenMeds = meds.filter(
              (m) => m && typeof m === 'object' && (m as Record<string, unknown>).taken === true,
            ).length;
          }
        } catch {
        }
      }

      set({
        isLoading: false,
        lastRefreshed: new Date(),
        data: {
          linkedElderly: elderlyList,
          selectedIndex,
          totalMedications: totalMeds,
          takenMedications: takenMeds,
        },
      });
    } catch {
      set({ isLoading: false, error: 'Connection error' });
    }
  },

  selectElderly: async (index) => {
    const data = get().data;
    if (!data || index >= data.linkedElderly.length) return;

    set({
      data: {
        linkedElderly: data.linkedElderly,
        selectedIndex: index,
        totalMedications: 0,
        takenMedications: 0,
      },
    });

    await get().load();
  },

  refresh: () => {
    get().load();
  },

  elderlyId: () => {
    const data = get().data;
    return data && data.linkedElderly.length > 0 && data.selectedIndex < data.linkedElderly.length
      ? data.linkedElderly[data.selectedIndex].elderlyId
      : null;
  },

  elderlyName: () => {
    const data = get().data;
    return data && data.linkedElderly.length > 0 && data.selectedIndex < data.linkedElderly.length
      ? data.linkedElderly[data.selectedIndex].elderlyName
      : null;
  },

  healthConditions: () => {
    const data = get().data;
    return data && data.linkedElderly.length > 0 && data.selectedIndex < data.linkedElderly.length
      ? data.linkedElderly[data.selectedIndex].healthConditions
      : [];
  },
}));


interface FamilyLinkState {
  isLoading: boolean;
  error: string | null;
  success: boolean;

  sendLinkRequest: (elderlyId: string) => Promise<boolean>;
  lookupUserByPhone: (phone: string) => Promise<string | null>;
}

export const useFamilyLinkStore = create<FamilyLinkState>((set) => ({
  isLoading: false,
  error: null,
  success: false,

  sendLinkRequest: async (elderlyId) => {
    set({ isLoading: true, error: null, success: false });
    try {
      const familyId = await storage.getUserId();
      if (!familyId) {
        set({ isLoading: false, error: 'Not logged in' });
        return false;
      }
      await api.post('/family-links', {
        familyId: Number.parseInt(familyId, 10),
        elderlyId: Number.parseInt(elderlyId, 10),
        relationship: 'family',
      });
      set({ isLoading: false, success: true });
      return true;
    } catch (e) {
      const data = getResponseData(e) as Record<string, unknown> | undefined;
      if (data) {
        const msg = String(data.error ?? data.message ?? 'Cannot send request');
        set({ isLoading: false, error: msg });
      } else {
        set({ isLoading: false, error: 'Connection error' });
      }
      return false;
    }
  },

  lookupUserByPhone: async (phone) => {
    try {
      const resp = await api.get(`/users/by-phone/${phone}`);
      const id = resp.data?.id != null ? String(resp.data.id) : null;
      return id;
    } catch {
      return null;
    }
  },
}));


export interface LinkedFamilyMember {
  id: string;
  name: string;
  phone: string;
}

function parseLinkedFamilyMember(j: Record<string, unknown>): LinkedFamilyMember {
  return {
    id: j.id != null ? String(j.id) : '',
    name: (j.userName as string) ?? '',
    phone: (j.phoneNumber as string) ?? '',
  };
}

interface LinkedFamilyState {
  isLoading: boolean;
  error: string | null;
  members: LinkedFamilyMember[];

  load: () => Promise<void>;
}

export const useLinkedFamilyStore = create<LinkedFamilyState>((set) => ({
  isLoading: false,
  error: null,
  members: [],

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (!userId) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/elderly/${userId}/family`);
      const members = asListOfMaps(resp.data).map(parseLinkedFamilyMember);
      set({ isLoading: false, members });
    } catch (e) {
      set({ isLoading: false, error: `Error loading list: ${getErrorMessage(e)}` });
    }
  },
}));
