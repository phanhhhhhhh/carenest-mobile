import React, { useState } from 'react';
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
import { Colors } from '../../../core/theme';
import { Shadows } from '../../../core/theme/spacing';
import { getUserId } from '../../../core/storage/secureStorage';
import { useCameraStore, type CameraDeviceData } from '../../family/store/cameraStore';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function ElderlyCameraScreen() {
  const [elderlyId, setElderlyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isLoading = useCameraStore((s) => s.isLoading);
  const cameras = useCameraStore((s) => s.cameras);
  const load = useCameraStore((s) => s.load);
  const setPrivacyMode = useCameraStore((s) => s.setPrivacyMode);

  useMountEffect(() => {
    (async () => {
      const id = await getUserId();
      setElderlyId(id);
      if (id) load(id);
    })();
  });

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
      Alert.alert('Thông báo', 'Không thể thay đổi chế độ riêng tư cho một số camera');
    }
  };

  if (elderlyId === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>Camera trong nhà</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const anyActive = cameras.some((c) => c.status === 'ONLINE' && !c.privacyMode);
  const allPrivate = cameras.length > 0 && cameras.every((c) => c.privacyMode);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Camera giám sát an tâm</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && cameras.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang kiểm tra kết nối camera...</Text>
        </View>
      ) : cameras.length === 0 ? (
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_confused.jpg')}
            style={{ width: 160, height: 160, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Chưa có camera nào được liên kết</Text>
          <Text style={styles.emptySubtitle}>
            Con cháu hoặc người thân của Bác có thể cài đặt camera trong phần Gia đình để quan sát
            và hỗ trợ Bác từ xa.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Main Camera Status Card */}
          <View
            style={[
              styles.statusCard,
              anyActive ? styles.statusCardOnline : styles.statusCardPrivacy,
            ]}
          >
            <View
              style={[
                styles.statusIconRing,
                {
                  backgroundColor: anyActive ? '#DCFCE7' : '#F1F5F9',
                  borderColor: anyActive ? '#86EFAC' : '#CBD5E1',
                },
              ]}
            >
              <Ionicons
                name={anyActive ? 'videocam' : 'videocam-off'}
                size={40}
                color={anyActive ? '#15803D' : '#64748B'}
              />
            </View>

            <View style={{ height: 16 }} />

            <View
              style={[styles.statusPill, { backgroundColor: anyActive ? '#DCFCE7' : '#F1F5F9' }]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: anyActive ? '#16A34A' : '#64748B' }]}
              />
              <Text style={[styles.statusPillText, { color: anyActive ? '#15803D' : '#475569' }]}>
                {anyActive ? 'CAMERA ĐANG HOẠT ĐỘNG' : 'CHẾ ĐỘ RIÊNG TƯ ĐANG BẬT'}
              </Text>
            </View>

            <Text style={styles.statusTitle}>
              {anyActive ? 'Con cháu đang quan sát an toàn' : 'Camera đã tạm dừng quan sát'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {anyActive
                ? 'Camera giúp người thân kịp thời hỗ trợ khi Bác cần trợ giúp hoặc té ngã.'
                : 'Không ai có thể nhìn thấy hình ảnh lúc này. Bác hoàn toàn có không gian riêng tư.'}
            </Text>
          </View>

          <View style={{ height: 18 }} />

          {/* Large Toggle Privacy Button */}
          <TouchableOpacity
            style={[styles.mainToggleButton, allPrivate ? styles.btnTurnOn : styles.btnTurnOff]}
            onPress={() => togglePrivacyForAll(!allPrivate)}
            activeOpacity={0.88}
          >
            <Ionicons name={allPrivate ? 'videocam' : 'eye-off'} size={22} color="#FFFFFF" />
            <Text style={styles.mainToggleText}>
              {allPrivate ? 'BẬT LẠI CAMERA GIÁM SÁT' : 'BẬT CHẾ ĐỘ RIÊNG TƯ (TẮT CAMERA)'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 8 }} />
          <Text style={styles.hintText}>💡 Bác có thể bật/tắt camera bất cứ lúc nào Bác muốn.</Text>

          <View style={{ height: 24 }} />

          {/* List of Cameras by Room */}
          <Text style={styles.sectionTitle}>Các vị trí camera trong nhà ({cameras.length})</Text>
          <View style={{ height: 12 }} />

          <View style={styles.roomListCard}>
            {cameras.map((cam, index) => (
              <RoomRow key={cam.id} cam={cam} isLast={index === cameras.length - 1} />
            ))}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RoomRow({ cam, isLast }: { cam: CameraDeviceData; isLast: boolean }) {
  const isActive = cam.status === 'ONLINE' && !cam.privacyMode;

  return (
    <View style={[styles.roomRow, !isLast && styles.roomRowDivider]}>
      <View style={styles.roomIconWrap}>
        <Ionicons name="home-outline" size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.roomLabel}>{cam.label || 'Khu vực trong nhà'}</Text>
        <Text style={styles.roomSub}>Trạng thái thiết bị</Text>
      </View>
      <View style={[styles.roomStatusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' }]}>
        <Ionicons
          name={isActive ? 'checkmark-circle' : 'close-circle'}
          size={14}
          color={isActive ? '#15803D' : '#64748B'}
        />
        <Text style={[styles.roomStatusText, { color: isActive ? '#15803D' : '#475569' }]}>
          {isActive ? 'Đang bật' : 'Đã tắt'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appBarTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14.5, color: '#64748B', fontWeight: '500' },
  emptyTitle: { color: '#0F172A', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 21,
  },
  scroll: { padding: 20 },

  statusCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    ...Shadows.md,
  },
  statusCardOnline: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  statusCardPrivacy: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  statusIconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statusSubtitle: {
    marginTop: 6,
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  mainToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 9999,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnTurnOn: {
    backgroundColor: Colors.primary,
  },
  btnTurnOff: {
    backgroundColor: '#475569',
  },
  mainToggleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  hintText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  roomListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    ...Shadows.sm,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  roomRowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  roomIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  roomSub: { fontSize: 12.5, color: '#64748B', marginTop: 1 },
  roomStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  roomStatusText: { fontSize: 13, fontWeight: '700' },
});
