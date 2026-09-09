import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import { isCameraOnline, type CameraDeviceData } from '../../store/cameraStore';

export function LiveHero({ cam, onLiveView }: { cam: CameraDeviceData; onLiveView: () => void }) {
  const online = isCameraOnline(cam);
  const blocked = !online || cam.privacyMode;
  const heroIcon: keyof typeof Ionicons.glyphMap = cam.privacyMode
    ? 'eye-off' : online ? 'videocam' : 'videocam-off';

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroVideoWrap}>
        <Ionicons
          name={heroIcon}
          size={48}
          color={cam.privacyMode ? '#94A3B8' : online ? '#22C55E' : '#EF4444'}
        />
        {cam.privacyMode && <Text style={styles.notice}>Người thân đang bật Chế độ riêng tư</Text>}
      </View>
      <Text style={styles.label}>{cam.label || 'Camera an ninh'}</Text>
      <Text style={styles.status}>
        {cam.privacyMode ? 'Chế độ riêng tư' : online ? 'Sẵn sàng xem' : 'Mất kết nối'}
      </Text>
      <TouchableOpacity
        style={[styles.viewButton, blocked && styles.disabled]}
        onPress={onLiveView}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel={`Xem trực tiếp ${cam.label}`}
        accessibilityState={{ disabled: blocked }}
      >
        <Ionicons name="play" size={18} color="#FFFFFF" />
        <Text style={styles.viewButtonText}>Xem trực tiếp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    margin: 16, marginTop: 12, marginBottom: 8, padding: 16,
    backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1,
    borderColor: '#E2E8F0', ...Shadows.md,
  },
  heroVideoWrap: {
    aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0F172A',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  notice: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  label: { marginTop: 12, fontSize: 17, fontWeight: '800', color: '#0F172A' },
  status: { fontSize: 12.5, color: '#64748B', marginTop: 2, fontWeight: '500' },
  viewButton: {
    marginTop: 14, borderRadius: 12, backgroundColor: Colors.primary, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  disabled: { opacity: 0.45 },
  viewButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
