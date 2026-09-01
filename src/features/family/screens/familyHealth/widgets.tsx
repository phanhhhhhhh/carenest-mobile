import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../../../core/theme/colors';

export function PeriodChip({
  label,
  selected,
  onTap,
}: {
  label: string;
  selected: boolean;
  onTap: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onTap}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  chipUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  chipTextSelected: { color: '#FFFFFF' },
});
