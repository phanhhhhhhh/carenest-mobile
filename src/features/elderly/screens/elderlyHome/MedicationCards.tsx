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
              backgroundColor: medication.taken ? '#DCFCE7' : '#FEF3C7',
            },
          ]}
        >
          <Ionicons name="medkit" size={30} color={medication.taken ? '#15803D' : '#B45309'} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={styles.labelRow}>
            <View
              style={[
                styles.pillBadge,
                { backgroundColor: medication.taken ? '#DCFCE7' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[styles.pillBadgeText, { color: medication.taken ? '#15803D' : '#92400E' }]}
              >
                {medication.taken ? 'ĐÃ UỐNG XONG' : 'CẦN UỐNG TIẾP THEO'}
              </Text>
            </View>
            {!!timeLabel && (
              <View style={styles.timePill}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color="#0F172A"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.nextMedTime}>{timeLabel}</Text>
              </View>
            )}
          </View>
          <Text style={styles.nextMedName}>{medication.name}</Text>
          <Text style={styles.nextMedDosage}>
            Liều lượng: <Text style={styles.boldText}>{medication.dosage || 'Theo chỉ định'}</Text>
          </Text>
          {!!medication.instructions && (
            <View style={styles.instructionWrap}>
              <Text style={styles.nextMedInstructions}>💡 {medication.instructions}</Text>
            </View>
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
          size={24}
          color="#FFFFFF"
        />
        <Text style={styles.takeBtnFullText}>
          {medication.taken ? 'ĐÃ XÁC NHẬN UỐNG THUỐC' : 'BÁC ĐÃ UỐNG THUỐC NÀY'}
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
        style={[styles.medTileIcon, { backgroundColor: medication.taken ? '#DCFCE7' : '#E6F7F5' }]}
      >
        <Ionicons name="medkit" size={22} color={medication.taken ? '#16A34A' : Colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.medTileName, medication.taken && styles.medTileNameDone]}>
          {medication.name}
        </Text>
        <Text style={styles.medTileDosage}>{medication.dosage || '1 liều'}</Text>
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
            borderColor: medication.taken ? '#16A34A' : '#CBD5E1',
            backgroundColor: medication.taken ? '#16A34A' : 'transparent',
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
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    ...Shadows.md,
  },
  nextMedCardPending: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF5',
  },
  nextMedCardTaken: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  nextMedTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nextMedIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nextMedTime: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  nextMedName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  nextMedDosage: {
    fontSize: 14.5,
    color: '#475569',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  instructionWrap: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
  },
  nextMedInstructions: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  takeBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
  },
  takeBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  takeBtnTaken: {
    backgroundColor: '#16A34A',
    opacity: 0.9,
  },
  takeBtnFullText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  medTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  medTileDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  medTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  medTileNameDone: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  medTileDosage: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  medTileTimeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  medTileTimeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
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
