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
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipUnselected: { backgroundColor: Colors.surface, borderColor: 'rgba(173, 181, 189, 0.3)' },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextSelected: { color: '#FFFFFF' },
});
