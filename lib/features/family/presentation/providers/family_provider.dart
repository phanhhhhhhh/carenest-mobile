import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ── Family Dashboard ──────────────────────────────────────────────

class ElderlySummary {
  final String elderlyId;
  final String elderlyName;
  final List<String> healthConditions;

  const ElderlySummary({
    required this.elderlyId,
    required this.elderlyName,
    this.healthConditions = const [],
  });

  factory ElderlySummary.fromJson(Map<String, dynamic> j) => ElderlySummary(
        elderlyId: j['elderlyId']?.toString() ?? '',
        elderlyName: j['elderlyName'] as String? ?? '',
        healthConditions:
            (j['healthConditions'] as List<dynamic>?)
                    ?.map((e) => e.toString())
                    .toList() ??
                [],
      );
}

class FamilyDashboardData {
  final List<ElderlySummary> linkedElderly;
  final int selectedIndex;
  final int totalMedications;
  final int takenMedications;

  const FamilyDashboardData({
    this.linkedElderly = const [],
    this.selectedIndex = 0,
    this.totalMedications = 0,
    this.takenMedications = 0,
  });

  String? get elderlyId =>
      linkedElderly.isNotEmpty && selectedIndex < linkedElderly.length
          ? linkedElderly[selectedIndex].elderlyId
          : null;

  String? get elderlyName =>
      linkedElderly.isNotEmpty && selectedIndex < linkedElderly.length
          ? linkedElderly[selectedIndex].elderlyName
          : null;

  List<String> get healthConditions =>
      linkedElderly.isNotEmpty && selectedIndex < linkedElderly.length
          ? linkedElderly[selectedIndex].healthConditions
          : [];
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

      // Fetch all linked elderly
      List<ElderlySummary> elderlyList = [];
      try {
        final familyResp = await _dio.get('/family/$userId/elderly');
        final dynamic raw = familyResp.data;
        final List<dynamic> rawList = raw is List<dynamic>
            ? List<dynamic>.from(raw)
            : [];
        elderlyList = rawList
            .map((e) {
              final m = e is Map<String, dynamic>
                  ? Map<String, dynamic>.from(e)
                  : e as Map<String, dynamic>;
              return ElderlySummary.fromJson(m);
            })
            .toList();
      } on DioException catch (e) {
        state = state.copyWith(
          isLoading: false,
          error: 'API error: ${e.response?.statusCode} ${e.message}',
        );
        return;
      }

      // Preserve previously selected index if still valid
      final prevIndex = state.data?.selectedIndex ?? 0;
      final selectedIndex =
          prevIndex < elderlyList.length ? prevIndex : 0;
      final selectedElderlyId = elderlyList.isNotEmpty
          ? elderlyList[selectedIndex].elderlyId
          : null;

      // Count medications and taken status for selected elderly
      int totalMeds = 0;
      int takenMeds = 0;
      if (selectedElderlyId != null) {
        try {
          final medResp =
              await _dio.get('/users/$selectedElderlyId/medications');
          final dynamic medsRaw = medResp.data;
          final meds = medsRaw is List<dynamic>
              ? List<dynamic>.from(medsRaw)
              : <dynamic>[];
          totalMeds = meds.length;

          // Count taken medications via log query for today
          try {
            final today = DateTime.now();
            final todayStr =
                '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
            final logResp = await _dio.get(
              '/elderly/$selectedElderlyId/medication-logs',
              queryParameters: {'date': todayStr},
            );
            final dynamic logsRaw = logResp.data;
            final logs = logsRaw is List<dynamic>
                ? List<dynamic>.from(logsRaw)
                : <dynamic>[];
            takenMeds =
                logs.where((l) {
                  final m = l is Map ? Map<String, dynamic>.from(l) : null;
                  return m?['status'] == 'TAKEN';
                }).length;
          } on DioException {
            // If log endpoint unavailable, count from medication data
            takenMeds = meds
                .where((m) {
                  final map =
                      m is Map ? Map<String, dynamic>.from(m) : null;
                  return map?['taken'] == true;
                })
                .length;
          }
        } on DioException {
          // skip medication count
        }
      }

      state = state.copyWith(
        isLoading: false,
        lastRefreshed: DateTime.now(),
        data: FamilyDashboardData(
          linkedElderly: elderlyList,
          selectedIndex: selectedIndex,
          totalMedications: totalMeds,
          takenMedications: takenMeds,
        ),
      );
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Connection error');
    }
  }

  /// Switch to a different linked elderly profile.
  /// Reloads all data for the newly selected elderly.
  Future<void> selectElderly(int index) async {
    final data = state.data;
    if (data == null || index >= data.linkedElderly.length) return;

    state = state.copyWith(
      data: FamilyDashboardData(
        linkedElderly: data.linkedElderly,
        selectedIndex: index,
        // Reset counters — load() will refill
        totalMedications: 0,
        takenMedications: 0,
      ),
    );

    // Reload to get medication counts for newly selected elderly
    await load();
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

  Future<bool> sendLinkRequest(String elderlyId) async {
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
        'elderlyId': int.parse(elderlyId),
        'relationship': 'family',
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
