import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../core/theme';
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
        { borderColor: medication.taken ? 'rgba(67, 160, 71, 0.3)' : 'rgba(255, 167, 38, 0.4)' },
      ]}
    >
      <View style={styles.nextMedTopRow}>
        <View
          style={[
            styles.nextMedIcon,
            {
              backgroundColor: medication.taken
                ? 'rgba(67, 160, 71, 0.1)'
                : 'rgba(255, 167, 38, 0.1)',
            },
          ]}
        >
          <Ionicons
            name="medkit"
            size={26}
            color={medication.taken ? Colors.success : Colors.warning}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.nextMedLabel}>
            {timeLabel ? `Thuốc tiếp theo · ${timeLabel}` : 'Thuốc tiếp theo'}
          </Text>
          <Text style={styles.nextMedName}>
            {medication.name} {medication.dosage}
          </Text>
          {!!medication.instructions && (
            <Text style={styles.nextMedInstructions}>{medication.instructions}</Text>
          )}
        </View>
      </View>
      <View style={{ height: 14 }} />
      <TouchableOpacity
        disabled={medication.taken}
        onPress={() => onToggleTaken(medication.id)}
        style={[
          styles.takeBtnFull,
          { backgroundColor: medication.taken ? Colors.textHint : Colors.textPrimary },
        ]}
      >
        <Text style={styles.takeBtnFullText}>{medication.taken ? 'Đã uống ✓' : '✓ ĐÃ UỐNG'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function MedicationTile({ medication }: { medication: MedicationItem }) {
  const timeLabel = formatTimeFromIso(medication.nextDoseTime);
  return (
    <View style={styles.medTile}>
      <View style={styles.medTileIcon}>
        <Ionicons name="medkit" size={24} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.medTileName}>{medication.name}</Text>
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
            borderColor: medication.taken ? Colors.success : 'rgba(173, 181, 189, 0.5)',
            backgroundColor: medication.taken ? 'rgba(67, 160, 71, 0.1)' : 'transparent',
          },
        ]}
      >
        {medication.taken && <Ionicons name="checkmark" size={14} color={Colors.success} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nextMedCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
  },
  nextMedTopRow: { flexDirection: 'row', alignItems: 'center' },
  nextMedIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextMedLabel: { fontSize: 12, color: Colors.textSecondary },
  nextMedName: {
    marginTop: 2,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  nextMedInstructions: {
    marginTop: 2,
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  takeBtnFull: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  takeBtnFullText: {
    color: '#FFFFFF',
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  medTile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.2)',
  },
  medTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTileName: { fontWeight: '600', color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  medTileDosage: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall.fontSize,
  },
  medTileTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
  },
  medTileTimeText: {
    color: Colors.primary,
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
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
