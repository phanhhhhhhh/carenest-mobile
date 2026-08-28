import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function AlertsHeader({
  activeCount,
  marking,
  onMarkAllRead,
  onBack,
}: {
  activeCount: number;
  marking: boolean;
  onMarkAllRead: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitle}>Cảnh báo</Text>
        {activeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount} mới</Text>
          </View>
        )}
      </View>
      {activeCount > 0 && (
        <TouchableOpacity onPress={onMarkAllRead} disabled={marking} style={styles.markAllButton}>
          {marking ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.markAllText}>Đánh dấu đã đọc tất cả</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { marginRight: 12 },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  markAllButton: { paddingHorizontal: 8, paddingVertical: 4, minWidth: 16, alignItems: 'center' },
  markAllText: { color: Colors.primary, fontSize: 13, fontWeight: '500' },
});
