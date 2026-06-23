import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class FamilyDashboardData {
  final String? elderlyName;
  final List<String> healthConditions;
  final int totalMedications;
  final int takenMedications;

  const FamilyDashboardData({
    this.elderlyName,
    this.healthConditions = const [],
    this.totalMedications = 0,
    this.takenMedications = 0,
  });
}

class FamilyDashboardState {
  final bool isLoading;
  final String? error;
  final FamilyDashboardData? data;
  final DateTime? lastRefreshed;

  const FamilyDashboardState({
    this.isLoading = false,
    this.error,
    this.data,
    this.lastRefreshed,
  });

  FamilyDashboardState copyWith({
    bool? isLoading,
    String? error,
    FamilyDashboardData? data,
    DateTime? lastRefreshed,
  }) =>
      FamilyDashboardState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        data: data ?? this.data,
        lastRefreshed: lastRefreshed ?? this.lastRefreshed,
      );
}

class FamilyDashboardNotifier extends StateNotifier<FamilyDashboardState> {
  final Dio _dio;
  Timer? _timer;

  FamilyDashboardNotifier(this._dio) : super(const FamilyDashboardState()) {
    load();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => load());
  }

  Future<void> load() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final userId = await SecureStorage.getUserId();
      if (userId == null) {
        state = state.copyWith(isLoading: false, error: 'Chưa đăng nhập');
        return;
      }
      // Thử load medications dùng userId hiện tại làm fallback
      // Khi API /api/family/{familyId}/elderly có, thay thế logic này
      final resp = await _dio.get('/users/$userId/medications');
      final meds = resp.data as List<dynamic>;
      state = state.copyWith(
        isLoading: false,
        lastRefreshed: DateTime.now(),
        data: FamilyDashboardData(
          elderlyName: null, // chưa có API lấy elderly name qua family
          totalMedications: meds.length,
          takenMedications: 0, // medication log chưa available
        ),
      );
    } on DioException {
      // API not ready yet — show empty state without crashing
      state = state.copyWith(
        isLoading: false,
        lastRefreshed: DateTime.now(),
        data: const FamilyDashboardData(),
      );
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Lỗi kết nối');
    }
  }

  void refresh() => load();

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final familyDashboardProvider =
    StateNotifierProvider<FamilyDashboardNotifier, FamilyDashboardState>(
  (ref) => FamilyDashboardNotifier(ref.watch(dioProvider)),
);
