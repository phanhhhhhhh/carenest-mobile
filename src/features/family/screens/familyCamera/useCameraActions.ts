import { useState } from 'react';
import { Linking } from 'react-native';
import { Alert } from '../../../../shared/utils/crossPlatformAlert';
import { useCameraStore } from '../../store/cameraStore';

/**
 * All the imperative camera interactions (bind/unbind, live view, snapshot, voice,
 * privacy, motion, PTZ) plus the local modal state they drive. Kept out of the
 * screen so it stays a thin render layer.
 */
export function useCameraActions(elderlyId: string | null) {
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
  const load = useCameraStore((s) => s.load);

  const [refreshing, setRefreshing] = useState(false);

  const [bindVisible, setBindVisible] = useState(false);
  const [snValue, setSnValue] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const [unbindTarget, setUnbindTarget] = useState<number | null>(null);
  const [menuDeviceId, setMenuDeviceId] = useState<number | null>(null);
  const [ptzDeviceId, setPtzDeviceId] = useState<number | null>(null);

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

  return {
    refreshing,
    bindVisible,
    snValue,
    labelValue,
    unbindTarget,
    menuDeviceId,
    ptzDeviceId,
    setSnValue,
    setLabelValue,
    setBindVisible,
    setUnbindTarget,
    setMenuDeviceId,
    setPtzDeviceId,
    showBindDialog,
    confirmBind,
    doUnbind,
    handleLiveView,
    handleSnapshot,
    handleVoiceToggle,
    handlePrivacyToggle,
    handleMotionToggle,
    sendPtz,
    closePtz,
    onRefreshDevices,
  };
}
