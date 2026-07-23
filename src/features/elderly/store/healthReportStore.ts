import { create } from 'zustand';
import api from '../../../core/api/client';
import { getUserId } from '../../../core/storage/secureStorage';
import { getStatus, getErrorMessage, asListOfMaps } from '../../../core/api/errors';



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

export function metricDisplayName(type: string): string {
  switch (type) {
    case 'BLOOD_PRESSURE':
      return 'Huyết áp';
    case 'HEART_RATE':
      return 'Nhịp tim';
    case 'BLOOD_GLUCOSE':
      return 'Đường huyết';
    case 'WEIGHT':
      return 'Cân nặng';
    case 'TEMPERATURE':
      return 'Nhiệt độ';
    case 'SPO2':
      return 'SpO₂';
    default:
      return type;
  }
}

export function trendLabel(trend: string): string {
  switch (trend) {
    case 'INCREASING':
      return '↑ Đang tăng';
    case 'DECREASING':
      return '↓ Đang giảm';
    case 'STABLE':
      return '→ Ổn định';
    default:
      return '— Không đủ dữ liệu';
  }
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

      const reportResp = await api.get(`/elderly/${elderlyId}/health-report`, {
        params: { from: fromStr, to: toStr },
      });
      const reportData = (reportResp.data ?? {}) as Record<string, unknown>;
      const reports = Array.isArray(reportData.reports)
        ? (reportData.reports as unknown[]).map((e) =>
            parseMetricReport(e as Record<string, unknown>),
          )
        : [];

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
          }
        }
      } catch {
      }

      let totalAppointments = 0;
      try {
        const userId = await getUserId();
        const apptResp = await api.get(`/users/${userId}/appointments`);
        totalAppointments = asListOfMaps(apptResp.data).length;
      } catch {
      }

      let aiSummary: string | undefined;
      try {
        const summaryResp = await api.get(`/elderly/${elderlyId}/weekly-summary`);
        const summaryData = summaryResp.data;
        if (summaryData && typeof summaryData === 'object' && Object.keys(summaryData).length > 0) {
          const s = summaryData as Record<string, unknown>;
          aiSummary = (s.content as string) ?? (s.title as string) ?? undefined;
        }
      } catch {
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
        set({ isLoading: false, error: 'Không có dữ liệu sức khỏe cho khoảng thời gian này' });
      } else {
        set({ isLoading: false, error: `Không thể tải báo cáo sức khỏe: ${getErrorMessage(e)}` });
      }
    }
  },
}));
