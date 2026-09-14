import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/core/navigation/AppNavigator';
import ToastHost from './src/shared/components/ToastHost';
import { useAuthStore } from './src/features/auth/store/authStore';
import {
  initializePushNotifications,
  flushPendingDeepLink,
  syncPushTokenWithBackend,
} from './src/core/services/pushNotificationService';
import { useMountEffect } from './src/shared/hooks/useMountEffect';

export default function App() {
  const loadSession = useAuthStore((s) => s.loadSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useMountEffect(() => {
    loadSession();
    initializePushNotifications();
  });

  // Retry any deep link that arrived before the navigator/auth state was ready
  // (cold start from a notification tap) once the authenticated stack mounts.
  // Also (re)bind the device push token to the account that just signed in —
  // the mount-time init runs before any session exists, and after an account
  // switch the token would still be registered against the previous user.
  useEffect(() => {
    if (!isAuthenticated) return;
    flushPendingDeepLink();
    syncPushTokenWithBackend();
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
      <ToastHost />
    </SafeAreaProvider>
  );
}
