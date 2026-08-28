import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { CameraStatusData } from '../../store/cameraStore';

export function CameraAppBar({ elderlyName, onBack }: { elderlyName: string; onBack: () => void }) {
  return (
    <View style={styles.appBar}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.appBarTitle} numberOfLines={1}>
        Camera — {elderlyName}
      </Text>
      <View style={styles.backBtn} />
    </View>
  );
}

export function CameraStatusBar({ status }: { status: CameraStatusData }) {
  const indicatorColor =
    status.indicatorColor === 'GREEN'
      ? Colors.success
      : status.indicatorColor === 'RED'
        ? Colors.error
        : Colors.textHint;

  return (
    <View style={styles.statusBar}>
      <View style={[styles.statusDot, { backgroundColor: indicatorColor }]} />
      <Text style={styles.statusText} numberOfLines={1}>
        {status.hasCamera ? status.statusText : 'Chưa liên kết camera nào'}
      </Text>
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
      <TouchableOpacity style={styles.tabItem} onPress={() => onSelect(0)}>
        <Text style={[styles.tabLabel, tab === 0 && styles.tabLabelActive]}>
          {`Kiểm tra (${checkCount})`}
        </Text>
        <View style={[styles.tabIndicator, tab === 0 && styles.tabIndicatorActive]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => onSelect(1)}>
        <Text style={[styles.tabLabel, tab === 1 && styles.tabLabelActive]}>
          {`Thiết bị (${deviceCount})`}
        </Text>
        <View style={[styles.tabIndicator, tab === 1 && styles.tabIndicatorActive]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  statusCount: { color: Colors.textSecondary, fontSize: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 14, fontWeight: '600', color: Colors.textHint },
  tabLabelActive: { color: Colors.primary },
  tabIndicator: {
    height: 2,
    width: '60%',
    marginTop: 8,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  tabIndicatorActive: { backgroundColor: Colors.primary },
});
