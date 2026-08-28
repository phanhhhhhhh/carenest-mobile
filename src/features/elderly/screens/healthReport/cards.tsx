import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
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
        <Ionicons name={icon} size={22} color={color} />
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
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function AdherenceCard({ m }: { m: MedicationAdherenceData }) {
  const rate = m.adherenceRate;
  const color = rate >= 0.8 ? Colors.success : rate >= 0.5 ? Colors.warning : Colors.error;
  return (
    <View style={[styles.adherenceCard, { borderColor: `${color}4D` }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.adherenceName}>{m.medicationName}</Text>
        <Text style={styles.adherenceDetail}>
          Đã uống: {m.taken} • Bỏ lỡ: {m.missed}
        </Text>
      </View>
      <View style={[styles.adherenceBadge, { backgroundColor: `${color}1A` }]}>
        <Text style={[styles.adherenceBadgeText, { color }]}>{Math.round(rate * 100)}%</Text>
      </View>
    </View>
  );
}

export function MetricCard({ report }: { report: MetricReportData }) {
  let trendColor: string;
  switch (report.trend) {
    case 'INCREASING':
      trendColor = Colors.warning;
      break;
    case 'DECREASING':
      trendColor = Colors.primary;
      break;
    case 'STABLE':
      trendColor = Colors.success;
      break;
    default:
      trendColor = Colors.textHint;
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
            const height = Math.min(56, Math.max(4, fraction * 56));
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
          label="TB"
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
    <View style={{ marginRight: 16 }}>
      <Text style={styles.metricStatLabel}>{label}</Text>
      <Text style={styles.metricStatValue}>{value}</Text>
    </View>
  );
}

export function AiSummaryCard({ summary }: { summary: string }) {
  return (
    <View style={styles.aiCard}>
      <View style={styles.aiIconWrap}>
        <Ionicons name="sparkles" size={20} color={Colors.secondary} />
      </View>
      <Text style={styles.aiText}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: { fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  sectionCardSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' },
  adherenceCard: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adherenceName: { fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  adherenceDetail: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  adherenceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  adherenceBadgeText: { fontWeight: '700', fontSize: 14 },
  metricCard: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  metricHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  metricTitle: { flex: 1, fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  metricTrendBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  metricTrendText: { fontSize: 11, fontWeight: '600' },
  barChart: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  barSlot: { flex: 1, marginHorizontal: 1, alignItems: 'stretch', justifyContent: 'flex-end' },
  bar: {
    backgroundColor: 'rgba(46, 125, 154, 0.6)',
    borderRadius: 3,
  },
  metricStatsRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  metricStatLabel: { color: Colors.textHint, fontSize: 10 },
  metricStatValue: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  aiCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 130, 0.3)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  aiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 130, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: {
    flex: 1,
    marginLeft: 14,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19.5,
  },
});
