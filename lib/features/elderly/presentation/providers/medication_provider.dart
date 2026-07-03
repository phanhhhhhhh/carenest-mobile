import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

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
  factory MedicationItem.fromJson(Map<String, dynamic> j) => MedicationItem(
        id: j['id'].toString(),
        name: j['name'] as String,
        dosage: j['dosage'] as String,
        instructions: j['instructions'] as String?,
        nextDoseTime: j['nextDoseTime'] != null
            ? DateTime.tryParse(j['nextDoseTime'] as String)
            : null,
        scheduleTimes: (j['scheduleTimes'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        daysOfWeek: (j['daysOfWeek'] as List<dynamic>?)
                ?.map((e) => (e as num).toInt())
                .toList() ??
            [],
      );
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
  const MedicationListState({
    this.isLoading = false,
    this.error,
    this.items = const [],
  });
  MedicationListState copyWith({
    bool? isLoading,
    String? error,
    List<MedicationItem>? items,
  }) =>
      MedicationListState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        items: items ?? this.items,
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
    } on DioException catch (e) {
      state = state.copyWith(
          isLoading: false, error: 'Lỗi tải thuốc: ${e.message}');
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
          'scheduleTimes': scheduleTimes,
        if (daysOfWeek != null && daysOfWeek.isNotEmpty)
          'daysOfWeek': daysOfWeek,
      });
      await load();
    } catch (_) {}
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
      if (scheduleTimes != null) data['scheduleTimes'] = scheduleTimes;
      if (daysOfWeek != null) data['daysOfWeek'] = daysOfWeek;
      await _dio.patch('/medications/$medicationId', data: data);
      await load();
    } catch (_) {}
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
        'status': newTaken ? 'TAKEN' : 'MISSED',
        'takenAt': DateTime.now().toIso8601String(),
      });
      return true;
    } on DioException catch (e) {
      // Revert on failure
      final reverted = List<MedicationItem>.from(state.items);
      reverted[idx] = reverted[idx].copyWith(taken: previousTaken);
      state = state.copyWith(items: reverted);
      onError?.call('Lỗi: ${e.message}');
      return false;
    }
  }
}

final medicationsProvider =
    StateNotifierProvider<MedicationListNotifier, MedicationListState>(
  (ref) => MedicationListNotifier(ref.watch(dioProvider)),
);
