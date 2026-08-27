import { create, type StoreApi, type UseBoundStore } from 'zustand';
import api from '../../../core/api/client';
import type { HealthMetric } from '../../../shared/types';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import { HealthMetricSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

interface HealthMetricState {
  isLoading: boolean;
  error: string | null;
  metrics: HealthMetric[];
  latestByType: Record<string, HealthMetric>;

  load: (params?: { fromDate?: Date; toDate?: Date }, signal?: AbortSignal) => Promise<void>;
  loadPeriod: (period: 'week' | 'month') => Promise<void>;
  addMetric: (params: { type: string; value: string; unit?: string }) => Promise<boolean>;
}

type HealthMetricStoreHook = UseBoundStore<StoreApi<HealthMetricState>>;

function toHealthMetric(m: ReturnType<typeof HealthMetricSchema.parse>): HealthMetric {
  return {
    id: m.id,
    type: m.type,
    value: String(m.value),
    valueSecondary: m.valueSecondary != null ? String(m.valueSecondary) : undefined,
    unit: m.unit ?? undefined,
    recordedAt: m.recordedAt,
  };
}

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

const stores = new Map<string, HealthMetricStoreHook>();

function createHealthMetricStore(elderlyId: string): HealthMetricStoreHook {
  return create<HealthMetricState>((set, get) => ({
    isLoading: false,
    error: null,
    metrics: [],
    latestByType: {},

    load: async ({ fromDate, toDate } = {}, signal) => {
      set({ isLoading: true, error: null });
      try {
        const params: Record<string, string> = {};
        if (fromDate) params.from = toDateOnly(fromDate);
        if (toDate) params.to = toDateOnly(toDate);

        const resp = await api.get(`/elderly/${elderlyId}/health-metrics`, {
          params: Object.keys(params).length > 0 ? params : undefined,
          signal,
        });
        if (!Array.isArray(resp.data)) {
          console.warn('[schema] HealthMetricList: expected an array — keeping previous state');
          set({ isLoading: false, error: 'Phản hồi không hợp lệ từ máy chủ' });
          return;
        }
        const list = safeParseList(HealthMetricSchema, resp.data, 'HealthMetricList').map(
          toHealthMetric,
        );
        const latest: Record<string, HealthMetric> = {};
        for (const m of list) {
          const existing = latest[m.type];
          if (!existing || new Date(m.recordedAt) > new Date(existing.recordedAt)) {
            latest[m.type] = m;
          }
        }
        set({ isLoading: false, metrics: list, latestByType: latest });
      } catch (e) {
        if (isCancelled(e)) return;
        set({ isLoading: false, error: `Lỗi: ${getErrorMessage(e)}` });
      }
    },

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
          recordedAt: new Date().toISOString(),
          ...(unit !== undefined ? { unit } : {}),
        });
        await get().load();
        return true;
      } catch (e) {
        const message = `Không thể lưu chỉ số: ${getErrorMessage(e)}`;
        set({ error: message });
        showErrorToast(message);
        return false;
      }
    },
  }));
}

export function useHealthMetricStore(elderlyId: string): HealthMetricStoreHook {
  let hook = stores.get(elderlyId);
  if (!hook) {
    hook = createHealthMetricStore(elderlyId);
    stores.set(elderlyId, hook);
  }
  return hook;
}
