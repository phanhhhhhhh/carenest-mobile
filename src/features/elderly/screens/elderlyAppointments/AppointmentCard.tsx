import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { AppointmentItem } from '../../../../shared/types';
import { STATUS_COLORS, STATUS_LABELS, formatDate, formatTime, withAlpha } from './utils';

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} color={Colors.textHint} size={15} />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

export function AppointmentCard({ item }: { item: AppointmentItem }) {
  const color = STATUS_COLORS[item.status] ?? Colors.textHint;
  const label = STATUS_LABELS[item.status] ?? item.status;

  return (
    <View style={[styles.card, { borderColor: withAlpha(color, 0.2) }]}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.1) }]}>
          <Ionicons name="calendar-outline" color={color} size={22} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.doctorName}>{item.doctor}</Text>
          {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: withAlpha(color, 0.1) }]}>
          <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={{ height: 14 }} />
      <InfoRow icon="calendar-outline" text={formatDate(item.appointmentDate)} />
      <View style={{ height: 6 }} />
      <InfoRow icon="time-outline" text={formatTime(item.appointmentDate)} />
      {!!item.location && (
        <>
          <View style={{ height: 6 }} />
          <InfoRow icon="location-outline" text={item.location} />
        </>
      )}
      {!!item.notes && (
        <>
          <View style={{ height: 10 }} />
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  doctorName: { fontWeight: '700', fontSize: 16, color: Colors.textPrimary },
  specialty: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoRowText: { color: Colors.textSecondary, fontSize: 13, marginLeft: 8 },
  notesBox: { width: '100%', padding: 10, backgroundColor: Colors.background, borderRadius: 10 },
  notesText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
});
