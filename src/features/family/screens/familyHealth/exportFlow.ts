import type {
  HealthReportExportParams,
  HealthReportExportResult,
} from '../../services/healthReportExportService';

export type HealthPeriod = 'week' | 'month';

export function getHealthExportRange(period: HealthPeriod, now = new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - (period === 'week' ? 7 : 30));
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function startHealthReportExport(
  isPremium: boolean,
  params: HealthReportExportParams,
  exportPdf: (request: HealthReportExportParams) => Promise<HealthReportExportResult>,
): Promise<HealthReportExportResult> {
  if (!isPremium) return { kind: 'premium_required' };
  return exportPdf(params);
}
