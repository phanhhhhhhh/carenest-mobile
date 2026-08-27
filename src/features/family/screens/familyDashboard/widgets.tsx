import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../core/theme';
import type { AppointmentItem } from '../../../../shared/types';
import { MONTHS, hexToRgba } from './utils';

export function MedProgressRing({ taken, total }: { taken: number; total: number }) {
  const size = 60;
  const strokeWidth = 6;
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
          stroke={hexToRgba(Colors.textHint, 0.2)}
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
    </View>
  );
}

export function VitalMiniCard({
  label,
  value,
  isWarning,
  onPress,
}: {
  label: string;
  value: string;
  isWarning: boolean;
  onPress: () => void;
}) {
  const statusColor = isWarning ? Colors.error : Colors.success;
  return (
    <TouchableOpacity style={styles.vitalCard} onPress={onPress}>
      <Text style={styles.vitalLabel}>{label.toUpperCase()}</Text>
      <View style={{ height: 4 }} />
      <Text style={styles.vitalValue}>{value}</Text>
      <View style={{ height: 4 }} />
      <View style={styles.vitalStatusRow}>
        <View style={[styles.vitalDot, { borderColor: statusColor }]} />
        <Text style={[styles.vitalStatusText, { color: statusColor }]}>
          {isWarning ? 'Cảnh báo' : 'OK'}
        </Text>
      </View>
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
    <TouchableOpacity style={styles.cameraActionButton} onPress={onPress}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
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
    <TouchableOpacity style={styles.aptCard} onPress={onPress}>
      <View style={styles.aptDateBox}>
        <Text style={styles.aptDay}>{day}</Text>
        <Text style={styles.aptMonth}>{monthStr}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.aptDoctor}>{apt.doctor}</Text>
        <Text style={styles.aptDetail}>
          {apt.specialty} • {timeStr}
        </Text>
      </View>
      <Ionicons name="chevron-forward" color={Colors.textHint} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ringText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  vitalCard: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.25),
  },
  vitalLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 0.4 },
  vitalValue: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Colors.textPrimary },
  vitalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vitalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  vitalStatusText: { fontSize: 9 },
  cameraActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.primary, 0.4),
  },
  cameraActionLabel: { fontSize: 12, color: Colors.primary },
  aptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  aptDateBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: hexToRgba(Colors.primary, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  aptDay: { fontWeight: '700', fontSize: Typography.cardTitle.fontSize, color: Colors.primary },
  aptMonth: { fontSize: 10, color: Colors.primary },
  aptDoctor: {
    fontWeight: '600',
    fontSize: Typography.buttonSmall.fontSize,
    color: Colors.textPrimary,
  },
  aptDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
