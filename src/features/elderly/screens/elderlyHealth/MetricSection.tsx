import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
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
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <Text style={styles.metricTitle}>{config.label}</Text>
        {status !== 'none' && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${statusColor(status)}1A`,
                borderColor: `${statusColor(status)}4D`,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor(status) }]}>
              {statusLabel(status)}
            </Text>
          </View>
        )}
        <View style={{ width: 8 }} />
        <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
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
          <Text style={styles.miniChartEmptyText}>Cần thêm dữ liệu để hiển thị biểu đồ</Text>
        </View>
      ) : (
        <View style={styles.miniChart}>
          {values.map((v, i) => {
            const fraction = range > 0 ? (v - minVal) / range : 0;
            const height = Math.min(50, Math.max(4, fraction * 46 + 4));
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
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  metricHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '600' },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  metricValue: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  metricUnit: { fontSize: 14, color: Colors.textSecondary },
  metricTime: { fontSize: 12, color: Colors.textHint },
  miniChartEmpty: {
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChartEmptyText: { color: Colors.textHint, fontSize: 12 },
  miniChart: { height: 50, flexDirection: 'row', alignItems: 'flex-end' },
  miniBarSlot: { flex: 1, marginHorizontal: 1, justifyContent: 'flex-end' },
  miniBar: { borderRadius: 3 },
});
