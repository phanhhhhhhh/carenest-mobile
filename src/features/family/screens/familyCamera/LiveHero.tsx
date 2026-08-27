import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { isCameraOnline, type CameraDeviceData } from '../../store/cameraStore';
import { ActionBtn } from './ActionBtn';

export function LiveHero({
  cam,
  voiceActive,
  onSnapshot,
  onVoiceToggle,
  onOpenPtz,
}: {
  cam: CameraDeviceData;
  voiceActive: boolean;
  onSnapshot: () => void;
  onVoiceToggle: () => void;
  onOpenPtz: () => void;
}) {
  const online = isCameraOnline(cam);
  const heroIcon: keyof typeof Ionicons.glyphMap = cam.privacyMode
    ? 'eye-off'
    : online
      ? 'play-circle'
      : 'videocam-off';

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroVideoWrap}>
        <View style={styles.heroVideoPlaceholder}>
          <Ionicons name={heroIcon} size={44} color="rgba(255,255,255,0.54)" />
        </View>
        {online && !cam.privacyMode && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE · HD</Text>
          </View>
        )}
      </View>
      <View style={{ height: 10 }} />
      <Text style={styles.heroLabel}>{cam.label}</Text>
      <View style={{ height: 8 }} />
      <View style={styles.heroActionsRow}>
        <ActionBtn
          icon="camera"
          label="Ảnh chụp"
          color={Colors.secondary}
          onPress={onSnapshot}
          style={{ flex: 1 }}
        />
        <View style={{ width: 8 }} />
        <ActionBtn
          icon={voiceActive ? 'mic-off' : 'mic'}
          label={voiceActive ? 'Kết thúc' : 'Gọi thoại'}
          color={voiceActive ? Colors.error : Colors.warning}
          onPress={onVoiceToggle}
          style={{ flex: 1 }}
        />
        <View style={{ width: 8 }} />
        <ActionBtn
          icon="sync-outline"
          label="Xoay"
          color={Colors.textSecondary}
          onPress={onOpenPtz}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    margin: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  heroVideoWrap: { aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' },
  heroVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  heroLabel: { fontWeight: '700', fontSize: 14, color: Colors.textPrimary },
  heroActionsRow: { flexDirection: 'row' },
});
