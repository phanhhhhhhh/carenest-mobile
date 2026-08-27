import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../core/theme';
import { hexToRgba } from './utils';
import type { ActivityItem } from './useDashboardActivity';

export function ActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <View style={styles.activityCard}>
      {items.map((item, idx) => (
        <View key={idx}>
          <View style={styles.activityRow}>
            <View
              style={[styles.activityIconBox, { backgroundColor: hexToRgba(item.color, 0.08) }]}
            >
              <Ionicons name={item.icon} color={item.color} size={20} />
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
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: Typography.buttonSmall.fontSize,
  },
  activitySubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  activityTime: { color: Colors.textHint, fontSize: 12 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: hexToRgba(Colors.textHint, 0.25),
    marginVertical: 10,
  },
});
