import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { MedicationItem } from '../../../shared/types';

const CHANNEL_ID = 'carenest_medication';
const SNOOZE_CHANNEL_ID = 'carenest_medication_snooze';

let initialized = false;

export async function initializeMedicationReminders(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (Platform.OS === 'web') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Nhắc uống thuốc',
      description: 'Nhắc nhở uống thuốc hàng ngày',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(SNOOZE_CHANNEL_ID, {
      name: 'Nhắc lại sau khi hoãn',
      description: 'Nhắc nhở một lần sau khi hoãn uống thuốc',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

function reminderBody(med: MedicationItem): string {
  return `${med.dosage}${med.instructions ? ` — ${med.instructions}` : ''}`;
}

function dailyId(med: MedicationItem, slot: number): string {
  return `med-${med.id}-${slot}`;
}

function snoozeId(med: MedicationItem): string {
  return `med-snooze-${med.id}`;
}

export async function scheduleFrom(medications: MedicationItem[]): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const med of medications) {
    for (let slot = 0; slot < med.scheduleTimes.length; slot++) {
      await scheduleOne(med, slot);
    }
  }
}

async function scheduleOne(med: MedicationItem, slot: number): Promise<void> {
  const timeStr = med.scheduleTimes[slot];
  const parts = timeStr.split(':');
  if (parts.length < 2) return;
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: dailyId(med, slot),
      content: {
        title: `💊 Đến giờ uống ${med.name}`,
        body: reminderBody(med),
        sound: 'default',
        data: { type: 'MEDICATION_REMINDER', medicationId: med.id },
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {}
}

export async function cancelForMedication(medicationId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  for (let slot = 0; slot < 20; slot++) {
    await Notifications.cancelScheduledNotificationAsync(`med-${medicationId}-${slot}`);
  }
}

export async function snoozeOneOff(med: MedicationItem, minutes = 10): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!initialized) await initializeMedicationReminders();

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: snoozeId(med),
      content: {
        title: `💊 Nhắc lại: ${med.name}`,
        body: `${reminderBody(med)} · đã hoãn ${minutes} phút`,
        sound: 'default',
        data: { type: 'MEDICATION_SNOOZE', medicationId: med.id },
        ...(Platform.OS === 'android' ? { channelId: SNOOZE_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelSnooze(med: MedicationItem): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(snoozeId(med));
}
