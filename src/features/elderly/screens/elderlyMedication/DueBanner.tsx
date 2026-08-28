import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../core/theme';
import type { MedicationItem } from '../../../../shared/types';

export function DueBanner({
  med,
  phase,
  minutesUntilDue,
  dueTimeLabel,
  onTakeNow,
  onSnooze,
}: {
  med: MedicationItem;
  phase: 'upcoming' | 'due';
  minutesUntilDue: number | null;
  dueTimeLabel: string;
  onTakeNow: (med: MedicationItem) => void;
  onSnooze: (med: MedicationItem) => void;
}) {
  const isUpcoming = phase === 'upcoming';
  const accent = isUpcoming ? Colors.primary : Colors.warning;

  return (
    <View style={[styles.dueBanner, isUpcoming && styles.upcomingBanner]}>
      <View style={styles.dueHeaderRow}>
        <Ionicons name={isUpcoming ? 'time-outline' : 'alarm'} size={18} color={accent} />
        <Text style={[styles.dueHeaderText, isUpcoming && styles.upcomingHeaderText]}>
          {isUpcoming ? 'SẮP ĐẾN GIỜ UỐNG THUỐC' : 'ĐẾN GIỜ UỐNG THUỐC'}
        </Text>
      </View>
      <View style={{ height: 14 }} />
      <View style={styles.dueRow}>
        <View style={[styles.dueIconWrap, isUpcoming && styles.upcomingIconWrap]}>
          <Ionicons name="medkit" size={26} color={accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.dueMedName}>
            {med.name} {med.dosage}
          </Text>
          {!!med.instructions && <Text style={styles.dueInstructions}>{med.instructions}</Text>}
          <Text style={styles.dueTimeLabel}>
            {isUpcoming
              ? `Còn khoảng ${minutesUntilDue} phút nữa${dueTimeLabel ? ` · ${dueTimeLabel}` : ''}`
              : dueTimeLabel}
          </Text>
        </View>
      </View>
      <View style={{ height: 16 }} />
      <TouchableOpacity
        style={[styles.dueTakeBtn, isUpcoming && styles.upcomingTakeBtn]}
        onPress={() => onTakeNow(med)}
      >
        <Text style={styles.dueTakeBtnText}>✓ ĐÃ UỐNG</Text>
      </TouchableOpacity>
      {phase === 'due' && (
        <>
          <View style={{ height: 10 }} />
          <TouchableOpacity style={styles.dueSnoozeBtn} onPress={() => onSnooze(med)}>
            <Text style={styles.dueSnoozeBtnText}>Hoãn 10 phút</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dueBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
  },
  dueHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueHeaderText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.5 },
  upcomingHeaderText: { color: Colors.primary },
  dueRow: { flexDirection: 'row', alignItems: 'center' },
  dueIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 167, 38, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingBanner: { borderColor: Colors.primary },
  upcomingIconWrap: { borderColor: 'rgba(46, 125, 154, 0.4)' },
  upcomingTakeBtn: { backgroundColor: Colors.primary },
  dueMedName: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dueInstructions: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dueTimeLabel: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  dueTakeBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
  },
  dueTakeBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dueSnoozeBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dueSnoozeBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.button.fontSize,
    fontWeight: '600',
  },
});
