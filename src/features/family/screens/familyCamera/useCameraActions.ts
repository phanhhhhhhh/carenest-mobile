import { useState } from 'react';
import { Alert } from '../../../../shared/utils/crossPlatformAlert';
import { useCameraStore } from '../../store/cameraStore';
import { validateCameraLinkInput } from '../../services/cameraLinking';

/**
 * All the imperative camera interactions (bind/unbind, live view, snapshot, voice,
 * privacy, motion, PTZ) plus the local modal state they drive. Kept out of the
 * screen so it stays a thin render layer.
 */
export function useCameraActions(
  elderlyId: string | null,
  linkAccess: { allowed: boolean; reason: string | null },
) {
  const bindCamera = useCameraStore((s) => s.bindCamera);
  const unbindCamera = useCameraStore((s) => s.unbindCamera);
  const captureSosSnapshot = useCameraStore((s) => s.captureSosSnapshot);
  const startVoiceCall = useCameraStore((s) => s.startVoiceCall);
  const stopVoiceCall = useCameraStore((s) => s.stopVoiceCall);
  const setPrivacyMode = useCameraStore((s) => s.setPrivacyMode);
  const toggleMotionDetection = useCameraStore((s) => s.toggleMotionDetection);
  const controlPtz = useCameraStore((s) => s.controlPtz);
  const load = useCameraStore((s) => s.load);
  const isProcessing = useCameraStore((s) => s.isProcessing);
  const linkError = useCameraStore((s) => s.linkError);
  const clearLinkError = useCameraStore((s) => s.clearLinkError);

  const [refreshing, setRefreshing] = useState(false);

  const [bindVisible, setBindVisible] = useState(false);
  const [snValue, setSnValue] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [unbindTarget, setUnbindTarget] = useState<number | null>(null);
  const [menuDeviceId, setMenuDeviceId] = useState<number | null>(null);
  const [ptzDeviceId, setPtzDeviceId] = useState<number | null>(null);

  const showBindDialog = () => {
    if (!elderlyId) return;
    if (!linkAccess.allowed) {
      Alert.alert('Chưa thể liên kết camera', linkAccess.reason ?? undefined);
      return;
    }
    setSnValue('');
    setLabelValue('');
    setVerificationCode('');
    setValidationError(null);
    clearLinkError();
    setBindVisible(true);
  };

  const confirmBind = async () => {
    if (!elderlyId || isProcessing) return;
    const error = validateCameraLinkInput({
      deviceSn: snValue,
      label: labelValue,
      verificationCode,
    });
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    clearLinkError();
    const result = await bindCamera(elderlyId, snValue, labelValue, verificationCode);
    if (result.ok) {
      setBindVisible(false);
      setSnValue('');
      setLabelValue('');
      setVerificationCode('');
      Alert.alert('Đã liên kết camera', 'Camera đã được thêm và trạng thái mới nhất đã được tải.');
    }
  };

  const cancelBind = () => {
    if (isProcessing) return;
    setBindVisible(false);
    setValidationError(null);
    clearLinkError();
  };

  const changeSn = (value: string) => {
    setSnValue(value);
    setValidationError(null);
    clearLinkError();
  };

  const changeLabel = (value: string) => {
    setLabelValue(value);
    setValidationError(null);
    clearLinkError();
  };

  const changeVerificationCode = (value: string) => {
    setVerificationCode(value);
    setValidationError(null);
    clearLinkError();
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
    verificationCode,
    bindError: validationError ?? linkError?.message ?? null,
    isBinding: isProcessing,
    unbindTarget,
    menuDeviceId,
    ptzDeviceId,
    setSnValue: changeSn,
    setLabelValue: changeLabel,
    setVerificationCode: changeVerificationCode,
    setUnbindTarget,
    setMenuDeviceId,
    setPtzDeviceId,
    showBindDialog,
    confirmBind,
    cancelBind,
    doUnbind,
    handleSnapshot,
    handleVoiceToggle,
    handlePrivacyToggle,
    handleMotionToggle,
    sendPtz,
    closePtz,
    onRefreshDevices,
  };
}
