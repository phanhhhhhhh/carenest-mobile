import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import type { ElderlySummary } from '../../../shared/types';

/**
 * Port of Flutter's family_provider.dart.
 *
 * Contains three independent stores, one per original StateNotifier:
 *  - useFamilyDashboardStore  (FamilyDashboardNotifier)
 *  - useFamilyLinkStore       (FamilyLinkNotifier, was .autoDispose)
 *  - useLinkedFamilyStore     (LinkedFamilyNotifier)
 *
 * Note: the Flutter FamilyDashboardNotifier called `load()` from its
 * constructor and auto-refreshed every 30s via Timer.periodic. Screens here
 * should call `load()` on mount and may set up their own
 * `setInterval(() => useFamilyDashboardStore.getState().refresh(), 30000)`
 * for the periodic refresh, clearing it on unmount. Likewise
 * FamilyLinkNotifier/LinkedFamilyNotifier's constructor-time `load()` should
 * be triggered from the screen's mount effect.
 */

// ── Helpers ──────────────────────────────────────────────────────
function asListOfMaps(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((e) => (e && typeof e === 'object' ? (e as Record<string, unknown>) : {}));
  }
  return [];
}

function getErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message?: unknown }).message);
  }
  return 'unknown error';
}

function getStatus(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function getResponseData(e: unknown): Record<string, unknown> | null {
  if (e && typeof e === 'object' && 'response' in e) {
    const data = (e as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === 'object') return data as Record<string, unknown>;
  }
  return null;
}

function parseElderlySummary(j: Record<string, unknown>): ElderlySummary {
  return {
    elderlyId: j.elderlyId != null ? String(j.elderlyId) : '',
    elderlyName: (j.elderlyName as string) ?? '',
    healthConditions: Array.isArray(j.healthConditions)
      ? (j.healthConditions as unknown[]).map((e) => String(e))
      : [],
  };
}

// ── Family Dashboard ──────────────────────────────────────────────

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

      // Fetch all linked elderly
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

      // Preserve previously selected index if still valid
      const prevIndex = get().data?.selectedIndex ?? 0;
      const selectedIndex = prevIndex < elderlyList.length ? prevIndex : 0;
      const selectedElderlyId =
        elderlyList.length > 0 ? elderlyList[selectedIndex].elderlyId : null;

      // Count medications and taken status for selected elderly
      let totalMeds = 0;
      let takenMeds = 0;
      if (selectedElderlyId != null) {
        try {
          const medResp = await api.get(`/users/${selectedElderlyId}/medications`);
          const meds: unknown[] = Array.isArray(medResp.data) ? medResp.data : [];
          totalMeds = meds.length;

          // Count taken medications via log query for today
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
            // If log endpoint unavailable, count from medication data
            takenMeds = meds.filter(
              (m) => m && typeof m === 'object' && (m as Record<string, unknown>).taken === true,
            ).length;
          }
        } catch {
          // skip medication count
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

  // Switch to a different linked elderly profile.
  // Reloads all data for the newly selected elderly.
  selectElderly: async (index) => {
    const data = get().data;
    if (!data || index >= data.linkedElderly.length) return;

    set({
      data: {
        linkedElderly: data.linkedElderly,
        selectedIndex: index,
        // Reset counters — load() will refill
        totalMedications: 0,
        takenMedications: 0,
      },
    });

    // Reload to get medication counts for newly selected elderly
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

// ── Family Link operations ────────────────────────────────────────

interface FamilyLinkState {
  isLoading: boolean;
  error: string | null;
  success: boolean;

  sendLinkRequest: (elderlyId: string) => Promise<boolean>;
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
      const data = getResponseData(e);
      if (data) {
        const msg = String(data.error ?? data.message ?? 'Cannot send request');
        set({ isLoading: false, error: msg });
      } else {
        set({ isLoading: false, error: 'Connection error' });
      }
      return false;
    }
  },
}));

// ── Elderly-side linked family list ────────────────────────────────

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
