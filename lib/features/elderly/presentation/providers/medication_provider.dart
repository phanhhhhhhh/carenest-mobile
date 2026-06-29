import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class MedicationItem {
  final String id;
  final String name;
  final String dosage;
  final String? instructions;
  final DateTime? nextDoseTime;
  final bool taken;
  const MedicationItem({
    required this.id,
    required this.name,
    required this.dosage,
    this.instructions,
    this.nextDoseTime,
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
      );
  MedicationItem copyWith({bool? taken}) => MedicationItem(
        id: id,
        name: name,
        dosage: dosage,
        instructions: instructions,
        nextDoseTime: nextDoseTime,
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
      final items = (resp.data as List<dynamic>)
          .map((e) => MedicationItem.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, items: items);
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: 'Lỗi tải thuốc: ${e.message}');
    }
  }

  Future<void> addMedication({
    required String name,
    required String dosage,
    String? instructions,
    String? elderlyId,
  }) async {
    try {
      final userId = elderlyId ?? await SecureStorage.getUserId();
      if (userId == null) return;
      await _dio.post('/medications', data: {
        'elderlyId': int.tryParse(userId),
        'name': name,
        'dosage': dosage,
        'instructions': instructions,
      });
      await load();
    } catch (_) {}
  }

  void toggleTaken(String medicationId) {
    final idx = state.items.indexWhere((m) => m.id == medicationId);
    if (idx < 0) return;
    final updated = List<MedicationItem>.from(state.items);
    updated[idx] = updated[idx].copyWith(taken: !updated[idx].taken);
    state = state.copyWith(items: updated);
    _logDose(medicationId, updated[idx].taken);
  }

  Future<void> _logDose(String medicationId, bool taken) async {
    try {
      await _dio.post('/medication-logs', data: {
        'medicationId': int.tryParse(medicationId),
        'status': taken ? 'TAKEN' : 'SKIPPED',
        'takenAt': DateTime.now().toIso8601String(),
      });
    } catch (_) {}
  }
}

final medicationsProvider =
    StateNotifierProvider<MedicationListNotifier, MedicationListState>(
  (ref) => MedicationListNotifier(ref.watch(dioProvider)),
);
