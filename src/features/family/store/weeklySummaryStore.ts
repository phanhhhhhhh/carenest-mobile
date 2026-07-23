import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage, isCancelled } from '../../../core/api/errors';
import { WeeklySummarySchema, safeParseOne } from '../../../shared/schemas';




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

function parseWeeklySummaryData(j: Record<string, unknown>): WeeklySummaryData | null {
  const validated = safeParseOne(WeeklySummarySchema, j, 'WeeklySummary');
  if (!validated) return null;

  const weekStart = validated.weekStart ?? '';
  const weekEnd = validated.weekEnd ?? '';
  const createdAt = validated.createdAt ?? '';
  return {
    id: j.id != null ? String(j.id) : String(Date.now()),
    title: validated.title ?? 'Weekly Health Summary',
    content: validated.content ?? validated.summary ?? validated.body ?? '',
    medicationAdherence: validated.medicationAdherence ?? 0,
    totalMetrics: validated.totalMetrics ?? 0,
    abnormalMetrics: validated.abnormalMetrics ?? 0,
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


interface WeeklySummaryState {
  isLoading: boolean;
  error: string | null;
  summaries: WeeklySummaryData[];
  latest: WeeklySummaryData | null;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  generateNow: (elderlyId: string) => Promise<WeeklySummaryData | null>;
}

export const useWeeklySummaryStore = create<WeeklySummaryState>((set) => ({
  isLoading: false,
  error: null,
  summaries: [],
  latest: null,

  load: async (elderlyId, signal) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/elderly/${elderlyId}/weekly-summary`, { signal });
      const data = resp.data as Record<string, unknown> | null;
      if (!data || Object.keys(data).length === 0) {
        set({ isLoading: false, summaries: [] });
        return;
      }
      const summary = parseWeeklySummaryData(data);
      if (!summary) {
        set({ isLoading: false, error: 'Phản hồi không hợp lệ từ máy chủ' });
        return;
      }
      set({ isLoading: false, summaries: [summary], latest: summary });
    } catch (e) {
      if (isCancelled(e)) return;
      const status = getStatus(e);
      if (status === 404 || status === 204) {
        set({ isLoading: false, summaries: [] });
        return;
      }
      set({ isLoading: false, error: `Không thể tải báo cáo: ${getErrorMessage(e)}` });
    }
  },

  generateNow: async (elderlyId) => {
    set({ isLoading: true });
    try {
      const resp = await api.post(`/elderly/${elderlyId}/weekly-summary/generate`);
      const raw = resp.data as Record<string, unknown>;
      const data = parseWeeklySummaryData(raw);
      if (!data) {
        set({ isLoading: false, error: 'Phản hồi không hợp lệ từ máy chủ' });
        return null;
      }
      set((state) => ({
        isLoading: false,
        latest: data,
        summaries: [data, ...state.summaries],
      }));
      return data;
    } catch (e) {
      set({ isLoading: false, error: `Không thể tạo báo cáo: ${getErrorMessage(e)}` });
      return null;
    }
  },
}));
