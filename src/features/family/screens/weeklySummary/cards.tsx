import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import { getWeekLabel, type WeeklySummaryData } from '../../store/weeklySummaryStore';

export function SummaryCard({
  summary,
  isLatest,
}: {
  summary: WeeklySummaryData;
  isLatest: boolean;
}) {
  return (
    <View style={[styles.card, isLatest && styles.cardLatest]}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconWrap, isLatest ? styles.iconWrapLatest : null]}>
          <Ionicons name="sparkles" color="#FFFFFF" size={20} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{summary.title}</Text>
          <Text style={styles.cardWeekLabel}>{getWeekLabel(summary)}</Text>
        </View>
        {isLatest && (
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>MỚI NHẤT</Text>
          </View>
        )}
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.statsRow}>
        <StatMini
          icon="medical"
          color={Colors.primary}
          value={`${summary.medicationAdherence}%`}
          label="Tuân thủ"
        />
        <StatMini
          icon="pulse"
          color={Colors.secondary}
          value={`${summary.totalMetrics}`}
          label="Chỉ số đo"
        />
        <StatMini
          icon="alert-circle"
          color={summary.abnormalMetrics > 0 ? Colors.error : Colors.success}
          value={`${summary.abnormalMetrics}`}
          label="Bất thường"
        />
      </View>

      <View style={{ height: 16 }} />
      <View style={styles.divider} />
      <View style={{ height: 12 }} />

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
    <View style={styles.statMiniCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} color={color} size={14} />
      </View>
      <View>
        <Text style={[styles.statMiniValue, { color }]}>{value}</Text>
        <Text style={styles.statMiniLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardLatest: {
    borderColor: '#C7D2FE',
    shadowColor: Colors.aiPrimary,
    shadowOpacity: 0.1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapLatest: {
    backgroundColor: Colors.aiPrimary,
  },
  cardTitle: { fontWeight: '800', fontSize: 16, color: Colors.textPrimary },
  cardWeekLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },
  latestBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  latestBadgeText: {
    color: Colors.successDark,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statMiniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMiniValue: { fontSize: 15, fontWeight: '800' },
  statMiniLabel: { color: Colors.textSecondary, fontSize: 10.5, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.divider },
  cardContent: { color: Colors.textPrimary, fontSize: 14, lineHeight: 22, fontWeight: '400' },
});
