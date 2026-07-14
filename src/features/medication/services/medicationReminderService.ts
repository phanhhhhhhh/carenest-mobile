import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { MedicationItem } from '../../../shared/types';

/**
 * Local medication reminders — port of Flutter's medication_reminder_service.dart.
 *
 * Schedules a repeating daily notification for every schedule time of every
 * medication, plus one-off snooze reminders. Expo identifies scheduled
 * notifications by string id, so we reuse the Flutter id scheme as strings:
 *   daily slot → "med-<medicationId>-<slot>"
 *   snooze     → "med-snooze-<medicationId>"
 */

const CHANNEL_ID = 'carenest_medication';
const SNOOZE_CHANNEL_ID = 'carenest_medication_snooze';

let initialized = false;

export async function initializeMedicationReminders(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (Platform.OS === 'web') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Medication Reminders',
      description: 'Daily medication dose reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(SNOOZE_CHANNEL_ID, {
      name: 'Medication Snooze Reminders',
      description: 'One-off reminders after snoozing a dose',
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

/** Re-schedule all daily reminders from the given medication list. */
export async function scheduleFrom(medications: MedicationItem[]): Promise<void> {
  if (Platform.OS === 'web') return;

  // Flutter version cancelled everything then re-scheduled — same here.
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
        title: `💊 Time for ${med.name}`,
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
  } catch {
    // Invalid time or scheduling failure — skip this slot (parity: Flutter ignored errors)
  }
}

/** Cancel all daily reminders for one medication. */
export async function cancelForMedication(medicationId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  // Flutter looped slots 0..19; do the same with string ids.
  for (let slot = 0; slot < 20; slot++) {
    await Notifications.cancelScheduledNotificationAsync(`med-${medicationId}-${slot}`);
  }
}

/** Schedule a one-off snooze reminder. Returns true on success. */
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

/** Cancel a pending snooze reminder for one medication. */
export async function cancelSnooze(med: MedicationItem): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(snoozeId(med));
}
