import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { CameraDeviceData } from '../../store/cameraStore';
import { CameraCard } from './CameraCard';

interface Props {
  cameras: CameraDeviceData[];
  refreshing: boolean;
  onRefresh: () => void;
  onBind: () => void;
  linkDisabled: boolean;
  linkDisabledReason: string | null;
  onLiveView: (id: number) => void;
  onPrivacyToggle: (id: number, current: boolean) => void;
  onMotionToggle: (id: number, v: boolean) => void;
  onMenu: (id: number) => void;
}

export function CameraList({
  cameras,
  refreshing,
  onRefresh,
  onBind,
  linkDisabled,
  linkDisabledReason,
  onLiveView,
  onPrivacyToggle,
  onMotionToggle,
  onMenu,
}: Props) {
  if (cameras.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.listPad}>
        <View style={styles.emptyDevicesWrap}>
          <Image
            source={require('../../../../../assets/mascot/mascot_confused.jpg')}
            style={{ width: 160, height: 160 }}
            resizeMode="contain"
          />
          <View style={{ height: 4 }} />
          <Text style={styles.emptyDevicesTitle}>Chưa liên kết camera nào</Text>
          <View style={{ height: 6 }} />
          <Text style={styles.emptyDevicesSubtitle}>Liên kết camera Imou để bắt đầu giám sát</Text>
          <View style={{ height: 24 }} />
          {linkDisabled && linkDisabledReason && (
            <Text style={styles.linkDisabledReason}>{linkDisabledReason}</Text>
          )}
          <TouchableOpacity
            style={[styles.linkBtn, linkDisabled && styles.disabledBtn]}
            onPress={onBind}
            disabled={linkDisabled}
            accessibilityState={{ disabled: linkDisabled }}
          >
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {cameras.map((cam) => (
        <CameraCard
          key={cam.id}
          cam={cam}
          onLiveView={() => onLiveView(cam.id)}
          onPrivacyToggle={() => onPrivacyToggle(cam.id, cam.privacyMode)}
          onMotionToggle={(v) => onMotionToggle(cam.id, v)}
          onMenu={() => onMenu(cam.id)}
        />
      ))}
      {linkDisabled && linkDisabledReason && (
        <Text style={styles.linkDisabledReason}>{linkDisabledReason}</Text>
      )}
      <TouchableOpacity
        style={[styles.linkAnotherBtn, linkDisabled && styles.disabledBtn]}
        onPress={onBind}
        disabled={linkDisabled}
        accessibilityState={{ disabled: linkDisabled }}
      >
        <Ionicons name="link-outline" size={18} color={Colors.primary} />
        <Text style={styles.linkAnotherBtnText}>Liên kết camera khác</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listPad: { padding: 16 },
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
  linkDisabledReason: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  disabledBtn: { opacity: 0.45 },
});
