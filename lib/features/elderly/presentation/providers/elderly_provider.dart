import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ElderlyProfileData {
  final String id;
  final String name;
  final List<String> healthConditions;
  final String? bloodType;
  final double? weight;
  final double? height;
  final List<String> allergies;
  final String? notes;

  const ElderlyProfileData({
    required this.id,
    required this.name,
    this.healthConditions = const [],
    this.bloodType,
    this.weight,
    this.height,
    this.allergies = const [],
    this.notes,
  });

  factory ElderlyProfileData.fromJson(Map<String, dynamic> j) =>
      ElderlyProfileData(
        id: j['id'].toString(),
        name: j['userName'] as String? ?? '',
        healthConditions:
            (j['healthConditions'] as List<dynamic>?)?.cast<String>() ?? [],
        bloodType: j['bloodType'] as String?,
        weight: (j['weight'] as num?)?.toDouble(),
        height: (j['height'] as num?)?.toDouble(),
        allergies: (j['allergies'] as List<dynamic>?)?.cast<String>() ?? [],
        notes: j['notes'] as String?,
      );
}

class ElderlyProfileState {
  final bool isLoading;
  final bool isUpdating;
  final String? error;
  final ElderlyProfileData? profile;

  const ElderlyProfileState({
    this.isLoading = false,
    this.isUpdating = false,
    this.error,
    this.profile,
  });

  ElderlyProfileState copyWith({
    bool? isLoading,
    bool? isUpdating,
    String? error,
    ElderlyProfileData? profile,
  }) =>
      ElderlyProfileState(
        isLoading: isLoading ?? this.isLoading,
        isUpdating: isUpdating ?? this.isUpdating,
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
        state = state.copyWith(isLoading: false, error: 'Not logged in');
        return;
      }
      final resp = await _dio.get('/elderly-profiles/$userId');
      state = state.copyWith(
        isLoading: false,
        profile:
            ElderlyProfileData.fromJson(asMap(resp.data)),
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusCode == 404
            ? null
            : 'Error loading profile',
      );
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Error loading profile');
    }
  }

  Future<void> updateProfile({
    String? name,
    List<String>? healthConditions,
    String? bloodType,
    double? weight,
    double? height,
    List<String>? allergies,
    String? notes,
  }) async {
    state = state.copyWith(isUpdating: true, error: null);
    try {
      final userId = await SecureStorage.getUserId();
      if (userId == null) return;
      final data = <String, dynamic>{};
      if (name != null) data['userName'] = name;
      if (healthConditions != null) data['healthConditions'] = healthConditions;
      if (bloodType != null) data['bloodType'] = bloodType;
      if (weight != null) data['weight'] = weight;
      if (height != null) data['height'] = height;
      if (allergies != null) data['allergies'] = allergies;
      if (notes != null) data['notes'] = notes;
      await _dio.put('/elderly-profiles/$userId', data: data);
      await load();
    } on DioException catch (e) {
      state = state.copyWith(
          isUpdating: false, error: 'Update error: ${e.message}');
    } catch (_) {
      state = state.copyWith(isUpdating: false, error: 'Update error');
    }
  }
}

final elderlyProfileProvider =
    StateNotifierProvider<ElderlyProfileNotifier, ElderlyProfileState>(
  (ref) => ElderlyProfileNotifier(ref.watch(dioProvider)),
);
