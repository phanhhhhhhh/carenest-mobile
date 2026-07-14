import { create } from 'zustand';
import api from '../../../core/api/client';
import { getUserId } from '../../../core/storage/secureStorage';

/**
 * Port of Flutter's health_report_provider.dart (HealthReportNotifier).
 *
 * The Flutter provider was `StateNotifierProvider.autoDispose` (no family
 * key) — `load(elderlyId)` was called explicitly with the id at call time,
 * same as here.
 */

// ── Types ────────────────────────────────────────────────────────
export interface DataPoint {
  recordedAt: string;
  value?: number;
  valueSecondary?: number;
}

export interface MetricReportData {
  type: string;
  unit: string;
  avgValue?: number;
  minValue?: number;
  maxValue?: number;
  count: number;
  trend: 'STABLE' | 'INCREASING' | 'DECREASING' | 'INSUFFICIENT_DATA';
  dataPoints: DataPoint[];
}

export interface MedicationAdherenceData {
  medicationName: string;
  taken: number;
  missed: number;
  adherenceRate: number;
}

interface HealthReportState {
  isLoading: boolean;
  error: string | null;
  elderlyName: string | null;
  fromDate: string | null;
  toDate: string | null;
  metricReports: MetricReportData[];
  adherenceData: MedicationAdherenceData[];
  totalAppointments: number;
  aiSummary: string | null;

  load: (elderlyId: string) => Promise<void>;
}

// ── Display helpers (ports of MetricReportData getters) ───────────
export function metricDisplayName(type: string): string {
  switch (type) {
    case 'BLOOD_PRESSURE':
      return 'Blood Pressure';
    case 'HEART_RATE':
      return 'Heart Rate';
    case 'BLOOD_GLUCOSE':
      return 'Blood Sugar';
    case 'WEIGHT':
      return 'Weight';
    case 'TEMPERATURE':
      return 'Temperature';
    case 'SPO2':
      return 'SpO₂';
    default:
      return type;
  }
}

export function trendLabel(trend: string): string {
  switch (trend) {
    case 'INCREASING':
      return '↑ Rising';
    case 'DECREASING':
      return '↓ Falling';
    case 'STABLE':
      return '→ Stable';
    default:
      return '— Insufficient data';
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function getStatus(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

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

function parseDataPoint(m: Record<string, unknown>): DataPoint {
  return {
    recordedAt: (m.recordedAt as string) ?? new Date().toISOString(),
    value: typeof m.value === 'number' ? m.value : undefined,
    valueSecondary: typeof m.valueSecondary === 'number' ? m.valueSecondary : undefined,
  };
}

function parseMetricReport(j: Record<string, unknown>): MetricReportData {
  const stats = (j.stats && typeof j.stats === 'object' ? j.stats : {}) as Record<
    string,
    unknown
  >;
  const points = Array.isArray(j.dataPoints)
    ? (j.dataPoints as unknown[]).map((e) => parseDataPoint(e as Record<string, unknown>))
    : [];
  return {
    type: (j.type as string) ?? '',
    unit: (j.unit as string) ?? '',
    avgValue: typeof stats.avgValue === 'number' ? stats.avgValue : undefined,
    minValue: typeof stats.minValue === 'number' ? stats.minValue : undefined,
    maxValue: typeof stats.maxValue === 'number' ? stats.maxValue : undefined,
    count: typeof stats.count === 'number' ? stats.count : 0,
    trend: ((stats.trend as string) ?? 'INSUFFICIENT_DATA') as MetricReportData['trend'],
    dataPoints: points,
  };
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// ── Store ────────────────────────────────────────────────────────
export const useHealthReportStore = create<HealthReportState>((set) => ({
  isLoading: false,
  error: null,
  elderlyName: null,
  fromDate: null,
  toDate: null,
  metricReports: [],
  adherenceData: [],
  totalAppointments: 0,
  aiSummary: null,

  load: async (elderlyId) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const fromStr = `${thirtyDaysAgo.getFullYear()}-${pad2(thirtyDaysAgo.getMonth() + 1)}-${pad2(
        thirtyDaysAgo.getDate(),
      )}`;
      const toStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

      // Fetch health report
      const reportResp = await api.get(`/elderly/${elderlyId}/health-report`, {
        params: { from: fromStr, to: toStr },
      });
      const reportData = (reportResp.data ?? {}) as Record<string, unknown>;
      const reports = Array.isArray(reportData.reports)
        ? (reportData.reports as unknown[]).map((e) =>
            parseMetricReport(e as Record<string, unknown>),
          )
        : [];

      // Fetch medications for adherence
      const adherence: MedicationAdherenceData[] = [];
      try {
        const userId = await getUserId();
        const medResp = await api.get(`/users/${userId}/medications`);
        const meds = asListOfMaps(medResp.data);
        for (const med of meds) {
          const medId = med.id != null ? String(med.id) : null;
          if (!medId) continue;
          try {
            const logResp = await api.get(`/medications/${medId}/logs`, {
              params: { from: fromStr, to: toStr },
            });
            const logs = asListOfMaps(logResp.data);
            const taken = logs.filter((l) => l.status === 'TAKEN').length;
            const missed = logs.filter((l) => l.status === 'MISSED').length;
            const total = taken + missed;
            adherence.push({
              medicationName: (med.name as string) ?? 'Unknown',
              taken,
              missed,
              adherenceRate: total > 0 ? taken / total : 0,
            });
          } catch {
            // skip this medication
          }
        }
      } catch {
        // skip adherence
      }

      // Count upcoming appointments
      let totalAppointments = 0;
      try {
        const userId = await getUserId();
        const apptResp = await api.get(`/users/${userId}/appointments`);
        totalAppointments = asListOfMaps(apptResp.data).length;
      } catch {
        // skip
      }

      // Try to get AI weekly summary
      let aiSummary: string | undefined;
      try {
        const summaryResp = await api.get(`/elderly/${elderlyId}/weekly-summary`);
        const summaryData = summaryResp.data;
        if (summaryData && typeof summaryData === 'object' && Object.keys(summaryData).length > 0) {
          const s = summaryData as Record<string, unknown>;
          aiSummary = (s.content as string) ?? (s.title as string) ?? undefined;
        }
      } catch {
        // skip AI summary
      }

      set({
        isLoading: false,
        elderlyName: (reportData.elderlyName as string) ?? null,
        fromDate: (reportData.from as string) ?? fromStr,
        toDate: (reportData.to as string) ?? toStr,
        metricReports: reports,
        adherenceData: adherence,
        totalAppointments,
        aiSummary: aiSummary ?? null,
      });
    } catch (e) {
      if (getStatus(e) === 404) {
        set({ isLoading: false, error: 'No health data available for this period' });
      } else {
        set({ isLoading: false, error: `Could not load health report: ${getErrorMessage(e)}` });
      }
    }
  },
}));
