import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { AppointmentItem } from '../../../../shared/types';
import { formatDate, formatTime, statusColor, statusLabel, withAlpha } from './utils';

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} color={Colors.primary} size={16} />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionChip,
        { backgroundColor: withAlpha(color, 0.08), borderColor: withAlpha(color, 0.25) },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.actionChipText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AppointmentCard({
  item,
  showActions,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
}: {
  item: AppointmentItem;
  showActions: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const color = statusColor(item.status);
  const label = statusLabel(item.status);
  const dt = new Date(item.appointmentDate);

  return (
    <View style={[styles.card, { borderColor: withAlpha(color, 0.3) }]}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.12) }]}>
          <Ionicons name="calendar" color={color} size={24} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.doctorName}>{item.doctor}</Text>
          {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: withAlpha(color, 0.12) }]}>
          <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={{ height: 12 }} />
      <View style={styles.infoBox}>
        <InfoRow icon="calendar-outline" text={formatDate(dt)} />
        <View style={{ height: 6 }} />
        <InfoRow icon="time-outline" text={formatTime(dt)} />
        {!!item.location && (
          <>
            <View style={{ height: 6 }} />
            <InfoRow icon="location-outline" text={item.location} />
          </>
        )}
      </View>

      {!!item.notes && (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Lưu ý:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      {showActions && (
        <>
          <View style={{ height: 12 }} />
          <View style={styles.divider} />
          <View style={{ height: 10 }} />
          <View style={styles.actionsRow}>
            <ActionChip
              icon="checkmark-circle-outline"
              label="Đã khám"
              color="#059669"
              onPress={onComplete}
            />
            <ActionChip icon="create-outline" label="Sửa" color={Colors.primary} onPress={onEdit} />
            <ActionChip
              icon="close-circle-outline"
              label="Hủy lịch"
              color="#D97706"
              onPress={onCancel}
            />
            <ActionChip icon="trash-outline" label="Xóa" color="#EF4444" onPress={onDelete} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: { flex: 1, marginLeft: 14 },
  doctorName: { fontWeight: '800', fontSize: 17, color: '#0F172A' },
  specialty: { color: '#64748B', fontSize: 13.5, marginTop: 2, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusBadgeText: { fontSize: 12.5, fontWeight: '700' },
  infoBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoRowText: { color: '#334155', fontSize: 14, marginLeft: 8, fontWeight: '600' },
  notesBox: {
    width: '100%',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginTop: 10,
  },
  notesLabel: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 2 },
  notesText: { color: '#78350F', fontSize: 13, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionChipText: { fontSize: 12, fontWeight: '700' },
});
