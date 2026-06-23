import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// --- Models ---

class ElderlyProfileData {
  final String id;
  final String name;
  final List<String> healthConditions;
  final String? notes;

  const ElderlyProfileData({
    required this.id,
    required this.name,
    this.healthConditions = const [],
    this.notes,
  });

  factory ElderlyProfileData.fromJson(Map<String, dynamic> j) =>
      ElderlyProfileData(
        id: j['id'].toString(),
        name: j['userName'] as String? ?? '',
        healthConditions:
            (j['healthConditions'] as List<dynamic>?)?.cast<String>() ?? [],
        notes: j['notes'] as String?,
      );
}

class MedicationData {
  final String id;
  final String name;
  final String dosage;
  final String? instructions;
  final DateTime? nextDoseTime;

  const MedicationData({
    required this.id,
    required this.name,
    required this.dosage,
    this.instructions,
    this.nextDoseTime,
  });

  factory MedicationData.fromJson(Map<String, dynamic> j) => MedicationData(
        id: j['id'].toString(),
        name: j['name'] as String,
        dosage: j['dosage'] as String,
        instructions: j['instructions'] as String?,
        nextDoseTime: j['nextDoseTime'] != null
            ? DateTime.tryParse(j['nextDoseTime'] as String)
            : null,
      );
}

// --- ElderlyProfile State + Notifier ---

class ElderlyProfileState {
  final bool isLoading;
  final String? error;
  final ElderlyProfileData? profile;

  const ElderlyProfileState({
    this.isLoading = false,
    this.error,
    this.profile,
  });

  ElderlyProfileState copyWith({
    bool? isLoading,
    String? error,
    ElderlyProfileData? profile,
  }) =>
      ElderlyProfileState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        profile: profile ?? this.profile,
      );
}

class ElderlyProfileNotifier extends StateNotifier<ElderlyProfileState> {
  final Dio _dio;

  ElderlyProfileNotifier(this._dio) : super(const ElderlyProfileState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final userId = await SecureStorage.getUserId();
      if (userId == null) {
        state = state.copyWith(isLoading: false, error: 'Chưa đăng nhập');
        return;
      }
      final resp = await _dio.get('/elderly-profiles/$userId');
      state = state.copyWith(
        isLoading: false,
        profile: ElderlyProfileData.fromJson(resp.data as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      // 404 means profile not created yet — not an error to show
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusCode == 404 ? null : 'Lỗi tải hồ sơ',
      );
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Lỗi tải hồ sơ');
    }
  }
}

final elderlyProfileProvider =
    StateNotifierProvider<ElderlyProfileNotifier, ElderlyProfileState>(
  (ref) => ElderlyProfileNotifier(ref.watch(dioProvider)),
);

// --- Medications State + Notifier ---

class MedicationsState {
  final bool isLoading;
  final String? error;
  final List<MedicationData> medications;

  const MedicationsState({
    this.isLoading = false,
    this.error,
    this.medications = const [],
  });

  MedicationsState copyWith({
    bool? isLoading,
    String? error,
    List<MedicationData>? medications,
  }) =>
      MedicationsState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        medications: medications ?? this.medications,
      );
}

class MedicationsNotifier extends StateNotifier<MedicationsState> {
  final Dio _dio;

  MedicationsNotifier(this._dio) : super(const MedicationsState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final userId = await SecureStorage.getUserId();
      if (userId == null) {
        state = state.copyWith(isLoading: false);
        return;
      }
      final resp = await _dio.get('/users/$userId/medications');
      final list = (resp.data as List<dynamic>)
          .map((e) => MedicationData.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, medications: list);
    } catch (_) {
      state = state.copyWith(isLoading: false, medications: []);
    }
  }
}

final medicationsProvider =
    StateNotifierProvider<MedicationsNotifier, MedicationsState>(
  (ref) => MedicationsNotifier(ref.watch(dioProvider)),
);
