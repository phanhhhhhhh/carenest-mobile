import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../api/client';
import { getUserId } from '../storage/secureStorage';
import { navigateToTab, navigationRef } from '../navigation/navigationRef';
import { useAuthStore } from '../../features/auth/store/authStore';

const CHANNEL_ID = 'carenest_default';

let initialized = false;
const subscriptions: Notifications.EventSubscription[] = [];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function initializePushNotifications(): Promise<void> {
  if (initialized) return;

  if (Platform.OS === 'web') {
    initialized = true;
    return;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'CareNest Notifications',
        description: 'Medication reminders, health alerts, SOS alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        enableVibrate: true,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }

    if (Device.isDevice && status === 'granted') {
      try {
        const { data: token } = await Notifications.getDevicePushTokenAsync();
        await registerTokenWithBackend(token);
      } catch {}

      subscriptions.push(
        Notifications.addPushTokenListener(({ data }) => {
          registerTokenWithBackend(data);
        }),
      );
    }

    subscriptions.push(
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        navigateFromPayload(data);
      }),
    );

    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) {
      navigateFromPayload(last.notification.request.content.data as Record<string, unknown>);
    }

    initialized = true;
  } catch (e) {
    // Setup failed (e.g. transient native error on cold start) — leave `initialized`
    // false so the next call can retry. Drop any listeners already registered so the
    // retry doesn't double-subscribe.
    console.warn('initializePushNotifications failed, will retry:', e);
    subscriptions.forEach((s) => s.remove());
    subscriptions.length = 0;
  }
}

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    await api.put(`/users/${userId}/fcm-token`, { fcmToken: token });
  } catch {}
}

// Cold start (app launched by tapping a notification) races NavigationContainer's
// mount and auth-session restore. The target screens (FamilyAlerts, ElderlyShell/...)
// only exist once the user is authenticated and the navigator has attached, so a
// dropped payload here is queued and replayed by flushPendingDeepLink() once both
// conditions are met — see App.tsx.
let pendingPayload: Record<string, unknown> | null = null;

export function flushPendingDeepLink(): void {
  if (!pendingPayload) return;
  if (!navigationRef.isReady() || !useAuthStore.getState().isAuthenticated) return;
  const payload = pendingPayload;
  pendingPayload = null;
  navigateFromPayload(payload);
}

function navigateFromPayload(data: Record<string, unknown>): void {
  const type = typeof data?.type === 'string' ? data.type : null;

  if (!navigationRef.isReady() || !useAuthStore.getState().isAuthenticated) {
    pendingPayload = data;
    return;
  }

  switch (type) {
    case 'SOS':
      // FamilyAlerts is a root-stack screen, not a FamilyShell tab.
      navigationRef.navigate('FamilyAlerts');
      break;
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      navigateToTab('ElderlyShell', 'ElderlyMeds');
      break;
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      // FamilyHealth is a root-stack screen, not a FamilyShell tab.
      navigationRef.navigate('FamilyHealth');
      break;
    case 'CHAT_REMINDER':
      // ElderlyChat is a root-stack screen, not an ElderlyShell tab.
      navigationRef.navigate('ElderlyChat');
      break;
    default:
      break;
  }
}
