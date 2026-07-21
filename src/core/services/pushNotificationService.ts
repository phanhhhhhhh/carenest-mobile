import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../api/client';
import { getUserId } from '../storage/secureStorage';
import { navigateToTab, navigationRef } from '../navigation/navigationRef';



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
  initialized = true;

  if (Platform.OS === 'web') return;

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
    } catch {
    }

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
}

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    await api.put(`/users/${userId}/fcm-token`, { fcmToken: token });
  } catch {
  }
}

function navigateFromPayload(data: Record<string, unknown>): void {
  const type = typeof data?.type === 'string' ? data.type : null;

  if (!navigationRef.isReady()) return;

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
      navigateToTab('ElderlyShell', 'ElderlyChat');
      break;
    default:
      break;
  }
}
