import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class FamilyDashboardData {
  final String? elderlyId;
  final String? elderlyName;
  final List<String> healthConditions;
  final int totalMedications;
  final int takenMedications;

  const FamilyDashboardData({
    this.elderlyId,
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

      // 1. Get linked elderly from /family/{userId}/elderly
      String? elderlyId;
      String? elderlyName;
      List<String> healthConditions = [];
      try {
        final familyResp = await _dio.get('/family/$userId/elderly');
        final elderlyList = familyResp.data as List<dynamic>;
        if (elderlyList.isNotEmpty) {
          final first = elderlyList[0] as Map<String, dynamic>;
          elderlyId = first['id'].toString();
          elderlyName = first['userName'] as String?;
          final rawConditions = first['healthConditions'];
          if (rawConditions is List) {
            healthConditions = rawConditions.cast<String>();
          }
        }
      } on DioException {
        // Family member may not have linked elderly yet — continue gracefully
      }

      // 2. Get medication count for the elderly (if found)
      int totalMeds = 0;
      if (elderlyId != null) {
        try {
          final medResp = await _dio.get('/users/$elderlyId/medications');
          final meds = medResp.data as List<dynamic>;
          totalMeds = meds.length;
        } on DioException {
          // Medications endpoint may not be ready
        }
      }

      state = state.copyWith(
        isLoading: false,
        lastRefreshed: DateTime.now(),
        data: FamilyDashboardData(
          elderlyId: elderlyId,
          elderlyName: elderlyName,
          healthConditions: healthConditions,
          totalMedications: totalMeds,
          takenMedications: 0,
        ),
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
