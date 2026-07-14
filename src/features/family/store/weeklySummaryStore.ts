import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage } from '../../../core/api/errors';

/**
 * Port of Flutter's weekly_summary_provider.dart (WeeklySummaryNotifier).
 *
 * The Flutter provider was a `StateNotifierProvider.family<..., String>`
 * keyed by elderlyId. Following the same convention used elsewhere in this
 * port (e.g. medicationStore.ts / cameraStore.ts), this is a single shared
 * store whose actions take `elderlyId` as a parameter.
 *
 * Note: the Flutter notifier called `load()` from its constructor. Callers
 * here should invoke `load(elderlyId)` from a screen's mount effect instead.
 */

// ── Models ────────────────────────────────────────────────────────────

export interface WeeklySummaryData {
  id: string;
  title: string;
  content: string;
  medicationAdherence: number;
  totalMetrics: number;
  abnormalMetrics: number;
  weekStart: string;
  weekEnd: string;
  createdAt: string;
}

function parseWeeklySummaryData(j: Record<string, unknown>): WeeklySummaryData {
  const weekStart = j.weekStart != null ? String(j.weekStart) : '';
  const weekEnd = j.weekEnd != null ? String(j.weekEnd) : '';
  const createdAt = j.createdAt != null ? String(j.createdAt) : '';
  return {
    id: j.id != null ? String(j.id) : '',
    title: (j.title as string) ?? 'Weekly Health Summary',
    content: (j.content as string) ?? '',
    medicationAdherence: j.medicationAdherence != null ? Number(j.medicationAdherence) : 0,
    totalMetrics: j.totalMetrics != null ? Number(j.totalMetrics) : 0,
    abnormalMetrics: j.abnormalMetrics != null ? Number(j.abnormalMetrics) : 0,
    weekStart: isValidIsoDate(weekStart)
      ? weekStart
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    weekEnd: isValidIsoDate(weekEnd) ? weekEnd : new Date().toISOString(),
    createdAt: isValidIsoDate(createdAt) ? createdAt : new Date().toISOString(),
  };
}

function isValidIsoDate(s: string): boolean {
  return s !== '' && !Number.isNaN(new Date(s).getTime());
}

export function getWeekLabel(s: WeeklySummaryData): string {
  const start = new Date(s.weekStart);
  const end = new Date(s.weekEnd);
  return `${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}`;
}

// ── State ──────────────────────────────────────────────────────────────

interface WeeklySummaryState {
  isLoading: boolean;
  error: string | null;
  summaries: WeeklySummaryData[];
  latest: WeeklySummaryData | null;

  load: (elderlyId: string) => Promise<void>;
  generateNow: (elderlyId: string) => Promise<WeeklySummaryData | null>;
}

export const useWeeklySummaryStore = create<WeeklySummaryState>((set) => ({
  isLoading: false,
  error: null,
  summaries: [],
  latest: null,

  load: async (elderlyId) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/elderly/${elderlyId}/weekly-summary`);
      const data = resp.data as Record<string, unknown> | null;
      if (!data || Object.keys(data).length === 0) {
        set({ isLoading: false, summaries: [] });
        return;
      }
      const summary = parseWeeklySummaryData(data);
      set({ isLoading: false, summaries: [summary], latest: summary });
    } catch (e) {
      const status = getStatus(e);
      if (status === 404 || status === 204) {
        set({ isLoading: false, summaries: [] });
        return;
      }
      set({ isLoading: false, error: `Could not load reports: ${getErrorMessage(e)}` });
    }
  },

  generateNow: async (elderlyId) => {
    set({ isLoading: true });
    try {
      const resp = await api.post(`/elderly/${elderlyId}/weekly-summary/generate`);
      const raw = resp.data as Record<string, unknown>;
      // Backend returns {message, summary}; adapt to WeeklySummaryData
      const data: WeeklySummaryData = {
        id: String(Date.now()),
        title: 'Weekly Health Summary',
        content: (raw.summary as string) ?? (raw.message as string) ?? '',
        medicationAdherence: 0,
        totalMetrics: 0,
        abnormalMetrics: 0,
        weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        weekEnd: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        isLoading: false,
        latest: data,
        summaries: [data, ...state.summaries],
      }));
      return data;
    } catch (e) {
      set({ isLoading: false, error: `Could not generate report: ${getErrorMessage(e)}` });
      return null;
    }
  },
}));
