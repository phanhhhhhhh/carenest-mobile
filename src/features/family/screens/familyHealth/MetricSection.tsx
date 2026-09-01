import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { HealthMetric } from '../../../../shared/types';
import { METRIC_DEFS, formatTime, type Status } from './metricConfig';

export function MetricSection({
  type,
  latest,
  all,
  status,
}: {
  type: string;
  latest: HealthMetric;
  all: HealthMetric[];
  status: Status;
}) {
  const def = METRIC_DEFS[type];
  const displayValue =
    type === 'BLOOD_PRESSURE' && latest.valueSecondary != null
      ? `${latest.value}/${latest.valueSecondary}`
      : latest.value;
  const unitLabel = latest.unit || def.unit;
  const timeLabel = formatTime(latest.recordedAt);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${def.color}15` }]}>
          <Ionicons name={def.icon} size={20} color={def.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{def.title}</Text>
          {timeLabel.length > 0 && <Text style={styles.timeText}>{timeLabel}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}>
          <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{displayValue}</Text>
        <Text style={styles.unitText}>{unitLabel}</Text>
      </View>

      <View style={{ height: 16 }} />

      <MiniChart metrics={all} color={def.color} />
    </View>
  );
}

function MiniChart({ metrics, color }: { metrics: HealthMetric[]; color: string }) {
  if (metrics.length < 2) {
    return (
      <View style={styles.chartEmpty}>
        <Ionicons name="bar-chart-outline" size={18} color={Colors.textHint} />
        <Text style={styles.chartEmptyText}>Cần thêm dữ liệu để hiển thị biểu đồ</Text>
      </View>
    );
  }

  const sorted = [...metrics].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const values = sorted.map((m) => Number.parseFloat(m.value) || 0);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = Math.max(maxVal - minVal, 1);

  return (
    <View style={styles.chart}>
      {values.map((v, i) => {
        const fraction = (v - minVal) / range;
        const height = Math.min(54, Math.max(8, 10 + fraction * 44));
        const isLatest = i === values.length - 1;
        return (
          <View key={i} style={styles.chartBarSlot}>
            <View
              style={[
                styles.chartBar,
                {
                  height,
                  backgroundColor: isLatest ? color : `${color}60`,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    marginBottom: 16,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  timeText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11.5, fontWeight: '800' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  valueText: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  unitText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  chartEmpty: {
    height: 54,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  chartEmptyText: { color: Colors.textSecondary, fontSize: 12.5, fontWeight: '500' },
  chart: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 8,
  },
  chartBarSlot: { flex: 1, marginHorizontal: 2, alignItems: 'stretch', justifyContent: 'flex-end' },
  chartBar: { borderRadius: 4 },
});
