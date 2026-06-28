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
