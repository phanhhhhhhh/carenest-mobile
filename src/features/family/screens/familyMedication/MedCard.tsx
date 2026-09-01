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
  const statusLabel = item.taken ? 'Đã uống' : isMissed ? 'Bỏ lỡ' : 'Sắp tới';
  const statusColor = item.taken
    ? Colors.successDark
    : isMissed
      ? Colors.error
      : Colors.warningDark;
  const statusBg = item.taken
    ? Colors.successLight
    : isMissed
      ? Colors.sosLight
      : Colors.warningLight;
  const firstTime =
    item.scheduleTimes[0] ?? (item.nextDoseTime ? formatIsoTime(item.nextDoseTime) : '');
  const subtitleParts = [firstTime, item.instructions, dayPatternLabel(item.daysOfWeek)].filter(
    Boolean,
  );

  return (
    <View style={styles.medCard}>
      <View style={styles.medIconBox}>
        <Ionicons name="medkit" size={22} color={Colors.primary} />
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
        <TouchableOpacity style={styles.iconBtnEdit} onPress={onEdit} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={17} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtnDelete} onPress={onDelete} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={17} color={Colors.error} />
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
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  medIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medInfo: { flex: 1, marginLeft: 14 },
  medName: { fontWeight: '800', fontSize: 16, color: Colors.textPrimary },
  medDosage: { color: Colors.textSecondary, fontSize: 13, marginTop: 2, fontWeight: '500' },
  medSubRow: { color: Colors.textHint, fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 11.5, fontWeight: '700' },
  medCardActions: { justifyContent: 'flex-start', gap: 6, marginLeft: 8 },
  iconBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
