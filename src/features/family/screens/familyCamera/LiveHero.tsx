import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
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
      ? 'videocam'
      : 'videocam-off';

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroVideoWrap}>
        <View style={styles.heroVideoPlaceholder}>
          <Ionicons
            name={heroIcon}
            size={48}
            color={cam.privacyMode ? '#94A3B8' : online ? '#22C55E' : '#EF4444'}
          />
          {cam.privacyMode && (
            <Text style={styles.privacyNoticeText}>Người thân đang bật Chế độ riêng tư</Text>
          )}
        </View>
        {online && !cam.privacyMode && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>TRỰC TIẾP · HD</Text>
          </View>
        )}
      </View>

      <View style={{ height: 12 }} />
      <View style={styles.heroInfoRow}>
        <View>
          <Text style={styles.heroLabel}>{cam.label || 'Camera an ninh'}</Text>
          <Text style={styles.heroSub}>
            {cam.privacyMode
              ? 'Chế độ riêng tư'
              : online
                ? 'Đang kết nối trực tiếp'
                : 'Mất kết nối'}
          </Text>
        </View>
      </View>

      <View style={{ height: 12 }} />
      <View style={styles.heroActionsRow}>
        <ActionBtn
          icon="camera"
          label="Chụp ảnh"
          color={Colors.primary}
          onPress={onSnapshot}
          style={{ flex: 1 }}
        />
        <View style={{ width: 8 }} />
        <ActionBtn
          icon={voiceActive ? 'mic-off' : 'mic'}
          label={voiceActive ? 'Ngắt đàm thoại' : 'Đàm thoại 2 chiều'}
          color={voiceActive ? '#EF4444' : '#059669'}
          onPress={onVoiceToggle}
          style={{ flex: 1.3 }}
        />
        <View style={{ width: 8 }} />
        <ActionBtn
          icon="sync-outline"
          label="Xoay góc"
          color="#64748B"
          onPress={onOpenPtz}
          style={{ flex: 0.9 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    margin: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  heroVideoWrap: { aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden' },
  heroVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  privacyNoticeText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  heroSub: { fontSize: 12.5, color: '#64748B', marginTop: 1, fontWeight: '500' },
  heroActionsRow: { flexDirection: 'row' },
});
