import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ── Family Dashboard ──────────────────────────────────────────────

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
        state = state.copyWith(isLoading: false, error: 'Not logged in');
        return;
      }

      String? elderlyId;
      String? elderlyName;
      List<String> healthConditions = [];
      try {
        final familyResp = await _dio.get('/family/$userId/elderly');
        final dynamic raw = familyResp.data;
        // Convert JS interop types to native Dart types (web compatibility)
        final List<dynamic> elderlyList = raw is List<dynamic>
            ? List<dynamic>.from(raw)
            : [];
        if (elderlyList.isNotEmpty) {
          final dynamic firstRaw = elderlyList[0];
          final Map<String, dynamic> first = firstRaw is Map<String, dynamic>
              ? Map<String, dynamic>.from(firstRaw)
              : firstRaw as Map<String, dynamic>;
          elderlyId = first['elderlyId']?.toString();
          elderlyName = first['elderlyName'] as String?;
          final rawConditions = first['healthConditions'];
          if (rawConditions is List) {
            healthConditions = List<String>.from(rawConditions.map((e) => e.toString()));
          }
        }
      } on DioException catch (e) {
        state = state.copyWith(
          isLoading: false,
          error: 'API error: ${e.response?.statusCode} ${e.message}',
        );
        return;
      }

      int totalMeds = 0;
      if (elderlyId != null) {
        try {
          final medResp = await _dio.get('/users/$elderlyId/medications');
          final dynamic medsRaw = medResp.data;
          final meds = medsRaw is List<dynamic>
              ? List<dynamic>.from(medsRaw)
              : <dynamic>[];
          totalMeds = meds.length;
        } on DioException {
          // skip
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
      state = state.copyWith(isLoading: false, error: 'Connection error');
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

// ── Family Link operations ────────────────────────────────────────

class FamilyLinkRequestState {
  final bool isLoading;
  final String? error;
  final bool success;

  const FamilyLinkRequestState({
    this.isLoading = false,
    this.error,
    this.success = false,
  });

  FamilyLinkRequestState copyWith({
    bool? isLoading,
    String? error,
    bool? success,
  }) =>
      FamilyLinkRequestState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
      );
}

class FamilyLinkNotifier extends StateNotifier<FamilyLinkRequestState> {
  final Dio _dio;
  FamilyLinkNotifier(this._dio) : super(const FamilyLinkRequestState());

  Future<bool> sendLinkRequest(String elderlyPhone) async {
    state = state.copyWith(isLoading: true, error: null, success: false);
    try {
      final familyId = await SecureStorage.getUserId();
      if (familyId == null) {
        state = state.copyWith(
            isLoading: false, error: 'Not logged in');
        return false;
      }
      await _dio.post('/family-links', data: {
        'familyId': int.parse(familyId),
        'elderlyPhone': elderlyPhone,
      });
      state = state.copyWith(isLoading: false, success: true);
      return true;
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response?.data['message'] ?? 'Cannot send request')
          : 'Cannot send connection request';
      state = state.copyWith(isLoading: false, error: msg.toString());
      return false;
    } catch (_) {
      state = state.copyWith(
          isLoading: false, error: 'Connection error');
      return false;
    }
  }
}

final familyLinkProvider =
    StateNotifierProvider.autoDispose<FamilyLinkNotifier, FamilyLinkRequestState>(
  (ref) => FamilyLinkNotifier(ref.watch(dioProvider)),
);

// ── Elderly-side linked family list ────────────────────────────────

class LinkedFamilyMember {
  final String id;
  final String name;
  final String phone;

  const LinkedFamilyMember({
    required this.id,
    required this.name,
    required this.phone,
  });

  factory LinkedFamilyMember.fromJson(Map<String, dynamic> j) =>
      LinkedFamilyMember(
        id: j['id'].toString(),
        name: j['userName'] as String? ?? '',
        phone: j['phoneNumber'] as String? ?? '',
      );
}

class LinkedFamilyState {
  final bool isLoading;
  final String? error;
  final List<LinkedFamilyMember> members;

  const LinkedFamilyState({
    this.isLoading = false,
    this.error,
    this.members = const [],
  });

  LinkedFamilyState copyWith({
    bool? isLoading,
    String? error,
    List<LinkedFamilyMember>? members,
  }) =>
      LinkedFamilyState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        members: members ?? this.members,
      );
}

class LinkedFamilyNotifier extends StateNotifier<LinkedFamilyState> {
  final Dio _dio;
  LinkedFamilyNotifier(this._dio) : super(const LinkedFamilyState()) {
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
      final resp = await _dio.get('/elderly/$userId/family');
      final members = asListOfMaps(resp.data)
          .map((e) => LinkedFamilyMember.fromJson(e))
          .toList();
      state = state.copyWith(isLoading: false, members: members);
    } on DioException catch (e) {
      state = state.copyWith(
          isLoading: false, error: 'Error loading list: ${e.message}');
    }
  }
}

final linkedFamilyProvider =
    StateNotifierProvider<LinkedFamilyNotifier, LinkedFamilyState>(
  (ref) => LinkedFamilyNotifier(ref.watch(dioProvider)),
);
