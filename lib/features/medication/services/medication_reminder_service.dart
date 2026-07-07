import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import '../../elderly/presentation/providers/medication_provider.dart';

/// Singleton service that schedules local push-notification reminders
/// for medication doses using [flutter_local_notifications].
///
/// Usage:
/// ```dart
/// await MedicationReminderService.instance.initialize();
/// MedicationReminderService.instance.scheduleFrom(medications);
/// ```
class MedicationReminderService {
  static final MedicationReminderService instance =
      MedicationReminderService._();
  MedicationReminderService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  /// Call once at app startup (after WidgetsFlutterBinding).
  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    tz_data.initializeTimeZones();

    if (kIsWeb) return; // zonedSchedule not supported on web

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _plugin.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
    );
  }

  /// Schedule a daily repeating notification for every given medication time.
  ///
  /// Each notification id is derived from [MedicationItem.id.hashCode] plus
  /// the time-slot index so the same medication can have multiple daily times.
  void scheduleFrom(List<MedicationItem> medications) {
    if (kIsWeb) return;

    // Cancel all existing scheduled notifications first to avoid duplicates
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

    // If the time already passed today, schedule for tomorrow
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
      matchDateTimeComponents: DateTimeComponents.time, // repeats daily
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: 'type=MEDICATION_REMINDER&medicationId=${med.id}',
    );
  }

  /// Remove all scheduled notifications for a single medication.
  void cancelForMedication(String medicationId) {
    if (kIsWeb) return;
    final hash = medicationId.hashCode.abs();
    // Each medication can have up to ~10 time slots; cancel the range
    for (var slot = 0; slot < 20; slot++) {
      _plugin.cancel(hash * 100 + slot);
    }
  }

  int _notificationId(MedicationItem med, int slot) {
    return (med.id.hashCode.abs() * 100 + slot).abs();
  }
}
