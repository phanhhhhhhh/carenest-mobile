import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useCameraStore } from '../store/cameraStore';

type Route = RouteProp<RootStackParamList, 'FamilyLiveCamera'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyLiveCameraScreen() {
  const navigation = useNavigation<Navigation>();
  const { cameraId, label, elderlyId } = useRoute<Route>().params;
  const liveView = useCameraStore((state) => state.liveView);
  const getLiveStream = useCameraStore((state) => state.getLiveStream);
  const clearLiveStream = useCameraStore((state) => state.clearLiveStream);
  const load = useCameraStore((state) => state.load);
  const player = useVideoPlayer(null);
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status: playerStatus } = useEvent(player, 'statusChange', { status: player.status });
  const [privacyDetected, setPrivacyDetected] = useState(false);

  const stopPlayback = useCallback(() => {
    player.pause();
    void player.replaceAsync(null);
    clearLiveStream();
  }, [clearLiveStream, player]);

  const requestFreshStream = useCallback(async () => {
    stopPlayback();
    setPrivacyDetected(false);
    await load(elderlyId);
    await getLiveStream(cameraId);
  }, [cameraId, elderlyId, getLiveStream, load, stopPlayback]);

  useFocusEffect(useCallback(() => {
    void requestFreshStream();
    return stopPlayback;
  }, [requestFreshStream, stopPlayback]));

  useEffect(() => {
    const stream = liveView.stream;
    if (!stream) return;
    void player.replaceAsync({
      uri: stream.streamUrl,
      contentType: 'hls',
      useCaching: false,
    }).then(() => player.play()).catch(stopPlayback);
  }, [liveView.stream, player, stopPlayback]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stopPlayback();
    });
    return () => subscription.remove();
  }, [stopPlayback]);

  useEffect(() => {
    if (!liveView.stream) return;
    const timer = setInterval(async () => {
      try {
        const response = await api.get(`/cameras/${cameraId}/status`);
        if (response.data?.privacyMode === true) {
          setPrivacyDetected(true);
          stopPlayback();
        }
      } catch {
        // The live request remains authoritative; transient polling failures do not imply offline.
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [cameraId, liveView.stream, stopPlayback]);

  const phase = privacyDetected ? 'privacy' : liveView.phase;
  const buffering = liveView.stream != null && !isPlaying
    && (playerStatus === 'loading' || playerStatus === 'readyToPlay');
  const message = privacyDetected ? 'Người thân đang bật Chế độ riêng tư.' : liveView.message;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách camera"
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{liveView.stream?.label ?? label}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.videoWrap} accessibilityLabel={`Luồng trực tiếp ${label}`}>
        {liveView.stream && phase === 'ready' ? (
          <VideoView player={player} style={styles.video} nativeControls={false} />
        ) : null}
        {isPlaying && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TRỰC TIẾP</Text>
          </View>
        )}
        {(phase === 'loading' || buffering) && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#FFFFFF" size="large" />
            <Text style={styles.overlayText}>{buffering ? 'Đang tải bộ đệm…' : 'Đang kết nối camera…'}</Text>
          </View>
        )}
        {!liveView.stream && phase !== 'loading' && (
          <View style={styles.overlay}>
            <Ionicons
              name={phase === 'privacy' ? 'eye-off-outline' : 'videocam-off-outline'}
              size={52}
              color="#CBD5E1"
            />
            <Text style={styles.overlayText}>{message ?? 'Luồng trực tiếp chưa sẵn sàng.'}</Text>
            {liveView.lastSeenAt && phase === 'offline' && (
              <Text style={styles.lastSeen}>Lần trực tuyến gần nhất: {new Date(liveView.lastSeenAt).toLocaleString('vi-VN')}</Text>
            )}
            {!['consent', 'privacy', 'unsupported'].includes(phase) && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={requestFreshStream}
                accessibilityRole="button"
                accessibilityLabel="Thử lại luồng camera"
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <Text style={styles.securityNote}>Luồng xem chỉ được giữ trong bộ nhớ khi màn hình này đang mở.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 44 },
  title: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  videoWrap: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  overlayText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600', textAlign: 'center', lineHeight: 23 },
  lastSeen: { color: '#94A3B8', fontSize: 13, textAlign: 'center' },
  liveBadge: { position: 'absolute', zIndex: 2, top: 14, left: 14, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#DC2626', flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  liveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  retryButton: { marginTop: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 999, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 7 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  securityNote: { color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 14 },
});
