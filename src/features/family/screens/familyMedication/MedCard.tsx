import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
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
  const statusColor = item.taken ? Colors.success : isMissed ? Colors.error : Colors.warning;
  const firstTime =
    item.scheduleTimes[0] ?? (item.nextDoseTime ? formatIsoTime(item.nextDoseTime) : '');
  const subtitleParts = [firstTime, item.instructions, dayPatternLabel(item.daysOfWeek)].filter(
    Boolean,
  );

  return (
    <View style={styles.medCard}>
      <View style={styles.medIconBoxDashed}>
        <Ionicons name="medkit-outline" size={22} color={Colors.error} />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>
          {item.name} {item.dosage}
        </Text>
        <Text style={styles.medSubRow}>{subtitleParts.join(' · ')}</Text>
        <View style={styles.medStatusRow}>
          <Text style={[styles.medStatusMark, { color: statusColor }]}>
            {item.taken ? '✓' : '✗'}
          </Text>
          <Text style={[styles.medStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.medCardActions}>
        <TouchableOpacity style={styles.iconBtnEdit} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtnDelete} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  medCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.2)',
  },
  medIconBoxDashed: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(173,181,189,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medInfo: { flex: 1, marginLeft: 14 },
  medName: { fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  medSubRow: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  medStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  medStatusMark: { fontSize: 13, fontWeight: '700' },
  medStatusText: { fontSize: 12, fontWeight: '600' },
  medCardActions: { justifyContent: 'flex-start', gap: 6 },
  iconBtnEdit: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(46,125,154,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDelete: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(229,57,53,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
