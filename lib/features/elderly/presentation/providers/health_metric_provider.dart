import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
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
  factory HealthMetricData.fromJson(Map<String, dynamic> j) => HealthMetricData(
    id: j['id'].toString(),
    type: j['type'] as String? ?? '',
    value: j['value'] as String? ?? '',
    valueSecondary: j['valueSecondary'] as String?,
    unit: j['unit'] as String?,
    recordedAt: DateTime.tryParse(j['recordedAt'] as String? ?? '') ?? DateTime.now(),
  );
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

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final resp = await _dio.get('/elderly/$elderlyId/health-metrics');
      final list = (resp.data as List<dynamic>).map((e) => HealthMetricData.fromJson(e as Map<String, dynamic>)).toList();
      final latest = <String, HealthMetricData>{};
      for (final m in list) {
        if (!latest.containsKey(m.type) || m.recordedAt.isAfter(latest[m.type]!.recordedAt)) latest[m.type] = m;
      }
      state = state.copyWith(isLoading: false, metrics: list, latestByType: latest);
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: 'Loi: ${e.message}');
    }
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
