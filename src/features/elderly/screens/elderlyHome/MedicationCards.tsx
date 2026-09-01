import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { MedicationItem } from '../../../../shared/types';
import { formatTimeFromIso } from './utils';

export function NextMedicationCard({
  medication,
  onToggleTaken,
}: {
  medication: MedicationItem;
  onToggleTaken: (id: string) => void;
}) {
  const timeLabel = medication.nextDoseTime
    ? formatTimeFromIso(medication.nextDoseTime)
    : medication.scheduleTimes.length > 0
      ? medication.scheduleTimes[0]
      : '';

  return (
    <View
      style={[
        styles.nextMedCard,
        medication.taken ? styles.nextMedCardTaken : styles.nextMedCardPending,
      ]}
    >
      <View style={styles.nextMedTopRow}>
        <View
          style={[
            styles.nextMedIcon,
            {
              backgroundColor: medication.taken ? Colors.successLight : Colors.warningLight,
            },
          ]}
        >
          <Ionicons
            name="medkit"
            size={28}
            color={medication.taken ? Colors.successDark : Colors.warningDark}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={styles.labelRow}>
            <View
              style={[
                styles.pillBadge,
                { backgroundColor: medication.taken ? Colors.successLight : Colors.warningLight },
              ]}
            >
              <Text
                style={[
                  styles.pillBadgeText,
                  { color: medication.taken ? Colors.successDark : Colors.warningDark },
                ]}
              >
                {medication.taken ? 'ĐÃ UỐNG' : 'SẮP TỚI'}
              </Text>
            </View>
            {!!timeLabel && <Text style={styles.nextMedTime}>{timeLabel}</Text>}
          </View>
          <Text style={styles.nextMedName}>{medication.name}</Text>
          <Text style={styles.nextMedDosage}>
            Liều lượng: {medication.dosage || 'Theo chỉ định'}
          </Text>
          {!!medication.instructions && (
            <Text style={styles.nextMedInstructions}>💡 {medication.instructions}</Text>
          )}
        </View>
      </View>

      <View style={{ height: 16 }} />

      <TouchableOpacity
        disabled={medication.taken}
        onPress={() => onToggleTaken(medication.id)}
        style={[styles.takeBtnFull, medication.taken ? styles.takeBtnTaken : styles.takeBtnActive]}
        activeOpacity={0.85}
      >
        <Ionicons
          name={medication.taken ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={22}
          color="#FFFFFF"
        />
        <Text style={styles.takeBtnFullText}>
          {medication.taken ? 'ĐÃ UỐNG THUỐC' : 'XÁC NHẬN ĐÃ UỐNG'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function MedicationTile({ medication }: { medication: MedicationItem }) {
  const timeLabel = formatTimeFromIso(medication.nextDoseTime);
  return (
    <View style={[styles.medTile, medication.taken && styles.medTileDone]}>
      <View
        style={[
          styles.medTileIcon,
          { backgroundColor: medication.taken ? Colors.successLight : Colors.primaryLighter },
        ]}
      >
        <Ionicons
          name="medkit"
          size={22}
          color={medication.taken ? Colors.success : Colors.primary}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.medTileName, medication.taken && styles.medTileNameDone]}>
          {medication.name}
        </Text>
        <Text style={styles.medTileDosage}>{medication.dosage}</Text>
      </View>
      {!!timeLabel && (
        <View style={styles.medTileTimeBadge}>
          <Text style={styles.medTileTimeText}>{timeLabel}</Text>
        </View>
      )}
      <View style={{ width: 10 }} />
      <View
        style={[
          styles.medTileCheck,
          {
            borderColor: medication.taken ? Colors.success : Colors.border,
            backgroundColor: medication.taken ? Colors.success : 'transparent',
          },
        ]}
      >
        {medication.taken && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nextMedCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    ...Shadows.md,
  },
  nextMedCardPending: {
    borderColor: '#FED7AA',
  },
  nextMedCardTaken: {
    borderColor: '#BBF7D0',
  },
  nextMedTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  nextMedIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextMedTime: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  nextMedName: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  nextMedDosage: {
    marginTop: 3,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  nextMedInstructions: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  takeBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
  },
  takeBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  takeBtnTaken: {
    backgroundColor: Colors.success,
  },
  takeBtnFullText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  medTile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  medTileDone: {
    opacity: 0.85,
    backgroundColor: '#F8FAFC',
  },
  medTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTileName: { fontWeight: '700', color: Colors.textPrimary, fontSize: 16 },
  medTileNameDone: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  medTileDosage: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  medTileTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
  },
  medTileTimeText: {
    color: Colors.primary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  medTileCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
