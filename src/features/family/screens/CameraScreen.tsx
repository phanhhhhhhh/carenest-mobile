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
import { LiveHero } from './familyCamera/LiveHero';
import { Timeline } from './familyCamera/Timeline';
import { CameraList } from './familyCamera/CameraList';
import {
  BindCameraModal,
  ConfirmUnbindModal,
  CameraMenuModal,
  PtzControlModal,
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
  const voiceActive = useCameraStore((s) => s.voiceActive);
  const load = useCameraStore((s) => s.load);

  const [tab, setTab] = useState<0 | 1>(0);

  const actions = useCameraActions(elderlyId);

  useMountEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
  });

  useEffect(() => {
    if (elderlyId) {
      load(elderlyId);
    }
  }, [elderlyId, load]);

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
        <CameraAppBar elderlyName={elderlyName} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="people-outline" size={56} color={Colors.textHint} />
          <View style={{ height: 16 }} />
          <Text style={styles.emptyText}>Chưa liên kết người thân nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  const menuCam = cameras.find((c) => c.id === actions.menuDeviceId) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <CameraAppBar elderlyName={elderlyName} onBack={() => navigation.goBack()} />

      {isLoading && cameras.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error && cameras.length === 0 ? (
        renderError()
      ) : (
        <>
          <CameraStatusBar status={status} />
          {cameras.length > 0 && (
            <LiveHero
              cam={cameras[0]}
              voiceActive={voiceActive}
              onSnapshot={actions.handleSnapshot}
              onVoiceToggle={() => actions.handleVoiceToggle(cameras[0].id, voiceActive)}
              onOpenPtz={() => actions.setPtzDeviceId(cameras[0].id)}
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
                voiceActive={voiceActive}
                refreshing={actions.refreshing}
                onRefresh={actions.onRefreshDevices}
                onBind={actions.showBindDialog}
                onLiveView={actions.handleLiveView}
                onSnapshot={actions.handleSnapshot}
                onVoiceToggle={(id) => actions.handleVoiceToggle(id, voiceActive)}
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
        onChangeSn={actions.setSnValue}
        onChangeLabel={actions.setLabelValue}
        onCancel={() => actions.setBindVisible(false)}
        onConfirm={actions.confirmBind}
      />

      <ConfirmUnbindModal
        visible={actions.unbindTarget != null}
        onCancel={() => actions.setUnbindTarget(null)}
        onConfirm={actions.doUnbind}
      />

      <CameraMenuModal
        visible={menuCam != null}
        onClose={() => actions.setMenuDeviceId(null)}
        onTogglePrivacy={() => {
          const cam = menuCam;
          actions.setMenuDeviceId(null);
          if (cam) actions.handlePrivacyToggle(cam.id, cam.privacyMode);
        }}
        onDelete={() => {
          const id = actions.menuDeviceId;
          actions.setMenuDeviceId(null);
          if (id != null) actions.setUnbindTarget(id);
        }}
      />

      <PtzControlModal
        visible={actions.ptzDeviceId != null}
        onClose={actions.closePtz}
        onMove={actions.sendPtz}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
});
