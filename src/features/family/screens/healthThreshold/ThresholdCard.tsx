import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import {
  getDisplayType,
  getRangeDisplay,
  getUnit,
  type ThresholdItem,
} from '../../store/healthThresholdStore';
import { colorFor, iconFor } from './utils';

export function ThresholdCard({
  type,
  existing,
  onPress,
}: {
  type: string;
  existing: ThresholdItem | null;
  onPress: () => void;
}) {
  const displayType = getDisplayType({ metricType: type } as ThresholdItem);
  const unit = getUnit({ metricType: type } as ThresholdItem);
  const color = colorFor(type);
  const isSet = existing != null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: isSet ? 'rgba(67, 160, 71, 0.3)' : 'rgba(173, 181, 189, 0.15)' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={iconFor(type)} size={22} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{displayType}</Text>
        <View style={{ height: 3 }} />
        <Text
          style={[styles.cardSubtitle, { color: isSet ? Colors.textSecondary : Colors.textHint }]}
        >
          {isSet ? `${getRangeDisplay(existing)} ${unit}` : 'Chạm để đặt phạm vi'}
        </Text>
      </View>
      <View
        style={[
          styles.statusPill,
          { backgroundColor: isSet ? 'rgba(67, 160, 71, 0.1)' : 'rgba(173, 181, 189, 0.06)' },
        ]}
      >
        <Text style={[styles.statusPillText, { color: isSet ? Colors.success : Colors.textHint }]}>
          {isSet ? 'Đã đặt' : 'Chưa đặt'}
        </Text>
      </View>
      <View style={{ width: 4 }} />
      <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  cardSubtitle: { fontSize: 13 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: 12, fontWeight: '600' },
});
