import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../api/client';
import { getUserId } from '../storage/secureStorage';
import { navigateToTab } from '../navigation/navigationRef';

/**
 * Push notification service — port of Flutter's fcm_service.dart.
 *
 * Responsibilities (same as the Flutter version):
 * - Request notification permission
 * - Obtain the device push token (FCM on Android) & register it with the
 *   backend: PUT /users/{userId}/fcm-token
 * - Show foreground notifications
 * - Navigate to the relevant screen when a notification is tapped
 *
 * Note: remote push requires a development build with google-services.json;
 * it does not work in Expo Go. All calls degrade gracefully.
 */

const CHANNEL_ID = 'carenest_default';

let initialized = false;
const subscriptions: Notifications.EventSubscription[] = [];

// ── Foreground presentation (Flutter showed a local notification) ──
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

  if (Platform.OS === 'web') return; // not supported on web (parity with Flutter)

  // ── Android notification channel ────────────────────────────────
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'CareNest Notifications',
      description: 'Medication reminders, health alerts, SOS alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
    });
  }

  // ── Permission ──────────────────────────────────────────────────
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  // Permission denied — still continue, token may be useful later (parity)

  // ── Token ───────────────────────────────────────────────────────
  if (Device.isDevice && status === 'granted') {
    try {
      const { data: token } = await Notifications.getDevicePushTokenAsync();
      await registerTokenWithBackend(token);
    } catch {
      // No FCM config (e.g. Expo Go) — skip silently
    }

    // Listen for token refresh
    subscriptions.push(
      Notifications.addPushTokenListener(({ data }) => {
        registerTokenWithBackend(data);
      }),
    );
  }

  // ── Notification tap → navigation ───────────────────────────────
  subscriptions.push(
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      navigateFromPayload(data);
    }),
  );

  // App opened from a killed state via notification tap
  const last = await Notifications.getLastNotificationResponseAsync();
  if (last) {
    navigateFromPayload(last.notification.request.content.data as Record<string, unknown>);
  }
}

// ── Token registration ─────────────────────────────────────────────
async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    await api.put(`/users/${userId}/fcm-token`, { fcmToken: token });
  } catch {
    // Retry on next token refresh (parity with Flutter)
  }
}

// ── Tap → route mapping (parity with fcm_service.dart) ─────────────
function navigateFromPayload(data: Record<string, unknown>): void {
  const type = typeof data?.type === 'string' ? data.type : null;

  switch (type) {
    case 'SOS':
      navigateToTab('FamilyShell', 'FamilyAlerts');
      break;
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      navigateToTab('ElderlyShell', 'ElderlyMeds');
      break;
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      navigateToTab('FamilyShell', 'FamilyHealth');
      break;
    case 'CHAT_REMINDER':
      navigateToTab('ElderlyShell', 'ElderlyChat');
      break;
    default:
      break;
  }
}
