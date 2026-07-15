import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { getUserId } from '../../../core/storage/secureStorage';
import { useCameraStore, type CameraDeviceData } from '../../family/store/cameraStore';

/**
 * Port of Flutter's elderly_camera_screen.dart (Wireframe B3 — "Camera trong nhà").
 *
 * The elderly resident can see per-room camera on/off status and toggle
 * privacy mode for all cameras at once (or per-room). No live video stream
 * is rendered here — the Flutter original didn't render a stream on this
 * screen either, it only surfaced on/off + privacy status from the API.
 */
export default function ElderlyCameraScreen() {
  const [elderlyId, setElderlyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isLoading = useCameraStore((s) => s.isLoading);
  const cameras = useCameraStore((s) => s.cameras);
  const load = useCameraStore((s) => s.load);
  const setPrivacyMode = useCameraStore((s) => s.setPrivacyMode);

  useEffect(() => {
    (async () => {
      const id = await getUserId();
      setElderlyId(id);
      if (id) load(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  const togglePrivacyForAll = async (turnOff: boolean) => {
    if (!elderlyId) return;
    for (const cam of cameras) {
      // eslint-disable-next-line no-await-in-loop
      await setPrivacyMode(elderlyId, cam.id, turnOff);
    }
    // Note: Flutter showed a SnackBar here ("Đã tắt camera tạm thời..." /
    // "Đã bật lại camera."). No SnackBar/Toast primitive is wired up in this
    // RN port yet, so the confirmation text is omitted.
  };

  if (elderlyId === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>Camera trong nhà</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const anyActive = cameras.some((c) => c.status === 'ONLINE' && !c.privacyMode);
  const allPrivate = cameras.length > 0 && cameras.every((c) => c.privacyMode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Camera trong nhà</Text>
      </View>

      {isLoading && cameras.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : cameras.length === 0 ? (
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_confused.jpg')}
            style={{ width: 150, height: 150 }}
            resizeMode="contain"
          />
          <View style={{ height: 4 }} />
          <Text style={styles.emptyTitle}>Chưa có camera nào được liên kết</Text>
          <View style={{ height: 6 }} />
          <Text style={styles.emptySubtitle}>
            Con của bạn có thể liên kết camera trong phần Gia đình.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {/* Overall status */}
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: anyActive ? Colors.success : Colors.textHint },
              ]}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.statusTitle}>
                {anyActive ? 'Camera đang bật' : 'Camera đang tắt'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {anyActive
                  ? 'Con của bố/mẹ đang có thể nhìn thấy'
                  : 'Không ai có thể xem lúc này'}
              </Text>
            </View>
          </View>

          <View style={{ height: 20 }} />

          {/* Main privacy toggle */}
          <TouchableOpacity
            style={[
              styles.mainToggleButton,
              { backgroundColor: allPrivate ? Colors.success : Colors.sosPrimary },
            ]}
            onPress={() => togglePrivacyForAll(!allPrivate)}
          >
            <Ionicons name={allPrivate ? 'videocam' : 'power'} size={22} color="#FFFFFF" />
            <Text style={styles.mainToggleText}>
              {allPrivate ? 'BẬT LẠI CAMERA' : 'TẮT CAMERA TẠM THỜI'}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 10 }} />
          <Text style={styles.hintText}>
            Khi tắt, con sẽ được báo là bạn cần sự riêng tư. Bấm lại để bật.
          </Text>

          <View style={{ height: 24 }} />
          <Text style={styles.sectionLabel}>Từng phòng</Text>
          <View style={{ height: 10 }} />
          {cameras.map((cam) => (
            <RoomTile
              key={cam.id}
              cam={cam}
              onToggle={(value) => setPrivacyMode(elderlyId, cam.id, !value)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RoomTile({
  cam,
  onToggle,
}: {
  cam: CameraDeviceData;
  onToggle: (value: boolean) => void;
}) {
  const isOnline = cam.status === 'ONLINE';
  const isActive = isOnline && !cam.privacyMode;

  return (
    <View style={styles.roomTile}>
      <Ionicons name="videocam" size={22} color={isActive ? Colors.success : Colors.textHint} />
      <Text style={styles.roomLabel}>{cam.label}</Text>
      <Text style={[styles.roomStatus, { color: isActive ? Colors.success : Colors.textHint }]}>
        {isActive ? 'Đang bật' : 'Đã tắt'}
      </Text>
      <Switch
        value={isActive}
        onValueChange={isOnline ? onToggle : undefined}
        disabled={!isOnline}
        trackColor={{ true: Colors.success }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  emptySubtitle: { color: Colors.textHint, fontSize: 13, textAlign: 'center' },
  scroll: { padding: 20 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: Colors.surface,
    borderRadius: 18,
  },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statusSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  mainToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  mainToggleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  hintText: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  roomTile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    gap: 12,
  },
  roomLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  roomStatus: { fontSize: 12, fontWeight: '600', marginRight: 4 },
});
