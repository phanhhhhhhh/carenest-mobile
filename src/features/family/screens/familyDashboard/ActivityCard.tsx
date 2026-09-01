import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { ActivityItem } from './useDashboardActivity';

export function ActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <View style={styles.activityCard}>
      {items.map((item, idx) => (
        <View key={idx}>
          <View style={styles.activityRow}>
            <View style={[styles.activityIconBox, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} color={item.color} size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
          {idx < items.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    width: '100%',
    padding: 18,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  activityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 14,
  },
  activitySubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  activityTime: { color: Colors.textHint, fontSize: 11.5, fontWeight: '500' },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 10,
  },
});
