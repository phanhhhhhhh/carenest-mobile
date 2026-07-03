import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class HealthMetricData {
  final String id;
  final String type;
  final String value;
  final String? valueSecondary;
  final String? unit;
  final DateTime recordedAt;
  const HealthMetricData({
    required this.id, required this.type, required this.value,
    this.valueSecondary, this.unit, required this.recordedAt,
  });
  factory HealthMetricData.fromJson(Map<String, dynamic> j) {
    final rawValue = j['value'];
    final rawSecondary = j['valueSecondary'];
    return HealthMetricData(
      id: j['id'].toString(),
      type: j['type'] as String? ?? '',
      value: rawValue != null ? rawValue.toString() : '',
      valueSecondary: rawSecondary != null ? rawSecondary.toString() : null,
      unit: j['unit'] as String?,
      recordedAt: DateTime.tryParse(j['recordedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class HealthMetricState {
  final bool isLoading;
  final String? error;
  final List<HealthMetricData> metrics;
  final Map<String, HealthMetricData> latestByType;
  const HealthMetricState({this.isLoading = false, this.error, this.metrics = const [], this.latestByType = const {}});
  HealthMetricState copyWith({bool? isLoading, String? error, List<HealthMetricData>? metrics, Map<String, HealthMetricData>? latestByType}) =>
    HealthMetricState(isLoading: isLoading ?? this.isLoading, error: error, metrics: metrics ?? this.metrics, latestByType: latestByType ?? this.latestByType);
}

class HealthMetricNotifier extends StateNotifier<HealthMetricState> {
  final Dio _dio;
  final String elderlyId;
  HealthMetricNotifier(this._dio, this.elderlyId) : super(const HealthMetricState()) { load(); }

  /// Load health metrics with optional date range filter.
  /// - [fromDate]: start of range (inclusive).
  /// - [toDate]: end of range (inclusive).  Defaults to now.
  Future<void> load({DateTime? fromDate, DateTime? toDate}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final params = <String, dynamic>{};
      if (fromDate != null) {
        params['from'] = fromDate.toIso8601String().split('T')[0];
      }
      if (toDate != null) {
        params['to'] = toDate.toIso8601String().split('T')[0];
      }

      final resp = await _dio.get('/elderly/$elderlyId/health-metrics', queryParameters: params.isEmpty ? null : params);
      final list = asListOfMaps(resp.data).map((e) => HealthMetricData.fromJson(e)).toList();
      final latest = <String, HealthMetricData>{};
      for (final m in list) {
        if (!latest.containsKey(m.type) || m.recordedAt.isAfter(latest[m.type]!.recordedAt)) latest[m.type] = m;
      }
      state = state.copyWith(isLoading: false, metrics: list, latestByType: latest);
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: 'Loi: ${e.message}');
    }
  }

  /// Reload with period filter: 'week' = last 7 days, 'month' = last 30 days.
  Future<void> loadPeriod(String period) async {
    final now = DateTime.now();
    final from = period == 'month'
        ? now.subtract(const Duration(days: 30))
        : now.subtract(const Duration(days: 7));
    await load(fromDate: from, toDate: now);
  }

  Future<void> addMetric({required String type, required String value, String? unit}) async {
    try {
      await _dio.post('/elderly/$elderlyId/health-metrics', data: {'type': type, 'value': value, 'unit': unit});
      await load();
    } on DioException catch (e) {
      state = state.copyWith(error: 'Loi: ${e.message}');
    }
  }
}

final healthMetricProvider = StateNotifierProvider.family<HealthMetricNotifier, HealthMetricState, String>(
  (ref, elderlyId) => HealthMetricNotifier(ref.watch(dioProvider), elderlyId),
);
