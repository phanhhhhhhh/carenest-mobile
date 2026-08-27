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
  TextInput,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import {
  useCameraStore,
  isCameraOnline,
  type CameraDeviceData,
  type CameraSnapshotData,
} from '../store/cameraStore';

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
  }, []);

  useEffect(() => {
    if (elderlyId) {
      load(elderlyId);
    }
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

  const confirmUnbindDialog = (deviceId: number) => setUnbindTarget(deviceId);

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

  const openPtz = (deviceId: number) => setPtzDeviceId(deviceId);

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

  const triggerLabel = (trigger: string): string => {
    switch (trigger) {
      case 'SOS':
        return 'Ảnh chụp khẩn cấp SOS';
      case 'CHECK_IN':
        return 'Kiểm tra định kỳ';
      case 'MOTION':
        return 'Phát hiện chuyển động';
      default:
        return 'Ảnh chụp';
    }
  };

  const triggerIcon = (trigger: string): keyof typeof Ionicons.glyphMap => {
    switch (trigger) {
      case 'SOS':
        return 'warning-outline';
      case 'CHECK_IN':
        return 'time-outline';
      case 'MOTION':
        return 'walk-outline';
      default:
        return 'camera';
    }
  };

  const triggerColor = (trigger: string): string => {
    switch (trigger) {
      case 'SOS':
        return Colors.sosPrimary;
      case 'CHECK_IN':
        return Colors.primary;
      case 'MOTION':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const formatTime = (iso: string): string => {
    const dt = new Date(iso);
    const diffMs = Date.now() - dt.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffHours < 1) return `${diffMinutes} phút trước`;
    const pad = (n: number) => String(n).padStart(2, '0');
    const isSameDay = dt.toDateString() === new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dt.toDateString() === yesterday.toDateString();
    if (isSameDay) return `Hôm nay ${dt.getHours()}:${pad(dt.getMinutes())}`;
    if (isYesterday) return `Hôm qua ${dt.getHours()}:${pad(dt.getMinutes())}`;
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
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

  const renderLiveHero = (cam: CameraDeviceData) => {
    const online = isCameraOnline(cam);
    const heroIcon: keyof typeof Ionicons.glyphMap = cam.privacyMode
      ? 'eye-off'
      : online
        ? 'play-circle'
        : 'videocam-off';

    return (
      <View style={styles.heroCard}>
        <View style={styles.heroVideoWrap}>
          {}
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
            onPress={handleSnapshot}
            style={{ flex: 1 }}
          />
          <View style={{ width: 8 }} />
          <ActionBtn
            icon={voiceActive ? 'mic-off' : 'mic'}
            label={voiceActive ? 'Kết thúc' : 'Gọi thoại'}
            color={voiceActive ? Colors.error : Colors.warning}
            onPress={() => handleVoiceToggle(cam.id, voiceActive)}
            style={{ flex: 1 }}
          />
          <View style={{ width: 8 }} />
          <ActionBtn
            icon="sync-outline"
            label="Xoay"
            color={Colors.textSecondary}
            onPress={() => openPtz(cam.id)}
            style={{ flex: 1 }}
          />
        </View>
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

  const renderTimeline = () => {
    if (timeline.length === 0) {
      return (
        <View style={styles.center}>
          <Ionicons name="images-outline" size={56} color={Colors.textHint} />
          <View style={{ height: 12 }} />
          <Text style={styles.emptyText}>Chưa có lịch sử kiểm tra</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listPad}>
        {timeline.map((snap: CameraSnapshotData) => (
          <View key={snap.id} style={styles.timelineCard}>
            <View
              style={[
                styles.timelineIconWrap,
                { backgroundColor: `${triggerColor(snap.trigger)}1A` },
              ]}
            >
              <Ionicons
                name={triggerIcon(snap.trigger)}
                size={22}
                color={triggerColor(snap.trigger)}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineTitle}>{triggerLabel(snap.trigger)}</Text>
              <View style={{ height: 2 }} />
              <Text style={styles.timelineTime}>{formatTime(snap.createdAt)}</Text>
            </View>
            {snap.imageUrl.length > 0 ? (
              <Image source={{ uri: snap.imageUrl }} style={styles.timelineThumb} />
            ) : null}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderCameraList = () => {
    if (cameras.length === 0) {
      return (
        <ScrollView contentContainerStyle={styles.listPad}>
          <View style={styles.emptyDevicesWrap}>
            <Image
              source={require('../../../../assets/mascot/mascot_confused.jpg')}
              style={{ width: 160, height: 160 }}
              resizeMode="contain"
            />
            <View style={{ height: 4 }} />
            <Text style={styles.emptyDevicesTitle}>Chưa liên kết camera nào</Text>
            <View style={{ height: 6 }} />
            <Text style={styles.emptyDevicesSubtitle}>
              Liên kết camera Imou để bắt đầu giám sát
            </Text>
            <View style={{ height: 24 }} />
            <TouchableOpacity style={styles.linkBtn} onPress={showBindDialog}>
              <Ionicons name="link-outline" size={18} color="#FFFFFF" />
              <Text style={styles.linkBtnText}>Liên kết camera</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.listPad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshDevices}
            colors={[Colors.primary]}
          />
        }
      >
        {cameras.map((cam) => (
          <CameraCard
            key={cam.id}
            cam={cam}
            voiceActive={voiceActive}
            onLiveView={() => handleLiveView(cam.id)}
            onSnapshot={handleSnapshot}
            onVoiceToggle={() => handleVoiceToggle(cam.id, voiceActive)}
            onPrivacyToggle={() => handlePrivacyToggle(cam.id, cam.privacyMode)}
            onMotionToggle={(v) => handleMotionToggle(cam.id, v)}
            onMenu={() => setMenuDeviceId(cam.id)}
          />
        ))}
        <TouchableOpacity style={styles.linkAnotherBtn} onPress={showBindDialog}>
          <Ionicons name="link-outline" size={18} color={Colors.primary} />
          <Text style={styles.linkAnotherBtnText}>Liên kết camera khác</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

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
          {cameras.length > 0 && renderLiveHero(cameras[0])}
          {renderTabBar()}
          <View style={{ flex: 1 }}>{tab === 0 ? renderTimeline() : renderCameraList()}</View>
        </>
      )}

      <Modal
        visible={bindVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBindVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Liên kết camera</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.dialogBody}>Nhập số seri camera (SN thiết bị) và một nhãn.</Text>
            <View style={{ height: 16 }} />
            <View style={styles.inputWrap}>
              <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Số seri thiết bị (VD: 5L0A1B2C3D4E5F6G)"
                placeholderTextColor={Colors.textHint}
                value={snValue}
                onChangeText={setSnValue}
              />
            </View>
            <View style={{ height: 12 }} />
            <View style={styles.inputWrap}>
              <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Nhãn (tùy chọn) (VD: Phòng khách)"
                placeholderTextColor={Colors.textHint}
                value={labelValue}
                onChangeText={setLabelValue}
              />
            </View>
            <View style={{ height: 20 }} />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setBindVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Hủy</Text>
              </TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity style={styles.dialogApplyBtn} onPress={confirmBind}>
                <Text style={styles.dialogApplyText}>Liên kết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={unbindTarget != null}
        transparent
        animationType="fade"
        onRequestClose={() => setUnbindTarget(null)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Xóa camera?</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.dialogBody}>
              Thao tác này sẽ ngắt kết nối camera khỏi tài khoản.
            </Text>
            <View style={{ height: 20 }} />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setUnbindTarget(null)}
              >
                <Text style={styles.dialogCancelText}>Hủy</Text>
              </TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity
                style={[styles.dialogApplyBtn, { backgroundColor: Colors.error }]}
                onPress={doUnbind}
              >
                <Text style={styles.dialogApplyText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={menuCam != null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuDeviceId(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuDeviceId(null)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const cam = menuCam;
                setMenuDeviceId(null);
                if (cam) handlePrivacyToggle(cam.id, cam.privacyMode);
              }}
            >
              <Ionicons name="eye-off-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>Bật/tắt chế độ riêng tư</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const id = menuDeviceId;
                setMenuDeviceId(null);
                if (id != null) confirmUnbindDialog(id);
              }}
            >
              <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
              <Text style={[styles.menuItemText, { color: Colors.error }]}>Xóa camera</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={ptzDeviceId != null}
        transparent
        animationType="slide"
        onRequestClose={closePtz}
      >
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closePtz}>
          <TouchableOpacity activeOpacity={1} style={styles.ptzSheet}>
            <Text style={styles.ptzTitle}>Xoay camera</Text>
            <View style={{ height: 20 }} />
            <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => sendPtz('UP')}>
              <Ionicons name="chevron-up" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.ptzMiddleRow}>
              <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => sendPtz('LEFT')}>
                <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ width: 40 }} />
              <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => sendPtz('RIGHT')}>
                <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => sendPtz('DOWN')}>
              <Ionicons name="chevron-down" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ height: 12 }} />
            <TouchableOpacity onPress={closePtz}>
              <Text style={styles.ptzCloseText}>Đóng</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onPress,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { backgroundColor: `${color}0F`, borderColor: `${color}33` },
        style,
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={color} />
      <View style={{ width: 6 }} />
      <Text style={[styles.actionBtnText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CameraCard({
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

  listPad: { padding: 16 },

  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  timelineIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTitle: { fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  timelineTime: { color: Colors.textSecondary, fontSize: 12 },
  timelineThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.background },

  emptyDevicesWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyDevicesTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptyDevicesSubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  linkBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  linkAnotherBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  linkAnotherBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

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

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  dialogBody: { color: Colors.textSecondary, fontSize: 13 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  dialogCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  dialogCancelText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  dialogApplyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dialogApplyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'flex-end',
    padding: 24,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 190,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: { fontSize: 14, color: Colors.textPrimary },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  ptzSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ptzTitle: { fontWeight: '700', fontSize: 16, color: Colors.textPrimary },
  ptzMiddleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ptzArrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(46,125,154,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  ptzCloseText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
});
