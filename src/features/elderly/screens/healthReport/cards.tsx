import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import {
  metricDisplayName,
  trendLabel,
  type MetricReportData,
  type MedicationAdherenceData,
} from '../../store/healthReportStore';

export function SectionCard({
  title,
  subtitle,
  icon,
  color,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={[styles.sectionIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.sectionCardTitle}>{title}</Text>
        <Text style={styles.sectionCardSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={26} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function AdherenceCard({ m }: { m: MedicationAdherenceData }) {
  const rate = m.adherenceRate;
  const color = rate >= 0.8 ? '#15803D' : rate >= 0.5 ? '#D97706' : '#DC2626';
  const bg = rate >= 0.8 ? '#DCFCE7' : rate >= 0.5 ? '#FEF3C7' : '#FEE2E2';

  return (
    <View style={[styles.adherenceCard, { borderColor: `${color}33` }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.adherenceName}>{m.medicationName}</Text>
        <Text style={styles.adherenceDetail}>
          Đã uống: <Text style={{ fontWeight: '700', color: '#15803D' }}>{m.taken}</Text> • Bỏ lỡ:{' '}
          <Text style={{ fontWeight: '700', color: '#DC2626' }}>{m.missed}</Text>
        </Text>
      </View>
      <View style={[styles.adherenceBadge, { backgroundColor: bg }]}>
        <Text style={[styles.adherenceBadgeText, { color }]}>{Math.round(rate * 100)}%</Text>
      </View>
    </View>
  );
}

export function MetricCard({ report }: { report: MetricReportData }) {
  let trendColor: string;
  switch (report.trend) {
    case 'INCREASING':
      trendColor = '#D97706';
      break;
    case 'DECREASING':
      trendColor = '#0284C7';
      break;
    case 'STABLE':
      trendColor = '#15803D';
      break;
    default:
      trendColor = '#64748B';
  }

  const maxVal = report.maxValue ?? 1;

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeaderRow}>
        <Text style={styles.metricTitle} numberOfLines={1}>
          {metricDisplayName(report.type)}
        </Text>
        <View style={[styles.metricTrendBadge, { backgroundColor: `${trendColor}1A` }]}>
          <Text style={[styles.metricTrendText, { color: trendColor }]}>
            {trendLabel(report.trend)}
          </Text>
        </View>
      </View>

      {report.dataPoints.length > 0 && (
        <View style={styles.barChart}>
          {report.dataPoints.map((dp, i) => {
            const fraction = maxVal > 0 ? (dp.value ?? 0) / maxVal : 0;
            const height = Math.min(56, Math.max(6, fraction * 56));
            return (
              <View key={i} style={styles.barSlot}>
                <View style={[styles.bar, { height }]} />
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.metricStatsRow}>
        <MetricStat
          label="Trung bình"
          value={`${report.avgValue !== undefined ? report.avgValue.toFixed(1) : '--'} ${report.unit}`}
        />
        <MetricStat
          label="Thấp nhất"
          value={`${report.minValue !== undefined ? report.minValue.toFixed(1) : '--'}`}
        />
        <MetricStat
          label="Cao nhất"
          value={`${report.maxValue !== undefined ? report.maxValue.toFixed(1) : '--'}`}
        />
        <View style={{ flex: 1 }} />
        <MetricStat label="Lượt đo" value={`${report.count}`} />
      </View>
    </View>
  );
}

function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statColLabel}>{label}</Text>
      <Text style={styles.statColValue}>{value}</Text>
    </View>
  );
}

export function AiSummaryCard({ summary }: { summary: string }) {
  return (
    <View style={styles.aiSummaryCard}>
      <View style={styles.aiSummaryHeader}>
        <View style={styles.aiSummaryIconWrap}>
          <Ionicons name="sparkles" size={20} color="#4F46E5" />
        </View>
        <Text style={styles.aiSummaryTitle}>Bác sĩ AI CareNest Tổng kết</Text>
      </View>
      <Text style={styles.aiSummaryText}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  sectionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  sectionCardSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },

  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 6, letterSpacing: -0.3 },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  adherenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    marginBottom: 10,
    ...Shadows.sm,
  },
  adherenceName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  adherenceDetail: { fontSize: 13, color: '#64748B', marginTop: 3 },
  adherenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  adherenceBadgeText: { fontSize: 15, fontWeight: '800' },

  metricCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...Shadows.sm,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metricTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', flex: 1 },
  metricTrendBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metricTrendText: { fontSize: 12, fontWeight: '800' },
  barChart: { height: 60, flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  barSlot: { flex: 1, marginHorizontal: 2, justifyContent: 'flex-end' },
  bar: { borderRadius: 4, backgroundColor: Colors.primary },
  metricStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 14,
  },
  statCol: { alignItems: 'flex-start' },
  statColLabel: { fontSize: 11.5, color: '#94A3B8', fontWeight: '600' },
  statColValue: { fontSize: 13.5, fontWeight: '700', color: '#0F172A', marginTop: 2 },

  aiSummaryCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  aiSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiSummaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  aiSummaryTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  aiSummaryText: { fontSize: 14.5, color: '#312E81', lineHeight: 22, fontWeight: '500' },
});
