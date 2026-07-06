import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class NotificationSettingsData {
  final bool medicationReminder;
  final int reminderMinutesBefore;
  final bool healthAlert;
  final bool familyUpdate;
  final String quietHoursStart;
  final String quietHoursEnd;

  const NotificationSettingsData({
    this.medicationReminder = true,
    this.reminderMinutesBefore = 15,
    this.healthAlert = true,
    this.familyUpdate = true,
    this.quietHoursStart = '22:00',
    this.quietHoursEnd = '07:00',
  });

  NotificationSettingsData copyWith({
    bool? medicationReminder,
    int? reminderMinutesBefore,
    bool? healthAlert,
    bool? familyUpdate,
    String? quietHoursStart,
    String? quietHoursEnd,
  }) =>
      NotificationSettingsData(
        medicationReminder:
            medicationReminder ?? this.medicationReminder,
        reminderMinutesBefore:
            reminderMinutesBefore ?? this.reminderMinutesBefore,
        healthAlert: healthAlert ?? this.healthAlert,
        familyUpdate: familyUpdate ?? this.familyUpdate,
        quietHoursStart: quietHoursStart ?? this.quietHoursStart,
        quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
      );

  Map<String, dynamic> toJson() => {
        'medicationReminder': medicationReminder,
        'reminderMinutesBefore': reminderMinutesBefore,
        'healthAlert': healthAlert,
        'familyUpdate': familyUpdate,
        'quietHoursStart': quietHoursStart,
        'quietHoursEnd': quietHoursEnd,
      };

  factory NotificationSettingsData.fromJson(Map<String, dynamic> j) =>
      NotificationSettingsData(
        medicationReminder:
            j['medicationReminder'] as bool? ?? true,
        reminderMinutesBefore:
            (j['reminderMinutesBefore'] as num?)?.toInt() ?? 15,
        healthAlert: j['healthAlert'] as bool? ?? true,
        familyUpdate: j['familyUpdate'] as bool? ?? true,
        quietHoursStart:
            j['quietHoursStart'] as String? ?? '22:00',
        quietHoursEnd:
            j['quietHoursEnd'] as String? ?? '07:00',
      );

  bool get quietHoursEnabled =>
      quietHoursStart.isNotEmpty && quietHoursEnd.isNotEmpty;
}

class NotificationSettingsState {
  final bool isLoading;
  final String? error;
  final NotificationSettingsData data;
  final bool isSaving;
  final bool fcmTokenSaved;

  const NotificationSettingsState({
    this.isLoading = false,
    this.error,
    this.data = const NotificationSettingsData(),
    this.isSaving = false,
    this.fcmTokenSaved = false,
  });

  NotificationSettingsState copyWith({
    bool? isLoading,
    String? error,
    NotificationSettingsData? data,
    bool? isSaving,
    bool? fcmTokenSaved,
  }) =>
      NotificationSettingsState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        data: data ?? this.data,
        isSaving: isSaving ?? this.isSaving,
        fcmTokenSaved: fcmTokenSaved ?? this.fcmTokenSaved,
      );

  bool get medicationReminder => data.medicationReminder;
  int get reminderMinutesBefore => data.reminderMinutesBefore;
  bool get healthAlert => data.healthAlert;
  bool get familyUpdate => data.familyUpdate;
  bool get quietHoursEnabled => data.quietHoursEnabled;
  String get quietHoursStart => data.quietHoursStart;
  String get quietHoursEnd => data.quietHoursEnd;
}

class NotificationSettingsNotifier
    extends StateNotifier<NotificationSettingsState> {
  final Dio _dio;

  NotificationSettingsNotifier(this._dio)
      : super(const NotificationSettingsState()) {
    load();
  }

  Future<String?> get _userId async => await SecureStorage.getUserId();

  Future<void> load() async {
    final userId = await _userId;
    if (userId == null) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final resp =
          await _dio.get('/users/$userId/notification-preferences');
      final data = NotificationSettingsData.fromJson(
          resp.data as Map<String, dynamic>);
      state = state.copyWith(isLoading: false, data: data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        state = state.copyWith(isLoading: false);
        return;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not load settings: ${e.message}',
      );
    }
  }

  Future<void> _save(NotificationSettingsData updated) async {
    final userId = await _userId;
    if (userId == null) return;
    state = state.copyWith(data: updated, isSaving: true);
    try {
      await _dio.put('/users/$userId/notification-preferences',
          data: updated.toJson());
      state = state.copyWith(isSaving: false);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        state = state.copyWith(isSaving: false);
        return;
      }
      state = state.copyWith(
        isSaving: false,
        error: 'Could not save settings: ${e.message}',
      );
      await load();
    }
  }

  void setMedicationReminder(bool v) =>
      _save(state.data.copyWith(medicationReminder: v));
  void setReminderMinutes(int v) =>
      _save(state.data.copyWith(reminderMinutesBefore: v));
  void setHealthAlert(bool v) =>
      _save(state.data.copyWith(healthAlert: v));
  void setFamilyUpdate(bool v) =>
      _save(state.data.copyWith(familyUpdate: v));
  void setQuietHoursStart(String v) =>
      _save(state.data.copyWith(quietHoursStart: v));
  void setQuietHoursEnd(String v) =>
      _save(state.data.copyWith(quietHoursEnd: v));

  /// Register FCM token with backend for push notifications (UC-19).
  Future<bool> registerFcmToken(String token) async {
    final userId = await _userId;
    if (userId == null) return false;
    try {
      await _dio.put('/users/$userId/fcm-token', data: {
        'fcmToken': token,
      });
      state = state.copyWith(fcmTokenSaved: true);
      return true;
    } on DioException {
      return false;
    }
  }
}

final notificationSettingsProvider = StateNotifierProvider<
    NotificationSettingsNotifier, NotificationSettingsState>(
  (ref) => NotificationSettingsNotifier(ref.watch(dioProvider)),
);
