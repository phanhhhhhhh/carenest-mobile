import { create, type StoreApi, type UseBoundStore } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getResponseData, getErrorMessage, isCancelled } from '../../../core/api/errors';
import { GoogleFitStatusSchema, safeParseOne } from '../../../shared/schemas';



interface GoogleFitState {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isConfigured: boolean;
  isSyncing: boolean;
  lastSyncResult: string | null;
  authUrl: string | null;

  loadStatus: (signal?: AbortSignal) => Promise<void>;
  connect: () => Promise<string | null>;
  syncNow: () => Promise<Record<string, unknown> | null>;
  disconnect: () => Promise<boolean>;
  clearAuthUrl: () => void;
  refresh: () => void;
}

type GoogleFitStoreHook = UseBoundStore<StoreApi<GoogleFitState>>;

const stores = new Map<string, GoogleFitStoreHook>();

function createGoogleFitStore(elderlyId: string): GoogleFitStoreHook {
  return create<GoogleFitState>((set, get) => ({
    isLoading: false,
    error: null,
    isConnected: false,
    isConfigured: false,
    isSyncing: false,
    lastSyncResult: null,
    authUrl: null,

    loadStatus: async (signal) => {
      set({ isLoading: true, error: null });
      try {
        const resp = await api.get(`/google-fit/status/${elderlyId}`, { signal });
        const parsed = safeParseOne(GoogleFitStatusSchema, resp.data ?? {}, 'GoogleFitStatus');
        set({
          isLoading: false,
          isConnected: parsed?.connected === true,
          isConfigured: parsed?.configured === true,
        });
      } catch (e) {
        if (isCancelled(e)) return;
        if (getStatus(e) === 503) {
          set({
            isLoading: false,
            isConfigured: false,
            error: 'Google Fit is not configured on this server',
          });
          return;
        }
        set({ isLoading: false, error: `Could not check status: ${getErrorMessage(e)}` });
      }
    },

    connect: async () => {
      set({ isLoading: true, error: null, authUrl: null });
      try {
        const resp = await api.get(`/google-fit/connect/${elderlyId}`);
        const data = (resp.data ?? {}) as Record<string, unknown>;
        const url = (data.authUrl as string) ?? null;
        set({ isLoading: false, authUrl: url });
        return url;
      } catch (e) {
        if (getStatus(e) === 503) {
          set({ isLoading: false, error: 'Google Fit is not configured. Contact admin.' });
          return null;
        }
        set({ isLoading: false, error: `Could not connect: ${getErrorMessage(e)}` });
        return null;
      }
    },

    syncNow: async () => {
      set({ isSyncing: true, error: null });
      try {
        const resp = await api.post(`/google-fit/sync/${elderlyId}`);
        const data = (resp.data ?? {}) as Record<string, unknown>;
        set({ isSyncing: false, lastSyncResult: 'Sync completed successfully' });
        return data;
      } catch (e) {
        const respData = getResponseData(e) as Record<string, unknown> | undefined;
        const msg = respData && typeof respData.message === 'string' ? respData.message : 'Sync failed';
        set({ isSyncing: false, error: msg });
        return null;
      }
    },

    disconnect: async () => {
      set({ isLoading: true, error: null });
      try {
        await api.post(`/google-fit/disconnect/${elderlyId}`);
        set({ isLoading: false, isConnected: false });
        return true;
      } catch (e) {
        set({ isLoading: false, error: `Could not disconnect: ${getErrorMessage(e)}` });
        return false;
      }
    },

    clearAuthUrl: () => set({ authUrl: null }),
    refresh: () => {
      get().loadStatus();
    },
  }));
}


export function useGoogleFitStore(elderlyId: string): GoogleFitStoreHook {
  let hook = stores.get(elderlyId);
  if (!hook) {
    hook = createGoogleFitStore(elderlyId);
    stores.set(elderlyId, hook);
  }
  return hook;
}
