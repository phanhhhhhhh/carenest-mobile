import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useCameraStore } from '../store/cameraStore';
import { useCameraConsentStore } from '../store/cameraConsentStore';
import { getCameraLinkAvailability } from '../services/cameraLinking';
import { LiveHero } from './familyCamera/LiveHero';
import { Timeline } from './familyCamera/Timeline';
import { CameraList } from './familyCamera/CameraList';
import {
  BindCameraModal,
  ConfirmUnbindModal,
  CameraMenuModal,
} from './familyCamera/CameraModals';
import { CameraAppBar, CameraStatusBar, CameraTabBar } from './familyCamera/chrome';
import { useCameraActions } from './familyCamera/useCameraActions';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

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
  const load = useCameraStore((s) => s.load);
  const consent = useCameraConsentStore((s) => (elderlyId ? s.byElderly[elderlyId] : undefined));
  const consentLoading = useCameraConsentStore((s) => s.isLoading);
  const consentError = useCameraConsentStore((s) => s.error);
  const loadConsent = useCameraConsentStore((s) => s.load);

  const [tab, setTab] = useState<0 | 1>(0);

  const linkAvailability = getCameraLinkAvailability(consent, consentLoading);
  const linkReason = consentError ?? linkAvailability.reason;
  const actions = useCameraActions(elderlyId, {
    allowed: linkAvailability.allowed,
    reason: linkReason,
  });

  useMountEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
  });

  useEffect(() => {
    if (elderlyId) {
      load(elderlyId);
      loadConsent(elderlyId);
    }
  }, [elderlyId, load, loadConsent]);

  const renderError = () => (
    <View style={styles.center}>
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
        <View style={{ height: 12 }} />
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
        <CameraAppBar elderlyName={elderlyName} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="people-outline" size={56} color="#94A3B8" />
          <View style={{ height: 16 }} />
          <Text style={styles.emptyText}>Chưa liên kết người thân nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  const menuCam = cameras.find((c) => c.id === actions.menuDeviceId) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CameraAppBar
        elderlyName={elderlyName}
        onBack={() => navigation.goBack()}
        onAddCamera={actions.showBindDialog}
        addCameraDisabled={!linkAvailability.allowed}
      />

      {isLoading && cameras.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách camera...</Text>
        </View>
      ) : error && cameras.length === 0 ? (
        renderError()
      ) : (
        <>
          <CameraStatusBar status={status} />
          {!linkAvailability.allowed && linkReason && (
            <View style={styles.consentNotice}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#92400E" />
              <Text style={styles.consentNoticeText}>{linkReason}</Text>
            </View>
          )}
          {cameras.length > 0 && (
            <LiveHero
              cam={cameras[0]}
              onLiveView={() => navigation.navigate('FamilyLiveCamera', {
                cameraId: cameras[0].id,
                label: cameras[0].label,
                elderlyId,
              })}
            />
          )}
          <CameraTabBar
            tab={tab}
            checkCount={timeline.length}
            deviceCount={cameras.length}
            onSelect={setTab}
          />
          <View style={{ flex: 1 }}>
            {tab === 0 ? (
              <Timeline timeline={timeline} />
            ) : (
              <CameraList
                cameras={cameras}
                refreshing={actions.refreshing}
                onRefresh={actions.onRefreshDevices}
                onBind={actions.showBindDialog}
                linkDisabled={!linkAvailability.allowed}
                linkDisabledReason={linkReason}
                onLiveView={(cameraId) => {
                  const camera = cameras.find((item) => item.id === cameraId);
                  navigation.navigate('FamilyLiveCamera', {
                    cameraId,
                    label: camera?.label ?? 'Camera',
                    elderlyId,
                  });
                }}
                onPrivacyToggle={actions.handlePrivacyToggle}
                onMotionToggle={actions.handleMotionToggle}
                onMenu={actions.setMenuDeviceId}
              />
            )}
          </View>
        </>
      )}

      <BindCameraModal
        visible={actions.bindVisible}
        sn={actions.snValue}
        label={actions.labelValue}
        verificationCode={actions.verificationCode}
        onChangeSn={actions.setSnValue}
        onChangeLabel={actions.setLabelValue}
        onChangeVerificationCode={actions.setVerificationCode}
        onConfirm={actions.confirmBind}
        onCancel={actions.cancelBind}
        error={actions.bindError}
        submitting={actions.isBinding}
      />

      <ConfirmUnbindModal
        visible={actions.unbindTarget != null}
        onConfirm={actions.doUnbind}
        onCancel={() => actions.setUnbindTarget(null)}
      />

      <CameraMenuModal
        visible={actions.menuDeviceId != null}
        onClose={() => actions.setMenuDeviceId(null)}
        onTogglePrivacy={() => {
          if (menuCam) {
            actions.handlePrivacyToggle(menuCam.id, menuCam.privacyMode);
            actions.setMenuDeviceId(null);
          }
        }}
        onDelete={() => {
          if (menuCam) {
            actions.setUnbindTarget(menuCam.id);
            actions.setMenuDeviceId(null);
          }
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#0F172A', fontSize: 16.5, fontWeight: '700', textAlign: 'center' },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
  consentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
  },
  consentNoticeText: { flex: 1, color: '#92400E', fontSize: 13, lineHeight: 18 },
});
