import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { AppointmentItem } from '../../../../shared/types';
import { MONTHS } from './utils';

export function MedProgressRing({ taken, total }: { taken: number; total: number }) {
  const size = 68;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? taken / total : 0;
  const dashOffset = circumference * (1 - progress);
  const ringColor = progress >= 1 ? Colors.success : Colors.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.ringText}>
        {taken}/{total}
      </Text>
      <Text style={styles.ringSubtext}>uống</Text>
    </View>
  );
}

export function VitalMiniCard({
  label,
  value,
  isWarning,
  onPress,
  icon,
  tintColor,
}: {
  label: string;
  value: string;
  isWarning: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  tintColor?: string;
}) {
  const statusColor = isWarning ? Colors.error : Colors.success;
  const statusBg = isWarning ? Colors.sosLight : Colors.successLight;
  const color = tintColor || Colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.vitalCard,
        isWarning && { borderColor: '#FECDD3', backgroundColor: '#FFF1F2' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.vitalTopRow}>
        <View
          style={[
            styles.vitalIconWrap,
            { backgroundColor: isWarning ? Colors.sosLight : `${color}15` },
          ]}
        >
          <Ionicons name={icon || 'heart'} size={14} color={isWarning ? Colors.error : color} />
        </View>
        <View style={[styles.vitalBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.vitalBadgeText, { color: statusColor }]}>
            {isWarning ? 'Cảnh báo' : 'Bình thường'}
          </Text>
        </View>
      </View>
      <View style={{ height: 8 }} />
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalValue} numberOfLines={1}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

export function CameraActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.cameraActionButton} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={15} color={Colors.primary} />
      <Text style={styles.cameraActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AppointmentPreviewCard({
  apt,
  onPress,
}: {
  apt: AppointmentItem;
  onPress: () => void;
}) {
  const date = new Date(apt.appointmentDate);
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const day = date.getDate();
  const monthStr = MONTHS[date.getMonth()];
  return (
    <TouchableOpacity style={styles.aptCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.aptDateBox}>
        <Text style={styles.aptDay}>{day}</Text>
        <Text style={styles.aptMonth}>{monthStr}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.aptDoctor}>{apt.doctor}</Text>
        <Text style={styles.aptDetail}>
          {apt.specialty} • {timeStr}
        </Text>
      </View>
      <Ionicons name="chevron-forward" color={Colors.textHint} size={18} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ringText: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  ringSubtext: { fontSize: 10, color: Colors.textSecondary, marginTop: -2 },
  vitalCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  vitalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vitalBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  vitalLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  vitalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },

  cameraActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primaryLighter,
  },
  cameraActionLabel: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  aptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  aptDateBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aptDay: { fontWeight: '800', fontSize: 17, color: Colors.primary },
  aptMonth: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  aptDoctor: {
    fontWeight: '700',
    fontSize: 14.5,
    color: Colors.textPrimary,
  },
  aptDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
