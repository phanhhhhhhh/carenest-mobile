import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorMessage, getStatus, isCancelled } from '../../../core/api/errors';

export interface DailyDigest {
  id: number;
  title: string;
  body: string;
  date?: string;
  quietDay: boolean;
  createdAt?: string;
}

function parseDigest(j: Record<string, unknown>): DailyDigest {
  return {
    id: Number(j.id) || 0,
    title: String(j.title ?? 'Bản tin gia đình'),
    body: String(j.body ?? ''),
    date: (j.date as string) ?? undefined,
    quietDay: Boolean(j.quietDay),
    createdAt: (j.createdAt as string) ?? undefined,
  };
}

interface FamilyDigestState {
  latest: DailyDigest | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  loadLatest: (signal?: AbortSignal) => Promise<void>;
  generateNow: (elderlyId: string) => Promise<boolean>;
}

export const useFamilyDigestStore = create<FamilyDigestState>((set, get) => ({
  latest: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  loadLatest: async (signal) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get('/family/digest/latest', { signal });
      if (resp.status === 204 || !resp.data) {
        set({ isLoading: false, latest: null });
        return;
      }
      set({ isLoading: false, latest: parseDigest(resp.data as Record<string, unknown>) });
    } catch (e) {
      if (isCancelled(e)) return;
      if (getStatus(e) === 204) {
        set({ isLoading: false, latest: null });
        return;
      }
      set({ isLoading: false, error: `Không tải được bản tin: ${getErrorMessage(e)}` });
    }
  },

  generateNow: async (elderlyId) => {
    set({ isGenerating: true, error: null });
    try {
      await api.post(`/elderly/${elderlyId}/digest/generate`);
      await get().loadLatest();
      set({ isGenerating: false });
      return true;
    } catch (e) {
      set({ isGenerating: false, error: `Không tạo được bản tin: ${getErrorMessage(e)}` });
      return false;
    }
  },
}));
