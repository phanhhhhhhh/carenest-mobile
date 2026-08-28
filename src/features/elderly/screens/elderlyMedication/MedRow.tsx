import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../core/theme';
import type { MedicationItem } from '../../../../shared/types';
import { pad2 } from './utils';

export function MedRow({ item, onPress }: { item: MedicationItem; onPress: () => void }) {
  const timeLabel = item.nextDoseTime
    ? `${pad2(new Date(item.nextDoseTime).getHours())}:${pad2(new Date(item.nextDoseTime).getMinutes())}`
    : item.scheduleTimes.length > 0
      ? item.scheduleTimes[0]
      : '--:--';

  return (
    <TouchableOpacity style={styles.medRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.medRowTime}>{timeLabel}</Text>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.medRowName}>
          {item.name} {item.dosage}
        </Text>
        <View style={{ height: 4 }} />
        <View style={styles.medRowStatusRow}>
          <Ionicons
            name={item.taken ? 'checkmark' : 'alarm-outline'}
            size={14}
            color={item.taken ? Colors.success : Colors.warning}
          />
          <Text
            style={[
              styles.medRowStatusText,
              { color: item.taken ? Colors.success : Colors.warning },
            ]}
          >
            {item.taken ? ' Đã uống' : ' Sắp tới'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  medRowTime: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  medRowName: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Colors.textPrimary },
  medRowStatusRow: { flexDirection: 'row', alignItems: 'center' },
  medRowStatusText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600' },
});
