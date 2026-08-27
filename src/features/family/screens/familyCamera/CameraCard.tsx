import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { isCameraOnline, type CameraDeviceData } from '../../store/cameraStore';
import { ActionBtn } from './ActionBtn';

export function CameraCard({
  cam,
  voiceActive,
  onLiveView,
  onSnapshot,
  onVoiceToggle,
  onPrivacyToggle,
  onMotionToggle,
  onMenu,
}: {
  cam: CameraDeviceData;
  voiceActive: boolean;
  onLiveView: () => void;
  onSnapshot: () => void;
  onVoiceToggle: () => void;
  onPrivacyToggle: () => void;
  onMotionToggle: (v: boolean) => void;
  onMenu: () => void;
}) {
  const online = isCameraOnline(cam);
  const privacy = cam.privacyMode;

  const borderColor = privacy
    ? 'rgba(173,181,189,0.2)'
    : online
      ? 'rgba(67,160,71,0.2)'
      : 'rgba(229,57,53,0.15)';
  const iconBg = privacy
    ? 'rgba(173,181,189,0.1)'
    : online
      ? 'rgba(67,160,71,0.1)'
      : 'rgba(229,57,53,0.08)';
  const iconColor = privacy ? Colors.textHint : online ? Colors.success : Colors.error;
  const statusLabel = privacy ? 'Chế độ riêng tư' : online ? 'Trực tuyến' : 'Ngoại tuyến';
  const statusColor = privacy ? Colors.textSecondary : online ? Colors.success : Colors.error;

  return (
    <View style={[styles.cameraCard, { borderColor }]}>
      <View style={styles.cameraCardHeader}>
        <View style={[styles.cameraIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={privacy ? 'eye-off' : 'videocam'} size={22} color={iconColor} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cameraLabel}>{cam.label}</Text>
          <Text style={[styles.cameraStatus, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <TouchableOpacity onPress={onMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 14 }} />

      <View style={styles.motionRow}>
        <Ionicons name="walk-outline" size={18} color={Colors.textSecondary} />
        <Text style={styles.motionLabel}>Phát hiện chuyển động</Text>
        <Switch
          value={cam.motionDetectionEnabled}
          onValueChange={onMotionToggle}
          trackColor={{ true: Colors.primary }}
        />
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.cardActionsWrap}>
        <ActionBtn
          icon="tv-outline"
          label="Xem trực tiếp"
          color={Colors.primary}
          onPress={onLiveView}
        />
        <ActionBtn icon="camera" label="Ảnh chụp" color={Colors.secondary} onPress={onSnapshot} />
        <ActionBtn
          icon={voiceActive ? 'mic-off' : 'mic'}
          label={voiceActive ? 'Kết thúc' : 'Gọi thoại'}
          color={voiceActive ? Colors.error : Colors.warning}
          onPress={onVoiceToggle}
        />
        <ActionBtn
          icon={privacy ? 'eye' : 'eye-off'}
          label={privacy ? 'Hiện' : 'Riêng tư'}
          color={Colors.textSecondary}
          onPress={onPrivacyToggle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraCard: {
    marginBottom: 14,
    padding: 18,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cameraCardHeader: { flexDirection: 'row', alignItems: 'center' },
  cameraIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLabel: { fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  cameraStatus: { fontSize: 12, marginTop: 2 },
  motionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  motionLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  cardActionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
