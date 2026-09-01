import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { MedicationItem } from '../../../../shared/types';
import { pad2 } from './utils';

export function MedRow({ item, onPress }: { item: MedicationItem; onPress: () => void }) {
  const timeLabel = item.nextDoseTime
    ? `${pad2(new Date(item.nextDoseTime).getHours())}:${pad2(new Date(item.nextDoseTime).getMinutes())}`
    : item.scheduleTimes.length > 0
      ? item.scheduleTimes[0]
      : '--:--';

  return (
    <TouchableOpacity
      style={[styles.medRow, item.taken && styles.medRowTaken]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.timeBadge,
          { backgroundColor: item.taken ? Colors.successLight : Colors.primaryLighter },
        ]}
      >
        <Text
          style={[
            styles.timeBadgeText,
            { color: item.taken ? Colors.successDark : Colors.primary },
          ]}
        >
          {timeLabel}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.medRowName, item.taken && styles.medRowNameTaken]}>{item.name}</Text>
        <Text style={styles.medRowDosage}>{item.dosage || 'Theo chỉ định'}</Text>
      </View>
      <View
        style={[
          styles.statusPill,
          { backgroundColor: item.taken ? Colors.successLight : Colors.warningLight },
        ]}
      >
        <Ionicons
          name={item.taken ? 'checkmark' : 'time-outline'}
          size={14}
          color={item.taken ? Colors.successDark : Colors.warningDark}
        />
        <Text
          style={[
            styles.statusPillText,
            { color: item.taken ? Colors.successDark : Colors.warningDark },
          ]}
        >
          {item.taken ? 'Đã uống' : 'Sắp tới'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  medRowTaken: {
    opacity: 0.85,
    backgroundColor: '#F8FAFC',
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  timeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  medRowName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  medRowNameTaken: {
    color: Colors.textSecondary,
  },
  medRowDosage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
