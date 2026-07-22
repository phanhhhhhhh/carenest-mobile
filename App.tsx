import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/core/navigation/AppNavigator';
import { useAuthStore } from './src/features/auth/store/authStore';
import { initializePushNotifications, flushPendingDeepLink } from './src/core/services/pushNotificationService';

export default function App() {
  const loadSession = useAuthStore((s) => s.loadSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    loadSession();
    initializePushNotifications();
  }, []);

  // Retry any deep link that arrived before the navigator/auth state was ready
  // (cold start from a notification tap) once the authenticated stack mounts.
  useEffect(() => {
    if (isAuthenticated) flushPendingDeepLink();
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
