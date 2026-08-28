import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../../core/theme/colors';
import { redeemInviteToken } from '../../../core/api/inviteApi';
import { useFamilyDashboardStore } from '../store/familyStore';
import { ScanHeader } from './familyScanQR/ScanHeader';
import { ScanOverlay } from './familyScanQR/ScanOverlay';
import { PermissionDenied, LoadingView, SuccessView, ErrorView } from './familyScanQR/feedback';

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
        <ScanHeader onBack={() => navigation.goBack()} />
        <PermissionDenied onGrant={requestPermission} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScanHeader onBack={() => navigation.goBack()} />

      <View style={styles.cameraContainer}>
        {scanState === 'scanning' && (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            <ScanOverlay />
          </>
        )}

        {scanState === 'loading' && <LoadingView />}

        {scanState === 'success' && <SuccessView linkedName={linkedName} onDone={handleDone} />}

        {scanState === 'error' && (
          <ErrorView message={message} onRetry={reset} onCancel={handleDone} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
});
