import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { getErrorMessage, getStatus, getResponseData, isCancelled } from '../../../core/api/errors';
import type { ElderlySummary } from '../../../shared/types';
import { FamilyLinkSchema, safeParseList } from '../../../shared/schemas';

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

  load: (signal?: AbortSignal) => Promise<void>;
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

  load: async (signal) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (!userId) {
        set({ isLoading: false, error: 'Not logged in' });
        return;
      }

      // Single aggregate call replaces what used to be 3 sequential requests
      // (elderly list, medications, medication-logs) — see DashboardController.
      let payload: {
        elderly: Array<{
          elderlyId: number;
          elderlyName: string;
          healthConditions: string[] | null;
          medicationAdherence: { totalDue: number; taken: number } | null;
        }>;
      };
      try {
        const dashResp = await api.get(`/dashboard/family/${userId}`, { signal });
        payload = dashResp.data;
      } catch (e) {
        if (isCancelled(e)) return;
        set({
          isLoading: false,
          error: `API error: ${getStatus(e) ?? ''} ${getErrorMessage(e)}`,
        });
        return;
      }

      const elderlyList: ElderlySummary[] = (payload.elderly ?? []).map((e) => ({
        elderlyId: String(e.elderlyId),
        elderlyName: e.elderlyName ?? '',
        healthConditions: e.healthConditions ?? [],
      }));

      const prevIndex = get().data?.selectedIndex ?? 0;
      const selectedIndex = prevIndex < elderlyList.length ? prevIndex : 0;
      const selectedAdherence =
        elderlyList.length > 0 ? payload.elderly[selectedIndex]?.medicationAdherence : null;

      set({
        isLoading: false,
        lastRefreshed: new Date(),
        data: {
          linkedElderly: elderlyList,
          selectedIndex,
          totalMedications: selectedAdherence?.totalDue ?? 0,
          takenMedications: selectedAdherence?.taken ?? 0,
        },
      });
    } catch (e) {
      if (isCancelled(e)) return;
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

function toLinkedFamilyMember(l: ReturnType<typeof FamilyLinkSchema.parse>): LinkedFamilyMember {
  return {
    id: l.id ?? l.linkId ?? '',
    name: l.familyName ?? '',
    phone: '',
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
      const members = safeParseList(FamilyLinkSchema, resp.data, 'LinkedFamilyList').map(toLinkedFamilyMember);
      set({ isLoading: false, members });
    } catch (e) {
      set({ isLoading: false, error: `Error loading list: ${getErrorMessage(e)}` });
    }
  },
}));
