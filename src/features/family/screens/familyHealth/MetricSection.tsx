import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
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
        <View style={[styles.iconWrap, { backgroundColor: `${def.color}1A` }]}>
          <Ionicons name={def.icon} size={22} color={def.color} />
        </View>
        <Text style={styles.cardTitle}>{def.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}1A` }]}>
          <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{displayValue}</Text>
        <Text style={styles.unitText}>{unitLabel}</Text>
        {timeLabel.length > 0 && <Text style={styles.timeText}>{`• ${timeLabel}`}</Text>}
      </View>

      <View style={{ height: 14 }} />

      <MiniChart metrics={all} color={def.color} />
    </View>
  );
}

function MiniChart({ metrics, color }: { metrics: HealthMetric[]; color: string }) {
  if (metrics.length < 2) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>Cần thêm dữ liệu</Text>
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
        const height = Math.min(50, Math.max(4, 6 + fraction * 44));
        return (
          <View key={i} style={styles.chartBarSlot}>
            <View style={[styles.chartBar, { height, backgroundColor: color }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  valueText: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  unitText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 6, marginBottom: 4 },
  timeText: { fontSize: 12, color: Colors.textHint, marginLeft: 10, marginBottom: 4 },
  chartEmpty: {
    height: 50,
    backgroundColor: Colors.background,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: { color: Colors.textHint, fontSize: 12 },
  chart: { height: 50, flexDirection: 'row', alignItems: 'flex-end' },
  chartBarSlot: { flex: 1, marginHorizontal: 1, alignItems: 'stretch', justifyContent: 'flex-end' },
  chartBar: { borderRadius: 3 },
});
