import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../core/theme';
import type { CameraDeviceData } from '../../store/cameraStore';
import { hexToRgba } from './utils';
import { CameraActionButton } from './widgets';

export function DashboardCameraCard({
  cam,
  onOpenCamera,
}: {
  cam: CameraDeviceData | null;
  onOpenCamera: () => void;
}) {
  const hasCamera = cam != null;
  const camOnline = cam?.status === 'ONLINE';

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{cam ? `Camera — ${cam.label}` : 'Camera'}</Text>
        {hasCamera && camOnline && (
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Trực tiếp</Text>
          </View>
        )}
      </View>
      <View style={{ height: 10 }} />
      {!hasCamera ? (
        <View style={styles.emptyBox}>
          <Ionicons name="videocam-off" color={Colors.textHint} size={32} />
          <Text style={[styles.emptyBoxText, { marginTop: 8 }]}>Chưa liên kết camera nào</Text>
          <TouchableOpacity onPress={onOpenCamera}>
            <Text style={[styles.viewAllText, { marginTop: 8 }]}>+ Thêm camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraCard}>
          <View style={styles.cameraPreviewBox}>
            <Ionicons
              name={camOnline ? 'play-circle' : 'videocam-off'}
              color="rgba(255,255,255,0.54)"
              size={40}
            />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.cameraActionsRow}>
            <CameraActionButton icon="play" label="Xem" onPress={onOpenCamera} />
            <View style={{ width: 8 }} />
            <CameraActionButton icon="mic" label="Gọi" onPress={onOpenCamera} />
            <View style={{ width: 8 }} />
            <CameraActionButton icon="calendar" label="Kiểm tra" onPress={onOpenCamera} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.25),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyBox: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: Typography.bodySmall.fontSize },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  liveBadgeText: { fontSize: Typography.caption.fontSize, fontWeight: '700', color: Colors.error },
  cameraCard: { paddingTop: Spacing.md },
  cameraPreviewBox: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraActionsRow: { flexDirection: 'row' },
});
