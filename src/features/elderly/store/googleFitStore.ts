import { create, type StoreApi, type UseBoundStore } from 'zustand';
import api from '../../../core/api/client';

/**
 * Port of Flutter's google_fit_provider.dart (GoogleFitNotifier).
 *
 * This provider is a thin client over the backend's /google-fit REST
 * endpoints (status/connect/sync/disconnect) — the actual Google Fit OAuth
 * and data sync happen server-side, so there is no native Google Fit /
 * Health Connect SDK involved here and nothing to stub out.
 *
 * The Flutter provider was a `StateNotifierProvider.family<..., String>`
 * keyed by elderlyId — one notifier instance per elderly user. Zustand has
 * no built-in "family" concept, so we memoize one store per elderlyId here,
 * the same pattern used in healthMetricStore.ts.
 *
 * Note: the Flutter notifier called `loadStatus()` automatically from its
 * constructor. Callers here should invoke `loadStatus()` from a screen's
 * mount effect instead.
 */

// ── Types ────────────────────────────────────────────────────────
interface GoogleFitState {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isConfigured: boolean;
  isSyncing: boolean;
  lastSyncResult: string | null;
  authUrl: string | null;

  loadStatus: () => Promise<void>;
  connect: () => Promise<string | null>;
  syncNow: () => Promise<Record<string, unknown> | null>;
  disconnect: () => Promise<boolean>;
  clearAuthUrl: () => void;
  refresh: () => void;
}

type GoogleFitStoreHook = UseBoundStore<StoreApi<GoogleFitState>>;

// ── Helpers ──────────────────────────────────────────────────────
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

function getErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message?: unknown }).message);
  }
  return 'unknown error';
}

// ── Store factory (family) ────────────────────────────────────────
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

    // GET /api/google-fit/status/{userId}
    loadStatus: async () => {
      set({ isLoading: true, error: null });
      try {
        const resp = await api.get(`/google-fit/status/${elderlyId}`);
        const data = (resp.data ?? {}) as Record<string, unknown>;
        set({
          isLoading: false,
          isConnected: data.connected === true,
          isConfigured: data.configured === true,
        });
      } catch (e) {
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

    // GET /api/google-fit/connect/{userId} → returns auth URL
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

    // POST /api/google-fit/sync/{userId}
    syncNow: async () => {
      set({ isSyncing: true, error: null });
      try {
        const resp = await api.post(`/google-fit/sync/${elderlyId}`);
        const data = (resp.data ?? {}) as Record<string, unknown>;
        set({ isSyncing: false, lastSyncResult: 'Sync completed successfully' });
        return data;
      } catch (e) {
        const respData = getResponseData(e);
        const msg = respData && typeof respData.message === 'string' ? respData.message : 'Sync failed';
        set({ isSyncing: false, error: msg });
        return null;
      }
    },

    // POST /api/google-fit/disconnect/{userId}
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

/** Get (or lazily create) the Google Fit store for a given elderlyId. */
export function useGoogleFitStore(elderlyId: string): GoogleFitState {
  let hook = stores.get(elderlyId);
  if (!hook) {
    hook = createGoogleFitStore(elderlyId);
    stores.set(elderlyId, hook);
  }
  return hook();
}
