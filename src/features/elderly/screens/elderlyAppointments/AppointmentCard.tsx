import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { AppointmentItem } from '../../../../shared/types';
import { STATUS_COLORS, STATUS_LABELS, formatDate, formatTime, withAlpha } from './utils';

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} color={Colors.primary} size={16} />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

export function AppointmentCard({ item }: { item: AppointmentItem }) {
  const color = STATUS_COLORS[item.status] ?? '#64748B';
  const label = STATUS_LABELS[item.status] ?? item.status;

  return (
    <View style={[styles.card, { borderColor: withAlpha(color, 0.25) }]}>
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

      <View style={{ height: 14 }} />
      <View style={styles.timeInfoBox}>
        <InfoRow icon="calendar-outline" text={formatDate(item.appointmentDate)} />
        <View style={{ height: 6 }} />
        <InfoRow icon="time-outline" text={formatTime(item.appointmentDate)} />
        {!!item.location && (
          <>
            <View style={{ height: 6 }} />
            <InfoRow icon="location-outline" text={item.location} />
          </>
        )}
      </View>

      {!!item.notes && (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Lưu ý từ bác sĩ:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
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
  timeInfoBox: {
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
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  notesText: { color: '#78350F', fontSize: 13, lineHeight: 18 },
});
