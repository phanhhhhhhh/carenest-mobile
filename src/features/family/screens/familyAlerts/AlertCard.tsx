import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { EmergencyEvent } from '../../../../shared/types';
import { eventColor, eventIcon, eventTitle, formatRelative, hexToRgba } from './utils';

export function AlertCard({
  event,
  acknowledging,
  onAcknowledge,
}: {
  event: EmergencyEvent;
  acknowledging: boolean;
  onAcknowledge: (eventId: string) => void;
}) {
  const isActive = event.status === 'ACTIVE';
  const color = eventColor(event.type);
  const icon = eventIcon(event.type);
  const title = eventTitle(event.type);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isActive ? hexToRgba(color, 0.04) : Colors.surface },
        isActive && { borderWidth: 1, borderColor: hexToRgba(color, 0.3) },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: hexToRgba(color, 0.1) }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text
            style={[
              styles.cardTitle,
              { color: isActive ? Colors.textPrimary : Colors.textSecondary },
            ]}
          >
            {title}
          </Text>
          {isActive ? (
            <View style={styles.activeDot} />
          ) : (
            <Ionicons name="checkmark-circle" color={Colors.success} size={18} />
          )}
        </View>
        <Text style={styles.cardDesc}>{event.description}</Text>
        <View style={styles.cardFooterRow}>
          <Ionicons name="time-outline" size={12} color={Colors.textHint} />
          <Text style={styles.cardTime}>{formatRelative(event.createdAt)}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive
                  ? hexToRgba(Colors.error, 0.08)
                  : hexToRgba(Colors.success, 0.08),
              },
            ]}
          >
            <Text
              style={[styles.statusBadgeText, { color: isActive ? Colors.error : Colors.success }]}
            >
              {isActive ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ XỬ LÝ'}
            </Text>
          </View>
          {isActive && (
            <TouchableOpacity
              style={styles.ackButton}
              disabled={acknowledging}
              onPress={() => onAcknowledge(event.id)}
            >
              {acknowledging ? (
                <ActivityIndicator size="small" color={Colors.success} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
                  <Text style={styles.ackText}>Xác nhận đã biết</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '600', fontSize: 15, flexShrink: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  cardDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  cardTime: { color: Colors.textHint, fontSize: 12, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 8,
  },
  ackText: { color: Colors.success, fontSize: 12, fontWeight: '500' },
});
