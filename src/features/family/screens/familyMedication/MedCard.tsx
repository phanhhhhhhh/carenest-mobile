import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { MedicationItem } from '../../../../shared/types';
import { dayPatternLabel, formatIsoTime } from './constants';

export function MedCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MedicationItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const now = Date.now();
  const isMissed =
    !item.taken && !!item.nextDoseTime && new Date(item.nextDoseTime).getTime() < now;
  const statusLabel = item.taken ? 'Đã uống' : isMissed ? 'Bỏ lỡ' : 'Chưa uống';
  const statusColor = item.taken ? '#15803D' : isMissed ? '#DC2626' : '#D97706';
  const statusBg = item.taken ? '#DCFCE7' : isMissed ? '#FEE2E2' : '#FEF3C7';
  const firstTime =
    item.scheduleTimes[0] ?? (item.nextDoseTime ? formatIsoTime(item.nextDoseTime) : '');
  const subtitleParts = [firstTime, item.instructions, dayPatternLabel(item.daysOfWeek)].filter(
    Boolean,
  );

  return (
    <View style={styles.medCard}>
      <View style={styles.medIconBox}>
        <Ionicons name="medkit" size={24} color={Colors.primary} />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{item.name}</Text>
        <Text style={styles.medDosage}>Liều: {item.dosage || 'Theo chỉ định'}</Text>
        <Text style={styles.medSubRow}>{subtitleParts.join(' · ')}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Ionicons
            name={item.taken ? 'checkmark-circle' : isMissed ? 'close-circle' : 'time-outline'}
            size={13}
            color={statusColor}
          />
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.medCardActions}>
        <TouchableOpacity
          style={styles.iconBtnEdit}
          onPress={onEdit}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtnDelete}
          onPress={onDelete}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  medCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  medIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E6F7F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medInfo: { flex: 1, marginLeft: 14 },
  medName: { fontWeight: '800', fontSize: 16.5, color: '#0F172A' },
  medDosage: { color: '#475569', fontSize: 13.5, marginTop: 2, fontWeight: '600' },
  medSubRow: { color: '#64748B', fontSize: 12.5, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  medCardActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  iconBtnEdit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDelete: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
