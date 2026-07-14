import { create, type StoreApi, type UseBoundStore } from 'zustand';
import api from '../../../core/api/client';
import type { HealthMetric } from '../../../shared/types';

/**
 * Port of Flutter's health_metric_provider.dart (HealthMetricNotifier).
 *
 * The Flutter provider was a `StateNotifierProvider.family<..., String>`
 * keyed by elderlyId — one notifier instance per elderly user. Zustand has
 * no built-in "family" concept, so we memoize one store per elderlyId here.
 *
 * Note: the Flutter notifier called `load()` automatically from its
 * constructor. Callers here should invoke `load()` from a screen's mount
 * effect instead.
 */

// ── Types ────────────────────────────────────────────────────────
interface HealthMetricState {
  isLoading: boolean;
  error: string | null;
  metrics: HealthMetric[];
  latestByType: Record<string, HealthMetric>;

  load: (params?: { fromDate?: Date; toDate?: Date }) => Promise<void>;
  loadPeriod: (period: 'week' | 'month') => Promise<void>;
  addMetric: (params: { type: string; value: string; unit?: string }) => Promise<void>;
}

type HealthMetricStoreHook = UseBoundStore<StoreApi<HealthMetricState>>;

// ── Helpers ──────────────────────────────────────────────────────
function getErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message?: unknown }).message);
  }
  return 'unknown error';
}

function asListOfMaps(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((e) => (e && typeof e === 'object' ? (e as Record<string, unknown>) : {}));
  }
  return [];
}

function parseMetric(j: Record<string, unknown>): HealthMetric {
  const rawValue = j.value;
  const rawSecondary = j.valueSecondary;
  return {
    id: String(j.id ?? ''),
    type: (j.type as string) ?? '',
    value: rawValue != null ? String(rawValue) : '',
    valueSecondary: rawSecondary != null ? String(rawSecondary) : undefined,
    unit: (j.unit as string) ?? undefined,
    recordedAt: (j.recordedAt as string) ?? new Date().toISOString(),
  };
}

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ── Store factory (family) ────────────────────────────────────────
const stores = new Map<string, HealthMetricStoreHook>();

function createHealthMetricStore(elderlyId: string): HealthMetricStoreHook {
  return create<HealthMetricState>((set, get) => ({
    isLoading: false,
    error: null,
    metrics: [],
    latestByType: {},

    load: async ({ fromDate, toDate } = {}) => {
      set({ isLoading: true, error: null });
      try {
        const params: Record<string, string> = {};
        if (fromDate) params.from = toDateOnly(fromDate);
        if (toDate) params.to = toDateOnly(toDate);

        const resp = await api.get(`/elderly/${elderlyId}/health-metrics`, {
          params: Object.keys(params).length > 0 ? params : undefined,
        });
        const list = asListOfMaps(resp.data).map(parseMetric);
        const latest: Record<string, HealthMetric> = {};
        for (const m of list) {
          const existing = latest[m.type];
          if (!existing || new Date(m.recordedAt) > new Date(existing.recordedAt)) {
            latest[m.type] = m;
          }
        }
        set({ isLoading: false, metrics: list, latestByType: latest });
      } catch (e) {
        set({ isLoading: false, error: `Error: ${getErrorMessage(e)}` });
      }
    },

    // Reload with period filter: 'week' = last 7 days, 'month' = last 30 days.
    loadPeriod: async (period) => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - (period === 'month' ? 30 : 7));
      await get().load({ fromDate: from, toDate: now });
    },

    addMetric: async ({ type, value, unit }) => {
      try {
        await api.post(`/elderly/${elderlyId}/health-metrics`, {
          elderlyId: Number.parseInt(elderlyId, 10) || undefined,
          type,
          value,
          ...(unit !== undefined ? { unit } : {}),
        });
        await get().load();
      } catch (e) {
        set({ error: `Error: ${getErrorMessage(e)}` });
      }
    },
  }));
}

/** Get (or lazily create) the health metric store for a given elderlyId. */
export function useHealthMetricStore(elderlyId: string): HealthMetricState {
  let hook = stores.get(elderlyId);
  if (!hook) {
    hook = createHealthMetricStore(elderlyId);
    stores.set(elderlyId, hook);
  }
  return hook();
}
