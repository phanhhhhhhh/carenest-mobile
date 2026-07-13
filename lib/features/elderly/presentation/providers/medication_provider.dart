import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../medication/services/medication_reminder_service.dart';

class MedicationLogEntry {
  final String id;
  final String medicationId;
  final String status; // TAKEN | MISSED
  final DateTime takenAt;
  const MedicationLogEntry({
    required this.id,
    required this.medicationId,
    required this.status,
    required this.takenAt,
  });
  factory MedicationLogEntry.fromJson(Map<String, dynamic> j) =>
      MedicationLogEntry(
        id: j['id'].toString(),
        medicationId: j['medicationId']?.toString() ?? '',
        status: j['status'] as String? ?? 'TAKEN',
        takenAt:
            DateTime.tryParse(j['takenAt'] as String? ?? '') ?? DateTime.now(),
      );
}

class MedicationItem {
  final String id;
  final String name;
  final String dosage;
  final String? instructions;
  final DateTime? nextDoseTime;
  final List<String> scheduleTimes;
  final List<int> daysOfWeek;
  final bool taken;
  const MedicationItem({
    required this.id,
    required this.name,
    required this.dosage,
    this.instructions,
    this.nextDoseTime,
    this.scheduleTimes = const [],
    this.daysOfWeek = const [],
    this.taken = false,
  });
  factory MedicationItem.fromJson(Map<String, dynamic> j) {
    final schedule = j['schedule'] as Map<String, dynamic>?;
    return MedicationItem(
        id: j['id'].toString(),
        name: j['name'] as String,
        dosage: j['dosage'] as String,
        instructions: j['instructions'] as String?,
        nextDoseTime: j['nextDoseTime'] != null
            ? DateTime.tryParse(j['nextDoseTime'] as String)
            : null,
        scheduleTimes: (schedule?['times'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        daysOfWeek: (schedule?['daysOfWeek'] as List<dynamic>?)
                ?.map((e) => (e as num).toInt())
                .toList() ??
            [],
      );
  }

  MedicationItem copyWith({
    bool? taken,
    String? name,
    String? dosage,
    String? instructions,
    List<String>? scheduleTimes,
    List<int>? daysOfWeek,
  }) =>
      MedicationItem(
        id: id,
        name: name ?? this.name,
        dosage: dosage ?? this.dosage,
        instructions: instructions ?? this.instructions,
        nextDoseTime: nextDoseTime,
        scheduleTimes: scheduleTimes ?? this.scheduleTimes,
        daysOfWeek: daysOfWeek ?? this.daysOfWeek,
        taken: taken ?? this.taken,
      );
}

class MedicationListState {
  final bool isLoading;
  final String? error;
  final List<MedicationItem> items;
  final List<MedicationLogEntry> logs;
  final String? logsError;
  const MedicationListState({
    this.isLoading = false,
    this.error,
    this.items = const [],
    this.logs = const [],
    this.logsError,
  });
  MedicationListState copyWith({
    bool? isLoading,
    String? error,
    List<MedicationItem>? items,
    List<MedicationLogEntry>? logs,
    String? logsError,
  }) =>
      MedicationListState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        items: items ?? this.items,
        logs: logs ?? this.logs,
        logsError: logsError,
      );
}

class MedicationListNotifier extends StateNotifier<MedicationListState> {
  final Dio _dio;
  MedicationListNotifier(this._dio) : super(const MedicationListState()) {
    load();
  }

  Future<void> load({String? elderlyId}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final userId = elderlyId ?? await SecureStorage.getUserId();
      if (userId == null) {
        state = state.copyWith(isLoading: false);
        return;
      }
      final resp = await _dio.get('/users/$userId/medications');
      final items = asListOfMaps(resp.data)
          .map((e) => MedicationItem.fromJson(e))
          .toList();
      state = state.copyWith(isLoading: false, items: items);
      MedicationReminderService.instance.scheduleFrom(items);
    } on DioException catch (e) {
      state = state.copyWith(
          isLoading: false, error: 'Error loading medication: ${e.message}');
    }
  }

  Future<void> addMedication({
    required String name,
    required String dosage,
    String? instructions,
    String? elderlyId,
    List<String>? scheduleTimes,
    List<int>? daysOfWeek,
  }) async {
    try {
      final userId = elderlyId ?? await SecureStorage.getUserId();
      if (userId == null) return;
      await _dio.post('/medications', data: {
        'elderlyId': int.tryParse(userId),
        'name': name,
        'dosage': dosage,
        'instructions': instructions,
        if (scheduleTimes != null && scheduleTimes.isNotEmpty)
          'schedule': {
            'times': scheduleTimes,
            if (daysOfWeek != null && daysOfWeek.isNotEmpty)
              'daysOfWeek': daysOfWeek,
          },
      });
      await load();
    } on DioException catch (e) {
      state = state.copyWith(error: 'Error adding medication: ${e.message}');
    }
  }

  Future<void> updateMedication({
    required String medicationId,
    String? name,
    String? dosage,
    String? instructions,
    List<String>? scheduleTimes,
    List<int>? daysOfWeek,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (dosage != null) data['dosage'] = dosage;
      if (instructions != null) data['instructions'] = instructions;
      if (scheduleTimes != null) {
        data['schedule'] = {'times': scheduleTimes};
        if (daysOfWeek != null) data['schedule']['daysOfWeek'] = daysOfWeek;
      }
      await _dio.patch('/medications/$medicationId', data: data);
      await load();
    } on DioException catch (e) {
      state = state.copyWith(error: 'Error updating medication: ${e.message}');
    }
  }

  Future<bool> deleteMedication(String medicationId) async {
    try {
      await _dio.delete('/medications/$medicationId');
      await load();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// GET /api/medications/{medicationId}/logs — fetch dose history.
  Future<void> fetchLogs(String medicationId) async {
    state = state.copyWith(logsError: null);
    try {
      final resp = await _dio.get('/medications/$medicationId/logs');
      final logs = asListOfMaps(resp.data)
          .map((e) => MedicationLogEntry.fromJson(e))
          .toList();
      state = state.copyWith(logs: logs);
    } on DioException catch (e) {
      state = state.copyWith(logsError: 'Error loading history: ${e.message}');
    }
  }

  /// POST /api/medications/{medicationId}/logs — persist taken status.
  /// On success update local state; on failure revert toggle and report error.
  Future<bool> toggleTaken(String medicationId, {void Function(String error)? onError}) async {
    final idx = state.items.indexWhere((m) => m.id == medicationId);
    if (idx < 0) return false;
    final previousTaken = state.items[idx].taken;
    final newTaken = !previousTaken;

    // Optimistic update
    final updated = List<MedicationItem>.from(state.items);
    updated[idx] = updated[idx].copyWith(taken: newTaken);
    state = state.copyWith(items: updated);

    try {
      await _dio.post('/medications/$medicationId/logs', data: {
        'medicationId': int.tryParse(medicationId),
        'status': newTaken ? 'TAKEN' : 'MISSED',
        'takenAt': DateTime.now().toIso8601String(),
      });
      return true;
    } on DioException catch (e) {
      // Revert on failure
      final reverted = List<MedicationItem>.from(state.items);
      reverted[idx] = reverted[idx].copyWith(taken: previousTaken);
      state = state.copyWith(items: reverted);
      onError?.call('Error: ${e.message}');
      return false;
    }
  }
}

final medicationsProvider =
    StateNotifierProvider<MedicationListNotifier, MedicationListState>(
  (ref) => MedicationListNotifier(ref.watch(dioProvider)),
);
