import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import '../../elderly/presentation/providers/medication_provider.dart';

class MedicationReminderService {
  static final MedicationReminderService instance =
      MedicationReminderService._();
  MedicationReminderService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    tz_data.initializeTimeZones();

    if (kIsWeb) return;

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _plugin.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
    );
  }

  void scheduleFrom(List<MedicationItem> medications) {
    if (kIsWeb) return;

    _plugin.cancelAll();

    for (final med in medications) {
      for (var i = 0; i < med.scheduleTimes.length; i++) {
        _scheduleOne(med, i);
      }
    }
  }

  void _scheduleOne(MedicationItem med, int slot) {
    final timeStr = med.scheduleTimes[slot];
    final parts = timeStr.split(':');
    if (parts.length < 2) return;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return;

    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );

    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }

    final id = _notificationId(med, slot);

    _plugin.zonedSchedule(
      id,
      '💊 Time for ${med.name}',
      '${med.dosage}${med.instructions != null ? ' — ${med.instructions}' : ''}',
      scheduled,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'carenest_medication',
          'Medication Reminders',
          channelDescription: 'Daily medication dose reminders',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: 'type=MEDICATION_REMINDER&medicationId=${med.id}',
    );
  }

  void cancelForMedication(String medicationId) {
    if (kIsWeb) return;
    final hash = medicationId.hashCode.abs();
    for (var slot = 0; slot < 20; slot++) {
      _plugin.cancel(hash * 100 + slot);
    }
  }

  Future<bool> snoozeOneOff(MedicationItem med, {int minutes = 10}) async {
    if (kIsWeb) return false;
    if (!_initialized) await initialize();

    final fireAt = tz.TZDateTime.now(tz.local).add(Duration(minutes: minutes));
    final id = _snoozeNotificationId(med);

    try {
      await _plugin.zonedSchedule(
        id,
        '💊 Nhắc lại: ${med.name}',
        '${med.dosage}${med.instructions != null ? ' — ${med.instructions}' : ''} · đã hoãn $minutes phút',
        fireAt,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'carenest_medication_snooze',
            'Medication Snooze Reminders',
            channelDescription: 'One-off reminders after snoozing a dose',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        payload: 'type=MEDICATION_SNOOZE&medicationId=${med.id}',
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  void cancelSnooze(MedicationItem med) {
    if (kIsWeb) return;
    _plugin.cancel(_snoozeNotificationId(med));
  }

  int _snoozeNotificationId(MedicationItem med) {
    return 900000 + (med.id.hashCode.abs() % 90000);
  }

  int _notificationId(MedicationItem med, int slot) {
    return (med.id.hashCode.abs() * 100 + slot).abs();
  }
}
