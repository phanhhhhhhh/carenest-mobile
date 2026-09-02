import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadows } from '../../../../core/theme/spacing';
import type { HealthMetric } from '../../../../shared/types';
import { type MetricConfig, type Status, statusColor, statusLabel } from './metricConfig';

export function MetricSection({
  config,
  data,
  status,
  timeLabel,
  metrics,
}: {
  config: MetricConfig;
  data?: HealthMetric;
  status: Status;
  timeLabel: string;
  metrics: HealthMetric[];
}) {
  const displayValue = data
    ? data.type === 'BLOOD_PRESSURE' && data.valueSecondary
      ? `${data.value}/${data.valueSecondary}`
      : data.value
    : '--';

  const sorted = useMemo(
    () =>
      [...metrics].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    [metrics],
  );
  const values = sorted.map((m) => Number.parseFloat(m.value) || 0);
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const range = Math.max(maxVal - minVal, 1);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeaderRow}>
        <View style={[styles.metricIconWrap, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <Text style={styles.metricTitle}>{config.label}</Text>
        {status !== 'none' && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${statusColor(status)}1F`,
                borderColor: `${statusColor(status)}66`,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor(status) }]}>
              {statusLabel(status)}
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{displayValue}</Text>
        <Text style={styles.metricUnit}> {config.unit}</Text>
        {!!timeLabel && <Text style={styles.metricTime}> • {timeLabel}</Text>}
      </View>

      <View style={{ height: 14 }} />

      {values.length < 2 ? (
        <View style={styles.miniChartEmpty}>
          <Text style={styles.miniChartEmptyText}>Cần thêm lượt đo để vẽ xu hướng</Text>
        </View>
      ) : (
        <View style={styles.miniChart}>
          {values.map((v, i) => {
            const fraction = range > 0 ? (v - minVal) / range : 0;
            const height = Math.min(50, Math.max(6, fraction * 44 + 6));
            return (
              <View key={i} style={styles.miniBarSlot}>
                <View style={[styles.miniBar, { height, backgroundColor: config.color }]} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  metricHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    flex: 1,
    marginLeft: 14,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1.2 },
  statusText: { fontSize: 12.5, fontWeight: '700' },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  metricValue: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  metricUnit: { fontSize: 15, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  metricTime: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
  miniChartEmpty: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChartEmptyText: { color: '#94A3B8', fontSize: 12.5, fontWeight: '500' },
  miniChart: { height: 46, flexDirection: 'row', alignItems: 'flex-end' },
  miniBarSlot: { flex: 1, marginHorizontal: 2, justifyContent: 'flex-end' },
  miniBar: { borderRadius: 4 },
});
