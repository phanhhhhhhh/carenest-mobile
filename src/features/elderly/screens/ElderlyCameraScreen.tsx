import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { getUserId } from '../../../core/storage/secureStorage';
import { useCameraStore, type CameraDeviceData } from '../../family/store/cameraStore';

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
  }, []);

  const onRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  const togglePrivacyForAll = async (turnOff: boolean) => {
    if (!elderlyId) return;
    let anyFailed = false;
    for (const cam of cameras) {
      const ok = await setPrivacyMode(elderlyId, cam.id, turnOff);
      if (!ok) anyFailed = true;
    }
    if (anyFailed) {
      Alert.alert('', 'Không thể thay đổi chế độ riêng tư cho một số camera');
    }
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          <View style={styles.statusCard}>
            <View style={styles.statusIconRing}>
              <View
                style={[
                  styles.statusIconDot,
                  { backgroundColor: anyActive ? Colors.textPrimary : Colors.textHint },
                ]}
              />
            </View>
            <View style={{ height: 14 }} />
            <Text style={styles.statusTitle}>
              {anyActive ? 'Camera đang bật' : 'Camera đang tắt'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {anyActive ? 'Con của bố/mẹ đang có thể nhìn thấy' : 'Không ai có thể xem lúc này'}
            </Text>
          </View>

          <View style={{ height: 16 }} />

          <TouchableOpacity
            style={styles.mainToggleButton}
            onPress={() => togglePrivacyForAll(!allPrivate)}
          >
            <View style={styles.mainToggleIconBox}>
              <Ionicons
                name={allPrivate ? 'videocam' : 'power'}
                size={18}
                color={Colors.textPrimary}
              />
            </View>
            <Text style={styles.mainToggleText}>
              {allPrivate ? 'BẬT LẠI CAMERA' : 'TẮT CAMERA TẠM THỜI'}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 10 }} />
          <Text style={styles.hintText}>
            Khi tắt, con sẽ được báo là bạn cần sự riêng tư. Bấm lại để bật.
          </Text>

          <View style={{ height: 24 }} />
          <View style={styles.roomListCard}>
            {cameras.map((cam, index) => (
              <RoomRow key={cam.id} cam={cam} isLast={index === cameras.length - 1} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RoomRow({ cam, isLast }: { cam: CameraDeviceData; isLast: boolean }) {
  const isActive = cam.status === 'ONLINE' && !cam.privacyMode;

  return (
    <View style={[styles.roomRow, !isLast && styles.roomRowDivider]}>
      <Text style={styles.roomLabel}>{cam.label}</Text>
      <Text style={styles.roomStatus}>{isActive ? 'Đang bật' : 'Đã tắt'}</Text>
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
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
  },
  statusIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconDot: { width: 14, height: 14, borderRadius: 7 },
  statusTitle: { fontSize: Typography.h2.fontSize, fontWeight: '700', color: Colors.textPrimary },
  statusSubtitle: {
    marginTop: 4,
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mainToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  mainToggleIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 26, 46, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mainToggleText: {
    color: Colors.textPrimary,
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  roomListCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  roomRowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  roomLabel: { fontSize: Typography.body.fontSize, color: Colors.textPrimary },
  roomStatus: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Colors.textPrimary },
});
