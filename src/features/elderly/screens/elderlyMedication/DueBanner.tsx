import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
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
  const accent = isUpcoming ? Colors.primary : Colors.warningDark;
  const bgAccent = isUpcoming ? Colors.primaryLighter : Colors.warningLight;

  return (
    <View style={[styles.dueBanner, isUpcoming ? styles.upcomingBanner : styles.dueNowBanner]}>
      <View style={styles.dueHeaderRow}>
        <View style={[styles.phaseBadge, { backgroundColor: bgAccent }]}>
          <Ionicons name={isUpcoming ? 'time' : 'alarm'} size={15} color={accent} />
          <Text style={[styles.dueHeaderText, { color: accent }]}>
            {isUpcoming ? 'SẮP ĐẾN GIỜ UỐNG THUỐC' : 'ĐẾN GIỜ UỐNG THUỐC'}
          </Text>
        </View>
        <Text style={styles.dueTimeLabel}>
          {isUpcoming ? `Còn ~${minutesUntilDue} phút` : dueTimeLabel}
        </Text>
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.dueRow}>
        <View style={[styles.dueIconWrap, { backgroundColor: bgAccent }]}>
          <Ionicons name="medkit" size={28} color={accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.dueMedName}>{med.name}</Text>
          <Text style={styles.dueDosage}>Liều: {med.dosage || '1 liều'}</Text>
          {!!med.instructions && <Text style={styles.dueInstructions}>💡 {med.instructions}</Text>}
        </View>
      </View>

      <View style={{ height: 18 }} />

      <TouchableOpacity
        style={styles.dueTakeBtn}
        onPress={() => onTakeNow(med)}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
        <Text style={styles.dueTakeBtnText}>XÁC NHẬN ĐÃ UỐNG</Text>
      </TouchableOpacity>

      {phase === 'due' && (
        <>
          <View style={{ height: 10 }} />
          <TouchableOpacity
            style={styles.dueSnoozeBtn}
            onPress={() => onSnooze(med)}
            activeOpacity={0.8}
          >
            <Ionicons name="timer-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.dueSnoozeBtnText}>Nhắc lại sau 10 phút</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dueBanner: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    ...Shadows.md,
  },
  upcomingBanner: {
    borderColor: '#BAE6FD',
  },
  dueNowBanner: {
    borderColor: '#FED7AA',
  },
  dueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueHeaderText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dueTimeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dueRow: { flexDirection: 'row', alignItems: 'center' },
  dueIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueMedName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dueDosage: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  dueInstructions: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  dueTakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dueTakeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dueSnoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  dueSnoozeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
