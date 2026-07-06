import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class NotificationSettingsData {
  final bool medicationReminders;
  final bool healthAlerts;
  final bool weeklyReport;
  final bool appointmentReminders;
  final bool pushEnabled;
  final bool quietHoursEnabled;
  final String quietStart;
  final String quietEnd;

  const NotificationSettingsData({
    this.medicationReminders = true,
    this.healthAlerts = true,
    this.weeklyReport = true,
    this.appointmentReminders = true,
    this.pushEnabled = true,
    this.quietHoursEnabled = false,
    this.quietStart = '22:00',
    this.quietEnd = '07:00',
  });

  NotificationSettingsData copyWith({
    bool? medicationReminders,
    bool? healthAlerts,
    bool? weeklyReport,
    bool? appointmentReminders,
    bool? pushEnabled,
    bool? quietHoursEnabled,
    String? quietStart,
    String? quietEnd,
  }) =>
      NotificationSettingsData(
        medicationReminders:
            medicationReminders ?? this.medicationReminders,
        healthAlerts: healthAlerts ?? this.healthAlerts,
        weeklyReport: weeklyReport ?? this.weeklyReport,
        appointmentReminders:
            appointmentReminders ?? this.appointmentReminders,
        pushEnabled: pushEnabled ?? this.pushEnabled,
        quietHoursEnabled: quietHoursEnabled ?? this.quietHoursEnabled,
        quietStart: quietStart ?? this.quietStart,
        quietEnd: quietEnd ?? this.quietEnd,
      );

  Map<String, dynamic> toJson() => {
        'medicationReminders': medicationReminders,
        'healthAlerts': healthAlerts,
        'weeklyReport': weeklyReport,
        'appointmentReminders': appointmentReminders,
        'pushEnabled': pushEnabled,
        'quietHoursEnabled': quietHoursEnabled,
        'quietStart': quietStart,
        'quietEnd': quietEnd,
      };

  factory NotificationSettingsData.fromJson(Map<String, dynamic> j) =>
      NotificationSettingsData(
        medicationReminders:
            j['medicationReminders'] as bool? ?? true,
        healthAlerts: j['healthAlerts'] as bool? ?? true,
        weeklyReport: j['weeklyReport'] as bool? ?? true,
        appointmentReminders:
            j['appointmentReminders'] as bool? ?? true,
        pushEnabled: j['pushEnabled'] as bool? ?? true,
        quietHoursEnabled:
            j['quietHoursEnabled'] as bool? ?? false,
        quietStart: j['quietStart'] as String? ?? '22:00',
        quietEnd: j['quietEnd'] as String? ?? '07:00',
      );
}

class NotificationSettingsState {
  final bool isLoading;
  final String? error;
  final NotificationSettingsData data;
  final bool isSaving;

  const NotificationSettingsState({
    this.isLoading = false,
    this.error,
    this.data = const NotificationSettingsData(),
    this.isSaving = false,
  });

  NotificationSettingsState copyWith({
    bool? isLoading,
    String? error,
    NotificationSettingsData? data,
    bool? isSaving,
  }) =>
      NotificationSettingsState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        data: data ?? this.data,
        isSaving: isSaving ?? this.isSaving,
      );

  // Convenience getters
  bool get medicationReminders => data.medicationReminders;
  bool get healthAlerts => data.healthAlerts;
  bool get weeklyReport => data.weeklyReport;
  bool get appointmentReminders => data.appointmentReminders;
  bool get pushEnabled => data.pushEnabled;
  bool get quietHoursEnabled => data.quietHoursEnabled;
  String get quietStart => data.quietStart;
  String get quietEnd => data.quietEnd;
}

class NotificationSettingsNotifier
    extends StateNotifier<NotificationSettingsState> {
  final Dio _dio;

  NotificationSettingsNotifier(this._dio)
      : super(const NotificationSettingsState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final resp = await _dio.get('/notification-settings');
      final data = resp.data is Map<String, dynamic>
          ? NotificationSettingsData.fromJson(resp.data as Map<String, dynamic>)
          : const NotificationSettingsData();
      state = state.copyWith(isLoading: false, data: data);
    } on DioException catch (e) {
      // If backend doesn't have the endpoint yet, use defaults
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
    state = state.copyWith(data: updated, isSaving: true);
    try {
      await _dio.put('/notification-settings', data: updated.toJson());
      state = state.copyWith(isSaving: false);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Backend not ready — keep local state
        state = state.copyWith(isSaving: false);
        return;
      }
      state = state.copyWith(
        isSaving: false,
        error: 'Could not save settings: ${e.message}',
      );
      // Revert to previous on next load
      await load();
    }
  }

  void setMedicationReminders(bool v) =>
      _save(state.data.copyWith(medicationReminders: v));
  void setHealthAlerts(bool v) =>
      _save(state.data.copyWith(healthAlerts: v));
  void setWeeklyReport(bool v) =>
      _save(state.data.copyWith(weeklyReport: v));
  void setAppointmentReminders(bool v) =>
      _save(state.data.copyWith(appointmentReminders: v));
  void setPushEnabled(bool v) =>
      _save(state.data.copyWith(pushEnabled: v));
  void setQuietHoursEnabled(bool v) =>
      _save(state.data.copyWith(quietHoursEnabled: v));
  void setQuietStart(String v) =>
      _save(state.data.copyWith(quietStart: v));
  void setQuietEnd(String v) =>
      _save(state.data.copyWith(quietEnd: v));
}

final notificationSettingsProvider = StateNotifierProvider<
    NotificationSettingsNotifier, NotificationSettingsState>(
  (ref) => NotificationSettingsNotifier(ref.watch(dioProvider)),
);
