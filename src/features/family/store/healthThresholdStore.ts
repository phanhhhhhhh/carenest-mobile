import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage } from '../../../core/api/errors';




export interface ThresholdItem {
  id: number;
  metricType: string;
  minValue?: number;
  maxValue?: number;
  minValueSecondary?: number;
  maxValueSecondary?: number;
  alertFamily: boolean;
}

function parseThresholdItem(j: Record<string, unknown>): ThresholdItem {
  return {
    id: Number(j.id ?? 0),
    metricType: (j.metricType as string) ?? '',
    minValue: j.minValue != null ? Number(j.minValue) : undefined,
    maxValue: j.maxValue != null ? Number(j.maxValue) : undefined,
    minValueSecondary: j.minValueSecondary != null ? Number(j.minValueSecondary) : undefined,
    maxValueSecondary: j.maxValueSecondary != null ? Number(j.maxValueSecondary) : undefined,
    alertFamily: (j.alertFamily as boolean) ?? true,
  };
}

function fmt(v: number | undefined): string {
  return v != null ? String(v) : '–';
}

export function getDisplayType(t: ThresholdItem): string {
  switch (t.metricType) {
    case 'BLOOD_PRESSURE':
      return 'Blood Pressure';
    case 'BLOOD_GLUCOSE':
      return 'Blood Sugar';
    case 'HEART_RATE':
      return 'Heart Rate';
    case 'WEIGHT':
      return 'Weight';
    default:
      return t.metricType;
  }
}

export function getUnit(t: ThresholdItem): string {
  switch (t.metricType) {
    case 'BLOOD_PRESSURE':
      return 'mmHg';
    case 'BLOOD_GLUCOSE':
      return 'mmol/L';
    case 'HEART_RATE':
      return 'bpm';
    case 'WEIGHT':
      return 'kg';
    default:
      return '';
  }
}

export function isBloodPressure(t: ThresholdItem): boolean {
  return t.metricType === 'BLOOD_PRESSURE';
}

export function getRangeDisplay(t: ThresholdItem): string {
  return isBloodPressure(t)
    ? `${fmt(t.minValue)}/${fmt(t.minValueSecondary)} – ${fmt(t.maxValue)}/${fmt(t.maxValueSecondary)}`
    : `${fmt(t.minValue)} – ${fmt(t.maxValue)}`;
}

export interface RecommendData {
  metricType: string;
  minValue?: number;
  maxValue?: number;
  minValueSecondary?: number;
  maxValueSecondary?: number;
}

function parseRecommendData(j: Record<string, unknown>): RecommendData {
  return {
    metricType: (j.metricType as string) ?? '',
    minValue: j.minValue != null ? Number(j.minValue) : undefined,
    maxValue: j.maxValue != null ? Number(j.maxValue) : undefined,
    minValueSecondary: j.minValueSecondary != null ? Number(j.minValueSecondary) : undefined,
    maxValueSecondary: j.maxValueSecondary != null ? Number(j.maxValueSecondary) : undefined,
  };
}


interface ThresholdState {
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  thresholds: ThresholdItem[];
  recommendations: RecommendData[] | null;

  load: (elderlyId: string) => Promise<void>;
  create: (
    elderlyId: string,
    params: {
      metricType: string;
      minValue?: number;
      maxValue?: number;
      minValueSecondary?: number;
      maxValueSecondary?: number;
      alertFamily?: boolean;
    },
  ) => Promise<boolean>;
  update: (
    elderlyId: string,
    thresholdId: number,
    params: {
      minValue?: number;
      maxValue?: number;
      minValueSecondary?: number;
      maxValueSecondary?: number;
      alertFamily?: boolean;
    },
  ) => Promise<boolean>;
  delete: (elderlyId: string, thresholdId: number) => Promise<boolean>;
  getRecommendations: (elderlyId: string) => Promise<RecommendData[] | null>;
  clearRecommendations: () => void;
  findFor: (metricType: string) => ThresholdItem | null;
}

export const useHealthThresholdStore = create<ThresholdState>((set, get) => ({
  isLoading: false,
  error: null,
  isSaving: false,
  thresholds: [],
  recommendations: null,

  load: async (elderlyId) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/users/${elderlyId}/health-thresholds`);
      const list: unknown[] = Array.isArray(resp.data) ? resp.data : [];
      const thresholds = list.map((e) => parseThresholdItem(e as Record<string, unknown>));
      set({ isLoading: false, thresholds });
    } catch (e) {
      if (getStatus(e) === 404) {
        set({ isLoading: false, thresholds: [] });
        return;
      }
      set({ isLoading: false, error: `Could not load thresholds: ${getErrorMessage(e)}` });
    }
  },

  create: async (
    elderlyId,
    { metricType, minValue, maxValue, minValueSecondary, maxValueSecondary, alertFamily = true },
  ) => {
    set({ isSaving: true });
    try {
      const data: Record<string, unknown> = { metricType, alertFamily };
      if (minValue != null) data.minValue = minValue;
      if (maxValue != null) data.maxValue = maxValue;
      if (minValueSecondary != null) data.minValueSecondary = minValueSecondary;
      if (maxValueSecondary != null) data.maxValueSecondary = maxValueSecondary;
      await api.post(`/users/${elderlyId}/health-thresholds`, data);
      await get().load(elderlyId);
      set({ isSaving: false });
      return true;
    } catch (e) {
      set({ isSaving: false, error: `Could not save: ${getErrorMessage(e)}` });
      return false;
    }
  },

  update: async (
    elderlyId,
    thresholdId,
    { minValue, maxValue, minValueSecondary, maxValueSecondary, alertFamily },
  ) => {
    set({ isSaving: true });
    try {
      const data: Record<string, unknown> = {};
      if (minValue != null) data.minValue = minValue;
      if (maxValue != null) data.maxValue = maxValue;
      if (minValueSecondary != null) data.minValueSecondary = minValueSecondary;
      if (maxValueSecondary != null) data.maxValueSecondary = maxValueSecondary;
      if (alertFamily != null) data.alertFamily = alertFamily;
      await api.patch(`/health-thresholds/${thresholdId}`, data);
      await get().load(elderlyId);
      set({ isSaving: false });
      return true;
    } catch (e) {
      set({ isSaving: false, error: `Could not update: ${getErrorMessage(e)}` });
      return false;
    }
  },

  delete: async (elderlyId, thresholdId) => {
    try {
      await api.delete(`/health-thresholds/${thresholdId}`);
      await get().load(elderlyId);
      return true;
    } catch (e) {
      set({ error: `Could not delete: ${getErrorMessage(e)}` });
      return false;
    }
  },

  getRecommendations: async (elderlyId) => {
    set({ isLoading: true, recommendations: null });
    try {
      const resp = await api.get(`/users/${elderlyId}/health-thresholds/recommend`);
      const data = resp.data as Record<string, unknown>;
      const raw: unknown[] = Array.isArray(data.recommendations) ? data.recommendations : [];
      const list = raw.map((e) => parseRecommendData(e as Record<string, unknown>));
      set({ isLoading: false, recommendations: list });
      return list;
    } catch (e) {
      set({ isLoading: false, error: `Could not get recommendations: ${getErrorMessage(e)}` });
      return null;
    }
  },

  clearRecommendations: () => set({ recommendations: null }),

  findFor: (metricType) => {
    const found = get().thresholds.find((t) => t.metricType === metricType);
    return found ?? null;
  },
}));
