import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AvailabilityStatus } from '../../../../shared/types';

/**
 * Header toggle for the family member's own FREE/BUSY state (UC A3). FREE means
 * "page me first for daily events"; it never affects SOS.
 */
export function AvailabilityChip({
  status,
  onToggle,
}: {
  status: AvailabilityStatus | undefined;
  onToggle: (next: AvailabilityStatus) => void;
}) {
  if (!status) return null;
  const free = status === 'FREE';

  return (
    <TouchableOpacity
      style={[styles.chip, free ? styles.free : styles.busy]}
      onPress={() => onToggle(free ? 'BUSY' : 'FREE')}
      activeOpacity={0.8}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons
        name={free ? 'notifications' : 'notifications-off'}
        size={13}
        color={free ? '#047857' : '#B45309'}
      />
      <Text style={[styles.text, { color: free ? '#047857' : '#B45309' }]}>
        {free ? 'Đang rảnh' : 'Đang bận'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  free: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  busy: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  text: { fontSize: 12, fontWeight: '700' },
});
