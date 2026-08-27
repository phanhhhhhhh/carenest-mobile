import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../../../../core/theme/colors';

export function PeriodChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.periodChip,
        {
          backgroundColor: selected ? Colors.primary : Colors.surface,
          borderColor: selected ? Colors.primary : 'rgba(173, 181, 189, 0.3)',
        },
      ]}
    >
      <Text style={[styles.periodChipText, { color: selected ? '#FFFFFF' : Colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Image
        source={require('../../../../../assets/mascot/mascot_confused.jpg')}
        style={{ width: 130, height: 130 }}
        resizeMode="contain"
      />
      <View style={{ height: 4 }} />
      <Text style={styles.emptyTitle}>Chưa có dữ liệu sức khỏe</Text>
      <View style={{ height: 6 }} />
      <Text style={styles.emptySubtitle}>Nhấn + để thêm chỉ số đầu tiên</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  periodChipText: { fontSize: 13, fontWeight: '600' },
  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14 },
});
