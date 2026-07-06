import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────────

class ThresholdItem {
  final int id;
  final String metricType;
  final double? minValue;
  final double? maxValue;
  final double? minValueSecondary;
  final double? maxValueSecondary;
  final bool alertFamily;

  const ThresholdItem({
    required this.id,
    required this.metricType,
    this.minValue,
    this.maxValue,
    this.minValueSecondary,
    this.maxValueSecondary,
    this.alertFamily = true,
  });

  factory ThresholdItem.fromJson(Map<String, dynamic> j) => ThresholdItem(
        id: (j['id'] as num).toInt(),
        metricType: j['metricType'] as String? ?? '',
        minValue: (j['minValue'] as num?)?.toDouble(),
        maxValue: (j['maxValue'] as num?)?.toDouble(),
        minValueSecondary:
            (j['minValueSecondary'] as num?)?.toDouble(),
        maxValueSecondary:
            (j['maxValueSecondary'] as num?)?.toDouble(),
        alertFamily: j['alertFamily'] as bool? ?? true,
      );

  String get displayType {
    switch (metricType) {
      case 'BLOOD_PRESSURE':
        return 'Blood Pressure';
      case 'BLOOD_GLUCOSE':
        return 'Blood Sugar';
      case 'HEART_RATE':
        return 'Heart Rate';
      case 'WEIGHT':
        return 'Weight';
      default:
        return metricType;
    }
  }

  String get unit {
    switch (metricType) {
      case 'BLOOD_PRESSURE':
        return 'mmHg';
      case 'BLOOD_GLUCOSE':
        return 'mmol/L';
      case 'HEART_RATE':
        return 'bpm';
      case 'WEIGHT':
        return 'kg';
      default:
        return '';
    }
  }

  bool get isBloodPressure => metricType == 'BLOOD_PRESSURE';

  String get rangeDisplay => isBloodPressure
      ? '${_fmt(minValue)}/${_fmt(minValueSecondary)} – ${_fmt(maxValue)}/${_fmt(maxValueSecondary)}'
      : '${_fmt(minValue)} – ${_fmt(maxValue)}';

  String _fmt(double? v) => v != null ? v.toString() : '–';
}

class RecommendData {
  final String metricType;
  final double? minValue;
  final double? maxValue;
  final double? minValueSecondary;
  final double? maxValueSecondary;

  const RecommendData({
    required this.metricType,
    this.minValue,
    this.maxValue,
    this.minValueSecondary,
    this.maxValueSecondary,
  });

  factory RecommendData.fromJson(Map<String, dynamic> j) => RecommendData(
        metricType: j['metricType'] as String? ?? '',
        minValue: (j['minValue'] as num?)?.toDouble(),
        maxValue: (j['maxValue'] as num?)?.toDouble(),
        minValueSecondary:
            (j['minValueSecondary'] as num?)?.toDouble(),
        maxValueSecondary:
            (j['maxValueSecondary'] as num?)?.toDouble(),
      );
}

// ── State ──────────────────────────────────────────────────────────────

class ThresholdState {
  final bool isLoading;
  final String? error;
  final bool isSaving;
  final List<ThresholdItem> thresholds;
  final List<RecommendData>? recommendations;

  const ThresholdState({
    this.isLoading = false,
    this.error,
    this.isSaving = false,
    this.thresholds = const [],
    this.recommendations,
  });

  ThresholdState copyWith({
    bool? isLoading,
    String? error,
    bool? isSaving,
    List<ThresholdItem>? thresholds,
    List<RecommendData>? recommendations,
  }) =>
      ThresholdState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        isSaving: isSaving ?? this.isSaving,
        thresholds: thresholds ?? this.thresholds,
        recommendations: recommendations,
      );
}

// ── Notifier ───────────────────────────────────────────────────────────

class ThresholdNotifier extends StateNotifier<ThresholdState> {
  final Dio _dio;
  final String elderlyId;

  ThresholdNotifier(this._dio, this.elderlyId)
      : super(const ThresholdState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final resp =
          await _dio.get('/users/$elderlyId/health-thresholds');
      final list = (resp.data as List<dynamic>)
          .map((e) => ThresholdItem.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, thresholds: list);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        state = state.copyWith(isLoading: false, thresholds: []);
        return;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not load thresholds: ${e.message}',
      );
    }
  }

  Future<bool> create({
    required String metricType,
    double? minValue,
    double? maxValue,
    double? minValueSecondary,
    double? maxValueSecondary,
    bool alertFamily = true,
  }) async {
    state = state.copyWith(isSaving: true);
    try {
      await _dio.post('/users/$elderlyId/health-thresholds', data: {
        'metricType': metricType,
        if (minValue != null) 'minValue': minValue,
        if (maxValue != null) 'maxValue': maxValue,
        if (minValueSecondary != null)
          'minValueSecondary': minValueSecondary,
        if (maxValueSecondary != null)
          'maxValueSecondary': maxValueSecondary,
        'alertFamily': alertFamily,
      });
      await load();
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Could not save: ${e.message}',
      );
      return false;
    }
  }

  Future<bool> update(
    int thresholdId, {
    double? minValue,
    double? maxValue,
    double? minValueSecondary,
    double? maxValueSecondary,
    bool? alertFamily,
  }) async {
    state = state.copyWith(isSaving: true);
    try {
      final data = <String, dynamic>{};
      if (minValue != null) data['minValue'] = minValue;
      if (maxValue != null) data['maxValue'] = maxValue;
      if (minValueSecondary != null)
        data['minValueSecondary'] = minValueSecondary;
      if (maxValueSecondary != null)
        data['maxValueSecondary'] = maxValueSecondary;
      if (alertFamily != null) data['alertFamily'] = alertFamily;
      await _dio.patch('/health-thresholds/$thresholdId', data: data);
      await load();
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Could not update: ${e.message}',
      );
      return false;
    }
  }

  Future<bool> delete(int thresholdId) async {
    try {
      await _dio.delete('/health-thresholds/$thresholdId');
      await load();
      return true;
    } on DioException catch (e) {
      state = state.copyWith(error: 'Could not delete: ${e.message}');
      return false;
    }
  }

  Future<List<RecommendData>?> getRecommendations() async {
    state = state.copyWith(isLoading: true, recommendations: null);
    try {
      final resp = await _dio
          .get('/users/$elderlyId/health-thresholds/recommend');
      final data = resp.data as Map<String, dynamic>;
      final list = (data['recommendations'] as List<dynamic>?)
          ?.map((e) => RecommendData.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, recommendations: list);
      return list;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Could not get recommendations: ${e.message}',
      );
      return null;
    }
  }

  void clearRecommendations() =>
      state = state.copyWith(recommendations: null);

  ThresholdItem? findFor(String metricType) {
    try {
      return state.thresholds.firstWhere((t) => t.metricType == metricType);
    } catch (_) {
      return null;
    }
  }
}

final healthThresholdProvider = StateNotifierProvider.family<
    ThresholdNotifier, ThresholdState, String>(
  (ref, elderlyId) => ThresholdNotifier(ref.watch(dioProvider), elderlyId),
);
