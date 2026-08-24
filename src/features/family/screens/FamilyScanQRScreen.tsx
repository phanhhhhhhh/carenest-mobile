import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../../core/theme/colors';
import { redeemInviteToken } from '../../../core/api/inviteApi';
import { useFamilyDashboardStore } from '../store/familyStore';

type ScanState = 'scanning' | 'loading' | 'success' | 'error';

export default function FamilyScanQRScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [message, setMessage] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const scannedRef = useRef(false);

  const refreshDashboard = useFamilyDashboardStore((s) => s.load);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      // Prevent duplicate scans while processing
      if (scannedRef.current) return;
      scannedRef.current = true;

      Vibration.vibrate(100);
      setScanState('loading');

      try {
        const result = await redeemInviteToken(data.trim());
        setLinkedName(result.elderlyName ?? 'Người cao tuổi');
        setScanState('success');
        // Refresh family dashboard so the new link shows up immediately
        refreshDashboard();
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data
            ?.message ??
          (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Mã QR không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.';
        setMessage(msg);
        setScanState('error');
      }
    },
    [refreshDashboard],
  );

  const reset = () => {
    scannedRef.current = false;
    setMessage('');
    setScanState('scanning');
  };

  const handleDone = () => {
    navigation.goBack();
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét mã QR</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.primary} />
          <Text style={styles.permissionTitle}>Cần quyền truy cập camera</Text>
          <Text style={styles.permissionBody}>
            Ứng dụng cần dùng camera để quét mã QR kết nối tài khoản người cao tuổi.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnText}>Cấp quyền camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quét mã QR</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.cameraContainer}>
        {scanState === 'scanning' && (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
            />

            {/* Scan frame overlay */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanFrame}>
                  {/* Corner markers */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.scanHint}>Đưa mã QR vào khung để quét</Text>
              </View>
            </View>
          </>
        )}

        {scanState === 'loading' && (
          <View style={styles.feedbackContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.feedbackTitle}>Đang kết nối...</Text>
            <Text style={styles.feedbackBody}>Vui lòng chờ trong giây lát</Text>
          </View>
        )}

        {scanState === 'success' && (
          <View style={styles.feedbackContainer}>
            <View style={[styles.feedbackIcon, styles.feedbackIconSuccess]}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.feedbackTitle}>Kết nối thành công!</Text>
            <Text style={styles.feedbackBody}>
              Bạn đã kết nối với{'\n'}
              <Text style={styles.feedbackName}>{linkedName}</Text>
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanState === 'error' && (
          <View style={styles.feedbackContainer}>
            <View style={[styles.feedbackIcon, styles.feedbackIconError]}>
              <Ionicons name="close" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.feedbackTitle}>Kết nối thất bại</Text>
            <Text style={styles.feedbackBody}>{message}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reset}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>  Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={handleDone}>
              <Text style={styles.cancelLinkText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.55)';
const FRAME_SIZE = 240;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  cameraContainer: { flex: 1 },
  camera: { flex: 1 },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { height: FRAME_SIZE, flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR, alignItems: 'center', paddingTop: 24 },
  scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  scanHint: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', opacity: 0.9 },

  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },

  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  permissionBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  grantBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  grantBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  feedbackContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  feedbackIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  feedbackIconSuccess: { backgroundColor: Colors.secondary },
  feedbackIconError: { backgroundColor: Colors.error },
  feedbackTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  feedbackBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  feedbackName: { color: Colors.primary, fontWeight: '700' },

  doneBtn: {
    marginTop: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelLink: { paddingVertical: 8 },
  cancelLinkText: { color: Colors.textSecondary, fontSize: 14 },
});
