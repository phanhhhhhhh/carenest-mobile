import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { FeedItem, FeedItemType } from '../../../../shared/types';
import { formatRelative } from '../familyDashboard/utils';

const TYPE_META: Record<FeedItemType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  CHECK_IN: { icon: 'happy-outline', color: Colors.primary },
  MEDICATION_LOG: { icon: 'medkit-outline', color: Colors.success },
  EMERGENCY: { icon: 'alert-circle-outline', color: Colors.error },
};

export function FeedRow({
  item,
  onToggleReaction,
}: {
  item: FeedItem;
  onToggleReaction?: (item: FeedItem) => void;
}) {
  const meta = TYPE_META[item.type];

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: `${meta.color}18` }]}>
        <Ionicons name={meta.icon} color={meta.color} size={18} />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.title}>{item.title}</Text>
        {!!item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.time}>{formatRelative(item.occurredAt)}</Text>
          <View style={styles.dot} />
          <Ionicons
            name={item.handled ? 'checkmark-circle' : 'time-outline'}
            size={13}
            color={item.handled ? Colors.success : Colors.textHint}
          />
          <Text style={[styles.status, item.handled && { color: Colors.success }]}>
            {item.handled ? 'Đã xử lý' : 'Chưa ai xử lý'}
          </Text>
        </View>
      </View>

      {onToggleReaction && (
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => onToggleReaction(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.reactedByMe ? 'heart' : 'heart-outline'}
            size={20}
            color={item.reactedByMe ? Colors.error : Colors.textHint}
          />
          {item.reactionCount > 0 && <Text style={styles.heartCount}>{item.reactionCount}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  title: { fontWeight: '700', color: Colors.textPrimary, fontSize: 14 },
  subtitle: { color: Colors.textSecondary, fontSize: 12.5, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  time: { color: Colors.textHint, fontSize: 11.5, fontWeight: '500' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textHint },
  status: { color: Colors.textHint, fontSize: 11.5, fontWeight: '600' },
  heartBtn: { alignItems: 'center', paddingLeft: 8, minWidth: 30 },
  heartCount: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginTop: 2 },
});
