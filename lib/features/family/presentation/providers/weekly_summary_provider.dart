import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class WeeklySummaryData {
  final String id;
  final String title;
  final String content;
  final int medicationAdherence;
  final int totalMetrics;
  final int abnormalMetrics;
  final DateTime weekStart;
  final DateTime weekEnd;
  final DateTime createdAt;

  const WeeklySummaryData({
    required this.id,
    required this.title,
    required this.content,
    this.medicationAdherence = 0,
    this.totalMetrics = 0,
    this.abnormalMetrics = 0,
    required this.weekStart,
    required this.weekEnd,
    required this.createdAt,
  });

  factory WeeklySummaryData.fromJson(Map<String, dynamic> j) =>
      WeeklySummaryData(
        id: j['id'].toString(),
        title: j['title'] as String? ?? 'Weekly Health Summary',
        content: j['content'] as String? ?? '',
        medicationAdherence:
            (j['medicationAdherence'] as num?)?.toInt() ?? 0,
        totalMetrics: (j['totalMetrics'] as num?)?.toInt() ?? 0,
        abnormalMetrics: (j['abnormalMetrics'] as num?)?.toInt() ?? 0,
        weekStart: DateTime.tryParse(j['weekStart'] as String? ?? '') ??
            DateTime.now().subtract(const Duration(days: 7)),
        weekEnd: DateTime.tryParse(j['weekEnd'] as String? ?? '') ??
            DateTime.now(),
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );

  String get weekLabel {
    final start = '${weekStart.day}/${weekStart.month}';
    final end = '${weekEnd.day}/${weekEnd.month}';
    return '$start – $end';
  }
}

class WeeklySummaryState {
  final bool isLoading;
  final String? error;
  final List<WeeklySummaryData> summaries;
  final WeeklySummaryData? latest;

  const WeeklySummaryState({
    this.isLoading = false,
    this.error,
    this.summaries = const [],
    this.latest,
  });

  WeeklySummaryState copyWith({
    bool? isLoading,
    String? error,
    List<WeeklySummaryData>? summaries,
    WeeklySummaryData? latest,
  }) =>
      WeeklySummaryState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        summaries: summaries ?? this.summaries,
        latest: latest,
      );
}

class WeeklySummaryNotifier extends StateNotifier<WeeklySummaryState> {
  final Dio _dio;
  final String elderlyId;

  WeeklySummaryNotifier(this._dio, this.elderlyId)
      : super(const WeeklySummaryState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final resp = await _dio.get('/elderly/$elderlyId/weekly-summaries');
      final rawList = resp.data is List
          ? resp.data as List<dynamic>
          : (resp.data['summaries'] as List<dynamic>? ?? []);
      final summaries = rawList
          .map((e) => WeeklySummaryData.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(
        isLoading: false,
        summaries: summaries,
        latest: summaries.isNotEmpty ? summaries.first : null,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        state = state.copyWith(isLoading: false, summaries: []);
        return;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not load reports: ${e.message}',
      );
    }
  }

  Future<WeeklySummaryData?> generateNow() async {
    state = state.copyWith(isLoading: true);
    try {
      final resp =
          await _dio.post('/elderly/$elderlyId/weekly-summaries/generate');
      final data = WeeklySummaryData.fromJson(resp.data as Map<String, dynamic>);
      state = state.copyWith(
        isLoading: false,
        latest: data,
        summaries: [data, ...state.summaries],
      );
      return data;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Could not generate report: ${e.message}',
      );
      return null;
    }
  }
}

final weeklySummaryProvider = StateNotifierProvider.family<
    WeeklySummaryNotifier, WeeklySummaryState, String>(
  (ref, elderlyId) =>
      WeeklySummaryNotifier(ref.watch(dioProvider), elderlyId),
);
