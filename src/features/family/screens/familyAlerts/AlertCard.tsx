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
  calling,
  onCallEmergencyServices,
}: {
  event: EmergencyEvent;
  acknowledging: boolean;
  onAcknowledge: (eventId: string) => void;
  calling?: boolean;
  onCallEmergencyServices?: (eventId: string) => void;
}) {
  const isActive = event.status === 'ACTIVE';
  const isCancelled = event.status === 'CANCELLED';
  const isLevel2 = isActive && (event.escalationLevel ?? 0) >= 2;
  const isLevel1 = isActive && (event.escalationLevel ?? 0) === 1;
  const color = isLevel2 ? '#DC2626' : isLevel1 ? '#EA580C' : eventColor(event.type);
  const icon = isLevel2 ? 'alert-circle' : isLevel1 ? 'warning' : eventIcon(event.type);
  const title = isLevel2
    ? 'Cảnh báo Đỏ (10+ phút)'
    : isLevel1
      ? 'Cảnh báo Cấp 1 (3+ phút)'
      : eventTitle(event.type);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isActive ? hexToRgba(color, 0.04) : '#FFFFFF' },
        isActive && { borderWidth: 1.5, borderColor: hexToRgba(color, 0.4) },
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
            <View style={[styles.activeDot, { backgroundColor: color }]} />
          ) : isCancelled ? (
            <Ionicons name="close-circle" color="#94A3B8" size={18} />
          ) : (
            <Ionicons name="checkmark-circle" color="#16A34A" size={18} />
          )}
        </View>
        <Text style={styles.cardDesc}>{event.description}</Text>

        {event.emergencyCallLoggedAt && (
          <View style={styles.emergencyCallRow}>
            <Ionicons name="call" size={13} color="#2563EB" />
            <Text style={styles.emergencyCallText}>
              Đã ghi nhận gọi cấp cứu 115 ({formatRelative(event.emergencyCallLoggedAt)})
            </Text>
          </View>
        )}

        <View style={styles.cardFooterRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={13} color="#94A3B8" />
            <Text style={styles.cardTime}>{formatRelative(event.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive
                  ? hexToRgba(color, 0.1)
                  : isCancelled
                    ? hexToRgba('#94A3B8', 0.1)
                    : hexToRgba('#16A34A', 0.08),
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isActive ? color : isCancelled ? '#94A3B8' : '#16A34A' },
              ]}
            >
              {isActive
                ? isLevel2
                  ? 'CẤP 2 (KHẨN CẤP)'
                  : isLevel1
                    ? 'CẤP 1 (CHƯA PHẢN HỒI)'
                    : 'ĐANG HOẠT ĐỘNG'
                : isCancelled
                  ? 'ĐÃ HỦY (AN TOÀN)'
                  : 'ĐÃ XỬ LÝ'}
            </Text>
          </View>
          {isActive && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              {isLevel2 && onCallEmergencyServices && (
                <TouchableOpacity
                  style={styles.call115Button}
                  disabled={calling}
                  onPress={() => onCallEmergencyServices(event.id)}
                  activeOpacity={0.8}
                >
                  {calling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="call" size={14} color="#FFFFFF" />
                      <Text style={styles.call115Text}>Gọi 115</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

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
            </View>
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
  emergencyCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginBottom: 2,
  },
  emergencyCallText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
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
  call115Button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  call115Text: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
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
