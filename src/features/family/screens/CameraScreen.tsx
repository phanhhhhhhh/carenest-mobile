import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useCameraStore } from '../store/cameraStore';
import { LiveHero } from './familyCamera/LiveHero';
import { Timeline } from './familyCamera/Timeline';
import { CameraList } from './familyCamera/CameraList';
import {
  BindCameraModal,
  ConfirmUnbindModal,
  CameraMenuModal,
  PtzControlModal,
} from './familyCamera/CameraModals';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const navigation = useNavigation<Nav>();

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyId = useFamilyDashboardStore((s) => s.elderlyId());
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName()) ?? 'Người thân';

  const isLoading = useCameraStore((s) => s.isLoading);
  const error = useCameraStore((s) => s.error);
  const status = useCameraStore((s) => s.status);
  const cameras = useCameraStore((s) => s.cameras);
  const timeline = useCameraStore((s) => s.timeline);
  const voiceActive = useCameraStore((s) => s.voiceActive);

  const load = useCameraStore((s) => s.load);
  const bindCamera = useCameraStore((s) => s.bindCamera);
  const unbindCamera = useCameraStore((s) => s.unbindCamera);
  const getLiveStream = useCameraStore((s) => s.getLiveStream);
  const captureSosSnapshot = useCameraStore((s) => s.captureSosSnapshot);
  const startVoiceCall = useCameraStore((s) => s.startVoiceCall);
  const stopVoiceCall = useCameraStore((s) => s.stopVoiceCall);
  const setPrivacyMode = useCameraStore((s) => s.setPrivacyMode);
  const toggleMotionDetection = useCameraStore((s) => s.toggleMotionDetection);
  const controlPtz = useCameraStore((s) => s.controlPtz);
  const clearLiveStream = useCameraStore((s) => s.clearLiveStream);

  const [tab, setTab] = useState<0 | 1>(0);
  const [refreshing, setRefreshing] = useState(false);

  const [bindVisible, setBindVisible] = useState(false);
  const [snValue, setSnValue] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const [unbindTarget, setUnbindTarget] = useState<number | null>(null);
  const [menuDeviceId, setMenuDeviceId] = useState<number | null>(null);
  const [ptzDeviceId, setPtzDeviceId] = useState<number | null>(null);

  useEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
    // Load the dashboard once on mount if it isn't already populated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (elderlyId) {
      load(elderlyId);
    }
    // Re-run when the selected elderly changes; `load` is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId]);

  const showBindDialog = () => {
    if (!elderlyId) return;
    setSnValue('');
    setLabelValue('');
    setBindVisible(true);
  };

  const confirmBind = async () => {
    if (!elderlyId) return;
    const sn = snValue.trim();
    if (!sn) return;
    setBindVisible(false);
    const ok = await bindCamera(
      elderlyId,
      sn,
      labelValue.trim().length > 0 ? labelValue.trim() : 'Camera',
    );
    if (!ok) {
      Alert.alert('', 'Không thể liên kết camera. Vui lòng kiểm tra lại số seri.');
    }
  };

  const doUnbind = async () => {
    if (!elderlyId || unbindTarget == null) return;
    const id = unbindTarget;
    setUnbindTarget(null);
    const ok = await unbindCamera(elderlyId, id);
    if (!ok) {
      Alert.alert('', 'Không thể xóa camera lúc này');
    }
  };

  const handleLiveView = async (deviceId: number) => {
    if (!elderlyId) return;
    const url = await getLiveStream(deviceId);
    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('', `Đường dẫn xem trực tiếp: ${url}`);
        }
      } catch {
        Alert.alert('', `Đường dẫn xem trực tiếp: ${url}`);
      }
    } else {
      Alert.alert('', 'Không có luồng xem trực tiếp');
    }
    clearLiveStream();
  };

  const handleSnapshot = async () => {
    if (!elderlyId) return;
    const url = await captureSosSnapshot(elderlyId);
    Alert.alert('', url ? 'Đã chụp ảnh thành công!' : 'Không có camera nào để chụp ảnh');
  };

  const handleVoiceToggle = async (deviceId: number, currentlyActive: boolean) => {
    const ok = currentlyActive ? await stopVoiceCall(deviceId) : await startVoiceCall(deviceId);
    Alert.alert(
      '',
      ok
        ? currentlyActive
          ? 'Đã kết thúc cuộc gọi thoại'
          : 'Đã bắt đầu cuộc gọi thoại'
        : 'Không thể thay đổi trạng thái gọi thoại',
    );
  };

  const handlePrivacyToggle = async (deviceId: number, currentlyEnabled: boolean) => {
    if (!elderlyId) return;
    const ok = await setPrivacyMode(elderlyId, deviceId, !currentlyEnabled);
    Alert.alert(
      '',
      ok
        ? `Chế độ riêng tư ${!currentlyEnabled ? 'BẬT' : 'TẮT'}`
        : 'Không thể thay đổi chế độ riêng tư',
    );
  };

  const handleMotionToggle = async (deviceId: number, enabled: boolean) => {
    if (!elderlyId) return;
    const ok = await toggleMotionDetection(elderlyId, deviceId, enabled);
    Alert.alert(
      '',
      ok
        ? `Phát hiện chuyển động ${enabled ? 'BẬT' : 'TẮT'}`
        : 'Không thể cập nhật phát hiện chuyển động',
    );
  };

  const sendPtz = async (direction: string) => {
    if (ptzDeviceId == null) return;
    const ok = await controlPtz(ptzDeviceId, direction);
    if (!ok) {
      Alert.alert('', 'Không thể xoay camera lúc này');
    }
  };

  const closePtz = () => {
    sendPtz('STOP');
    setPtzDeviceId(null);
  };

  const onRefreshDevices = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  const renderAppBar = () => (
    <View style={styles.appBar}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.appBarTitle} numberOfLines={1}>
        Camera — {elderlyName}
      </Text>
      <View style={styles.backBtn} />
    </View>
  );

  const renderStatusBar = () => {
    const indicatorColor =
      status.indicatorColor === 'GREEN'
        ? Colors.success
        : status.indicatorColor === 'RED'
          ? Colors.error
          : Colors.textHint;

    return (
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: indicatorColor }]} />
        <Text style={styles.statusText} numberOfLines={1}>
          {status.hasCamera ? status.statusText : 'Chưa liên kết camera nào'}
        </Text>
        {status.hasCamera && <Text style={styles.statusCount}>{status.cameraCount} camera</Text>}
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity style={styles.tabItem} onPress={() => setTab(0)}>
        <Text style={[styles.tabLabel, tab === 0 && styles.tabLabelActive]}>
          {`Kiểm tra (${timeline.length})`}
        </Text>
        <View style={[styles.tabIndicator, tab === 0 && styles.tabIndicatorActive]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => setTab(1)}>
        <Text style={[styles.tabLabel, tab === 1 && styles.tabLabelActive]}>
          {`Thiết bị (${cameras.length})`}
        </Text>
        <View style={[styles.tabIndicator, tab === 1 && styles.tabIndicatorActive]} />
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.center}>
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <View style={{ height: 16 }} />
        <Text style={styles.errorText}>{error}</Text>
        <View style={{ height: 16 }} />
        <TouchableOpacity style={styles.retryBtn} onPress={() => elderlyId && load(elderlyId)}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!elderlyId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderAppBar()}
        <View style={styles.center}>
          <Ionicons name="people-outline" size={56} color={Colors.textHint} />
          <View style={{ height: 16 }} />
          <Text style={styles.emptyText}>Chưa liên kết người thân nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  const menuCam = cameras.find((c) => c.id === menuDeviceId) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderAppBar()}

      {isLoading && cameras.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error && cameras.length === 0 ? (
        renderError()
      ) : (
        <>
          {renderStatusBar()}
          {cameras.length > 0 && (
            <LiveHero
              cam={cameras[0]}
              voiceActive={voiceActive}
              onSnapshot={handleSnapshot}
              onVoiceToggle={() => handleVoiceToggle(cameras[0].id, voiceActive)}
              onOpenPtz={() => setPtzDeviceId(cameras[0].id)}
            />
          )}
          {renderTabBar()}
          <View style={{ flex: 1 }}>
            {tab === 0 ? (
              <Timeline timeline={timeline} />
            ) : (
              <CameraList
                cameras={cameras}
                voiceActive={voiceActive}
                refreshing={refreshing}
                onRefresh={onRefreshDevices}
                onBind={showBindDialog}
                onLiveView={handleLiveView}
                onSnapshot={handleSnapshot}
                onVoiceToggle={(id) => handleVoiceToggle(id, voiceActive)}
                onPrivacyToggle={handlePrivacyToggle}
                onMotionToggle={handleMotionToggle}
                onMenu={setMenuDeviceId}
              />
            )}
          </View>
        </>
      )}

      <BindCameraModal
        visible={bindVisible}
        sn={snValue}
        label={labelValue}
        onChangeSn={setSnValue}
        onChangeLabel={setLabelValue}
        onCancel={() => setBindVisible(false)}
        onConfirm={confirmBind}
      />

      <ConfirmUnbindModal
        visible={unbindTarget != null}
        onCancel={() => setUnbindTarget(null)}
        onConfirm={doUnbind}
      />

      <CameraMenuModal
        visible={menuCam != null}
        onClose={() => setMenuDeviceId(null)}
        onTogglePrivacy={() => {
          const cam = menuCam;
          setMenuDeviceId(null);
          if (cam) handlePrivacyToggle(cam.id, cam.privacyMode);
        }}
        onDelete={() => {
          const id = menuDeviceId;
          setMenuDeviceId(null);
          if (id != null) setUnbindTarget(id);
        }}
      />

      <PtzControlModal visible={ptzDeviceId != null} onClose={closePtz} onMove={sendPtz} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  statusCount: { color: Colors.textSecondary, fontSize: 12 },

  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 14, fontWeight: '600', color: Colors.textHint },
  tabLabelActive: { color: Colors.primary },
  tabIndicator: {
    height: 2,
    width: '60%',
    marginTop: 8,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  tabIndicatorActive: { backgroundColor: Colors.primary },
});
