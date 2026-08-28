import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { getWeekLabel, type WeeklySummaryData } from '../../store/weeklySummaryStore';

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export function SummaryCard({
  summary,
  isLatest,
}: {
  summary: WeeklySummaryData;
  isLatest: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        isLatest && { borderWidth: 1, borderColor: withAlpha(Colors.primary, 0.3) },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="sparkles" color="#FFFFFF" size={20} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{summary.title}</Text>
          <View style={{ height: 2 }} />
          <Text style={styles.cardWeekLabel}>{getWeekLabel(summary)}</Text>
        </View>
        {isLatest && (
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>Mới nhất</Text>
          </View>
        )}
      </View>

      <View style={{ height: 14 }} />

      <View style={styles.statsRow}>
        <StatMini
          icon="medical"
          color={Colors.primary}
          value={`${summary.medicationAdherence}%`}
          label="Tuân thủ"
        />
        <View style={{ width: 16 }} />
        <StatMini
          icon="pulse"
          color={Colors.secondary}
          value={`${summary.totalMetrics}`}
          label="Chỉ số"
        />
        <View style={{ width: 16 }} />
        <StatMini
          icon="warning"
          color={summary.abnormalMetrics > 0 ? Colors.error : Colors.success}
          value={`${summary.abnormalMetrics}`}
          label="Bất thường"
        />
      </View>

      <View style={{ height: 14 }} />
      <View style={styles.divider} />
      <View style={{ height: 10 }} />

      <Text style={styles.cardContent}>{summary.content}</Text>
    </View>
  );
}

function StatMini({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statMiniRow}>
      <Ionicons name={icon} color={color} size={16} />
      <Text style={[styles.statMiniValue, { color }]}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  cardWeekLabel: { color: Colors.textSecondary, fontSize: 12 },
  latestBadge: {
    backgroundColor: withAlpha(Colors.success, 0.1),
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  latestBadgeText: { color: Colors.success, fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row' },
  statMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statMiniValue: { fontSize: 15, fontWeight: '700' },
  statMiniLabel: { color: Colors.textHint, fontSize: 11 },
  divider: { height: 1, backgroundColor: Colors.divider },
  cardContent: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
