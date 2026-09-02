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
      <View style={[styles.timeBadge, { backgroundColor: item.taken ? '#DCFCE7' : '#E6F7F5' }]}>
        <Ionicons
          name="time-outline"
          size={14}
          color={item.taken ? '#15803D' : Colors.primary}
          style={{ marginBottom: 2 }}
        />
        <Text style={[styles.timeBadgeText, { color: item.taken ? '#15803D' : Colors.primary }]}>
          {timeLabel}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.medRowName, item.taken && styles.medRowNameTaken]}>{item.name}</Text>
        <Text style={styles.medRowDosage}>
          Liều:{' '}
          <Text style={{ fontWeight: '600', color: '#334155' }}>
            {item.dosage || 'Theo chỉ định'}
          </Text>
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: item.taken ? '#DCFCE7' : '#FEF3C7' }]}>
        <Ionicons
          name={item.taken ? 'checkmark-circle' : 'hourglass-outline'}
          size={16}
          color={item.taken ? '#15803D' : '#B45309'}
        />
        <Text style={[styles.statusPillText, { color: item.taken ? '#15803D' : '#92400E' }]}>
          {item.taken ? 'Đã uống' : 'Chưa uống'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={{ marginLeft: 6 }} />
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
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  medRowTaken: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  timeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  medRowName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  medRowNameTaken: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  medRowDosage: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
