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
  const accent = isUpcoming ? '#0284C7' : '#D97706';
  const bgAccent = isUpcoming ? '#E0F2FE' : '#FEF3C7';

  return (
    <View style={[styles.dueBanner, isUpcoming ? styles.upcomingBanner : styles.dueNowBanner]}>
      <View style={styles.dueHeaderRow}>
        <View style={[styles.phaseBadge, { backgroundColor: bgAccent }]}>
          <Ionicons name={isUpcoming ? 'time' : 'alarm'} size={16} color={accent} />
          <Text style={[styles.dueHeaderText, { color: accent }]}>
            {isUpcoming ? 'SẮP ĐẾN GIỜ UỐNG THUỐC' : 'ĐÃ ĐẾN GIỜ UỐNG THUỐC'}
          </Text>
        </View>
        <Text style={styles.dueTimeLabel}>
          {isUpcoming ? `Còn khoảng ${minutesUntilDue} phút` : dueTimeLabel}
        </Text>
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.dueRow}>
        <View style={[styles.dueIconWrap, { backgroundColor: bgAccent }]}>
          <Ionicons name="medkit" size={32} color={accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.dueMedName}>{med.name}</Text>
          <Text style={styles.dueDosage}>
            Liều lượng: <Text style={styles.boldText}>{med.dosage || '1 liều'}</Text>
          </Text>
          {!!med.instructions && (
            <View style={styles.instructionWrap}>
              <Text style={styles.dueInstructions}>💡 {med.instructions}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 18 }} />

      <TouchableOpacity
        style={styles.dueTakeBtn}
        onPress={() => onTakeNow(med)}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
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
            <Ionicons name="timer-outline" size={20} color="#64748B" />
            <Text style={styles.dueSnoozeBtnText}>Nhắc lại cho Bác sau 10 phút</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dueBanner: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    ...Shadows.md,
  },
  upcomingBanner: {
    borderColor: '#7DD3FC',
    backgroundColor: '#F0F9FF',
  },
  dueNowBanner: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  dueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dueHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dueTimeLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  dueRow: { flexDirection: 'row', alignItems: 'center' },
  dueIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueMedName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  dueDosage: {
    fontSize: 14.5,
    color: '#475569',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  instructionWrap: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
  },
  dueInstructions: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  dueTakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 18,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dueTakeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dueSnoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  dueSnoozeBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#475569',
  },
});
