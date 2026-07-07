import 'dart:io' show Platform;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import '../storage/secure_storage.dart';
import '../network/dio_client.dart';
import 'package:dio/dio.dart';

/// Singleton service managing FCM push notification lifecycle.
///
/// Responsibilities:
/// - Request notification permission
/// - Obtain & register FCM token with backend (PUT /api/users/{userId}/fcm-token)
/// - Handle foreground messages → show local notification
/// - Handle background-message tap → navigate to relevant screen
class FcmService {
  static final FcmService instance = FcmService._();
  FcmService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  GlobalKey<NavigatorState>? _navigatorKey;

  /// Must be called once after Firebase.initializeApp().
  Future<void> initialize({GlobalKey<NavigatorState>? navigatorKey}) async {
    if (_initialized) return;
    _initialized = true;
    _navigatorKey = navigatorKey;

    // ── Android notification channel ──────────────────────────────
    if (!kIsWeb && Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        'carenest_default',
        'CareNest Notifications',
        description: 'Medication reminders, health alerts, SOS alerts',
        importance: Importance.high,
        playSound: true,
        enableVibration: true,
      );

      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);

      await _local.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: DarwinInitializationSettings(
            requestAlertPermission: true,
            requestBadgePermission: true,
            requestSoundPermission: true,
          ),
        ),
        onDidReceiveNotificationResponse: _onNotificationTap,
      );
    }

    // ── Permission ────────────────────────────────────────────────
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    if (settings.authorizationStatus != AuthorizationStatus.authorized &&
        settings.authorizationStatus != AuthorizationStatus.provisional) {
      // Permission denied — still continue, token may be useful later
    }

    // ── Token ─────────────────────────────────────────────────────
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerTokenWithBackend(token);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen(_registerTokenWithBackend);

    // ── Foreground messages ───────────────────────────────────────
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // ── Background-tap → navigation ───────────────────────────────
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpened);
  }

  // ── Token registration ─────────────────────────────────────────

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      final userId = await SecureStorage.getUserId();
      if (userId == null) return;
      final dio = DioClient.create();
      await dio.put('/users/$userId/fcm-token', data: {
        'fcmToken': token,
      });
    } on DioException {
      // Retry on next token refresh
    }
  }

  // ── Foreground message handler ─────────────────────────────────

  void _onForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    final data = message.data;

    final title = notification?.title ?? data['title'] ?? 'CareNest';
    final body = notification?.body ?? data['body'] ?? '';

    if (kIsWeb) return; // local notifications not supported on web

    _local.show(
      message.messageId?.hashCode ?? DateTime.now().millisecondsSinceEpoch,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'carenest_default',
          'CareNest Notifications',
          channelDescription: 'Medication reminders, health alerts, SOS alerts',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: _encodePayload(data),
    );
  }

  // ── Background/open-app tap handler ────────────────────────────

  void _onMessageOpened(RemoteMessage message) {
    _navigateFromPayload(message.data);
  }

  void _onNotificationTap(NotificationResponse response) {
    final payload = response.payload;
    if (payload != null && payload.isNotEmpty) {
      final data = _decodePayload(payload);
      _navigateFromPayload(data);
    }
  }

  void _navigateFromPayload(Map<String, dynamic> data) {
    final navigator = _navigatorKey?.currentState;
    if (navigator == null) return;

    final type = data['type'] as String?;
    final route = switch (type) {
      'SOS' => '/family/alerts',
      'MISSED_MEDICATION' => '/elderly/medication',
      'ABNORMAL_VITALS' => '/family/health',
      'MEDICATION_REMINDER' => '/elderly/medication',
      'HEALTH_ALERT' => '/family/health',
      'CHAT_REMINDER' => '/elderly/chat',
      _ => null,
    };

    if (route != null) {
      navigator.pushNamed(route);
    }
  }

  // ── Payload encoding helpers ───────────────────────────────────

  String _encodePayload(Map<String, dynamic> data) {
    return data.entries.map((e) => '${e.key}=${e.value}').join('&');
  }

  Map<String, String> _decodePayload(String payload) {
    final map = <String, String>{};
    for (final part in payload.split('&')) {
      final eq = part.indexOf('=');
      if (eq > 0) {
        map[part.substring(0, eq)] = part.substring(eq + 1);
      }
    }
    return map;
  }
}

/// Top-level background message handler (must be a top-level function).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background handling: the system tray notification is already shown by
  // Firebase. We only need to ensure data is persisted for next app open.
  // The onMessageOpenedApp listener above handles navigation after tap.
}
