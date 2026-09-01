import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { CameraDeviceData } from '../../store/cameraStore';
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
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="videocam" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>
            {cam ? `Camera — ${cam.label}` : 'Camera giám sát'}
          </Text>
        </View>
        {hasCamera && camOnline && (
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>TRỰC TIẾP</Text>
          </View>
        )}
      </View>

      <View style={{ height: 14 }} />

      {!hasCamera ? (
        <View style={styles.emptyBox}>
          <Ionicons name="videocam-outline" color={Colors.textHint} size={36} />
          <Text style={styles.emptyBoxText}>Chưa liên kết camera phòng ngủ/phòng khách</Text>
          <TouchableOpacity onPress={onOpenCamera} style={styles.addCamBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={styles.addCamText}>Thêm camera ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraCard}>
          <TouchableOpacity
            style={styles.cameraPreviewBox}
            onPress={onOpenCamera}
            activeOpacity={0.9}
          >
            <View style={styles.playCircle}>
              <Ionicons name={camOnline ? 'play' : 'videocam-off'} color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.previewHint}>
              {camOnline ? 'Nhấn để xem trực tiếp' : 'Camera đang ngắt kết nối'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 14 }} />

          <View style={styles.cameraActionsRow}>
            <CameraActionButton icon="play" label="Xem trực tiếp" onPress={onOpenCamera} />
            <View style={{ width: 8 }} />
            <CameraActionButton icon="mic" label="Đàm thoại 2 chiều" onPress={onOpenCamera} />
            <View style={{ width: 8 }} />
            <CameraActionButton icon="time" label="Lịch sử xem" onPress={onOpenCamera} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sosLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.error },
  liveBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.error, letterSpacing: 0.5 },
  emptyBox: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    gap: 6,
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  addCamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
  },
  addCamText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  cameraCard: {},
  cameraPreviewBox: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  cameraActionsRow: { flexDirection: 'row' },
});
