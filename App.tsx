import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/core/navigation/AppNavigator';
import { useAuthStore } from './src/features/auth/store/authStore';
import { initializePushNotifications } from './src/core/services/pushNotificationService';

export default function App() {
  const loadSession = useAuthStore((s) => s.loadSession);

  useEffect(() => {
    loadSession();
    initializePushNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
