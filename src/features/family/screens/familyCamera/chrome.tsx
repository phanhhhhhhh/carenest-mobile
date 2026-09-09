import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { CameraStatusData } from '../../store/cameraStore';

export function CameraAppBar({
  elderlyName,
  onBack,
  onAddCamera,
}: {
  elderlyName: string;
  onBack: () => void;
  onAddCamera?: () => void;
}) {
  return (
    <View style={styles.appBar}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.appBarTitle} numberOfLines={1}>
            Camera an tâm
          </Text>
          <Text style={styles.appBarSubtitle}>Người thân: {elderlyName}</Text>
        </View>
      </View>
      {onAddCamera && (
        <TouchableOpacity style={styles.addBtn} onPress={onAddCamera} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm Camera</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function CameraStatusBar({ status }: { status: CameraStatusData }) {
  const indicatorColor =
    status.indicatorColor === 'GREEN'
      ? '#16A34A'
      : status.indicatorColor === 'RED'
        ? '#DC2626'
        : '#64748B';
  const indicatorBg =
    status.indicatorColor === 'GREEN'
      ? '#DCFCE7'
      : status.indicatorColor === 'RED'
        ? '#FEE2E2'
        : '#F1F5F9';

  return (
    <View style={styles.statusBar}>
      <View style={[styles.statusBadge, { backgroundColor: indicatorBg }]}>
        <View style={[styles.statusDot, { backgroundColor: indicatorColor }]} />
        <Text style={[styles.statusText, { color: indicatorColor }]} numberOfLines={1}>
          {status.hasCamera ? status.statusText : 'Chưa liên kết camera nào'}
        </Text>
      </View>
      {status.hasCamera && <Text style={styles.statusCount}>{status.cameraCount} camera</Text>}
    </View>
  );
}

export function CameraTabBar({
  tab,
  checkCount,
  deviceCount,
  onSelect,
}: {
  tab: 0 | 1;
  checkCount: number;
  deviceCount: number;
  onSelect: (t: 0 | 1) => void;
}) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabItem, tab === 0 && styles.tabItemActive]}
        onPress={() => onSelect(0)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="images-outline"
          size={16}
          color={tab === 0 ? Colors.primary : '#64748B'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.tabLabel, tab === 0 && styles.tabLabelActive]}>
          Ảnh định kỳ ({checkCount})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabItem, tab === 1 && styles.tabItemActive]}
        onPress={() => onSelect(1)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="videocam-outline"
          size={16}
          color={tab === 1 ? Colors.primary : '#64748B'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.tabLabel, tab === 1 && styles.tabLabelActive]}>
          Thiết bị ({deviceCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  appBarSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 1, fontWeight: '500' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusCount: { color: '#64748B', fontSize: 13, fontWeight: '600' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  tabItemActive: { backgroundColor: '#E6F7F5' },
  tabLabel: { fontSize: 13.5, fontWeight: '600', color: '#64748B' },
  tabLabelActive: { color: Colors.primary, fontWeight: '800' },
});
