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
    <View style={styles.appBar}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.appBarTitle}>Cảnh báo & Sự cố</Text>
        <Text style={styles.appBarSubtitle}>
          {activeCount > 0 ? `${activeCount} cảnh báo cần chú ý` : 'Tất cả an toàn'}
        </Text>
      </View>
      {activeCount > 0 && (
        <TouchableOpacity
          style={styles.markReadButton}
          onPress={onMarkAllRead}
          disabled={marking}
          activeOpacity={0.8}
        >
          {marking ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.markReadText}>Đã xem hết</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  appBarSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 1, fontWeight: '500' },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E6F7F5',
  },
  markReadText: { fontSize: 12.5, fontWeight: '700', color: Colors.primary },
});
