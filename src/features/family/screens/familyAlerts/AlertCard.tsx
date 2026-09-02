import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadows } from '../../../../core/theme/spacing';
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
        { backgroundColor: isActive ? '#FFF1F2' : '#FFFFFF' },
        isActive && { borderWidth: 1.5, borderColor: '#FECDD3' },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: hexToRgba(color, 0.12) }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: isActive ? '#0F172A' : '#475569' }]}>
            {title}
          </Text>
          {isActive ? (
            <View style={styles.activeDot} />
          ) : (
            <Ionicons name="checkmark-circle" color="#16A34A" size={18} />
          )}
        </View>
        <Text style={styles.cardDesc}>{event.description}</Text>
        <View style={styles.cardFooterRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={13} color="#94A3B8" />
            <Text style={styles.cardTime}>{formatRelative(event.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive ? '#FEE2E2' : '#DCFCE7',
              },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: isActive ? '#DC2626' : '#15803D' }]}>
              {isActive ? 'ĐANG CHỜ XỬ LÝ' : 'ĐÃ XỬ LÝ'}
            </Text>
          </View>
          {isActive && (
            <TouchableOpacity
              style={styles.ackButton}
              disabled={acknowledging}
              onPress={() => onAcknowledge(event.id)}
              activeOpacity={0.8}
            >
              {acknowledging ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                  <Text style={styles.ackText}>Xác nhận</Text>
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
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  cardDesc: { fontSize: 13.5, color: '#475569', marginTop: 4, lineHeight: 19 },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  cardTime: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ackText: { fontSize: 12, fontWeight: '700', color: '#059669' },
});
