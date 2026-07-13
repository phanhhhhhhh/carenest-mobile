import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// Represents a single metric's report with stats and trend.
class MetricReportData {
  final String type;
  final String unit;
  final double? avgValue;
  final double? minValue;
  final double? maxValue;
  final int count;
  final String trend; // STABLE, INCREASING, DECREASING, INSUFFICIENT_DATA
  final List<DataPoint> dataPoints;

  const MetricReportData({
    required this.type,
    required this.unit,
    this.avgValue,
    this.minValue,
    this.maxValue,
    this.count = 0,
    this.trend = 'INSUFFICIENT_DATA',
    this.dataPoints = const [],
  });

  factory MetricReportData.fromJson(Map<String, dynamic> j) {
    final stats = j['stats'] as Map<String, dynamic>?;
    final points =
        (j['dataPoints'] as List<dynamic>?)?.map((e) {
              final m = e as Map<String, dynamic>;
              return DataPoint(
                recordedAt:
                    DateTime.tryParse(m['recordedAt'] as String? ?? '') ??
                        DateTime.now(),
                value: (m['value'] as num?)?.toDouble(),
                valueSecondary: (m['valueSecondary'] as num?)?.toDouble(),
              );
            }).toList() ??
            [];
    return MetricReportData(
      type: j['type'] as String? ?? '',
      unit: j['unit'] as String? ?? '',
      avgValue: (stats?['avgValue'] as num?)?.toDouble(),
      minValue: (stats?['minValue'] as num?)?.toDouble(),
      maxValue: (stats?['maxValue'] as num?)?.toDouble(),
      count: (stats?['count'] as num?)?.toInt() ?? 0,
      trend: stats?['trend'] as String? ?? 'INSUFFICIENT_DATA',
      dataPoints: points,
    );
  }

  String get displayName {
    switch (type) {
      case 'BLOOD_PRESSURE':
        return 'Blood Pressure';
      case 'HEART_RATE':
        return 'Heart Rate';
      case 'BLOOD_GLUCOSE':
        return 'Blood Sugar';
      case 'WEIGHT':
        return 'Weight';
      case 'TEMPERATURE':
        return 'Temperature';
      case 'SPO2':
        return 'SpO₂';
      default:
        return type;
    }
  }

  String get trendLabel {
    switch (trend) {
      case 'INCREASING':
        return '↑ Rising';
      case 'DECREASING':
        return '↓ Falling';
      case 'STABLE':
        return '→ Stable';
      default:
        return '— Insufficient data';
    }
  }
}

class DataPoint {
  final DateTime recordedAt;
  final double? value;
  final double? valueSecondary;

  const DataPoint({
    required this.recordedAt,
    this.value,
    this.valueSecondary,
  });
}

/// Medication adherence summary for the report.
class MedicationAdherenceData {
  final String medicationName;
  final int taken;
  final int missed;
  final double adherenceRate;

  const MedicationAdherenceData({
    required this.medicationName,
    this.taken = 0,
    this.missed = 0,
    this.adherenceRate = 0,
  });
}

class HealthReportState {
  final bool isLoading;
  final String? error;
  final String? elderlyName;
  final String? fromDate;
  final String? toDate;
  final List<MetricReportData> metricReports;
  final List<MedicationAdherenceData> adherenceData;
  final int totalAppointments;
  final String? aiSummary;

  const HealthReportState({
    this.isLoading = false,
    this.error,
    this.elderlyName,
    this.fromDate,
    this.toDate,
    this.metricReports = const [],
    this.adherenceData = const [],
    this.totalAppointments = 0,
    this.aiSummary,
  });

  HealthReportState copyWith({
    bool? isLoading,
    String? error,
    String? elderlyName,
    String? fromDate,
    String? toDate,
    List<MetricReportData>? metricReports,
    List<MedicationAdherenceData>? adherenceData,
    int? totalAppointments,
    String? aiSummary,
  }) =>
      HealthReportState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        elderlyName: elderlyName ?? this.elderlyName,
        fromDate: fromDate ?? this.fromDate,
        toDate: toDate ?? this.toDate,
        metricReports: metricReports ?? this.metricReports,
        adherenceData: adherenceData ?? this.adherenceData,
        totalAppointments: totalAppointments ?? this.totalAppointments,
        aiSummary: aiSummary,
      );
}

class HealthReportNotifier extends StateNotifier<HealthReportState> {
  final Dio _dio;

  HealthReportNotifier(this._dio) : super(const HealthReportState());

  Future<void> load(String elderlyId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final now = DateTime.now();
      final thirtyDaysAgo = now.subtract(const Duration(days: 30));
      final fromStr =
          '${thirtyDaysAgo.year}-${thirtyDaysAgo.month.toString().padLeft(2, '0')}-${thirtyDaysAgo.day.toString().padLeft(2, '0')}';
      final toStr =
          '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

      // Fetch health report
      final reportResp = await _dio.get(
        '/elderly/$elderlyId/health-report',
        queryParameters: {'from': fromStr, 'to': toStr},
      );
      final reportData = reportResp.data as Map<String, dynamic>;
      final reports = (reportData['reports'] as List<dynamic>?)
              ?.map((e) =>
                  MetricReportData.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];

      // Fetch medications for adherence
      List<MedicationAdherenceData> adherence = [];
      try {
        final userId = await SecureStorage.getUserId();
        final medResp = await _dio.get('/users/$userId/medications');
        final meds = asListOfMaps(medResp.data);
        for (final med in meds) {
          final medId = med['id']?.toString();
          if (medId == null) continue;
          try {
            final logResp = await _dio.get(
              '/medications/$medId/logs',
              queryParameters: {'from': fromStr, 'to': toStr},
            );
            final logs = asListOfMaps(logResp.data);
            final taken =
                logs.where((l) => l['status'] == 'TAKEN').length;
            final missed =
                logs.where((l) => l['status'] == 'MISSED').length;
            final total = taken + missed;
            adherence.add(MedicationAdherenceData(
              medicationName: med['name'] as String? ?? 'Unknown',
              taken: taken,
              missed: missed,
              adherenceRate: total > 0 ? taken / total : 0,
            ));
          } on DioException {
            // skip this medication
          }
        }
      } on DioException {
        // skip adherence
      }

      // Count upcoming appointments
      int totalAppointments = 0;
      try {
        final userId = await SecureStorage.getUserId();
        final apptResp =
            await _dio.get('/users/$userId/appointments');
        totalAppointments =
            asListOfMaps(apptResp.data).length;
      } on DioException {
        // skip
      }

      // Try to get AI weekly summary
      String? aiSummary;
      try {
        final summaryResp =
            await _dio.get('/elderly/$elderlyId/weekly-summary');
        final summaryData = summaryResp.data;
        if (summaryData is Map && summaryData.isNotEmpty) {
          aiSummary = summaryData['content'] as String? ??
              summaryData['title'] as String?;
        }
      } on DioException {
        // skip AI summary
      }

      state = state.copyWith(
        isLoading: false,
        elderlyName: reportData['elderlyName'] as String?,
        fromDate: reportData['from'] as String? ?? fromStr,
        toDate: reportData['to'] as String? ?? toStr,
        metricReports: reports,
        adherenceData: adherence,
        totalAppointments: totalAppointments,
        aiSummary: aiSummary,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        state = state.copyWith(
          isLoading: false,
          error: 'No health data available for this period',
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'Could not load health report: ${e.message}',
        );
      }
    } catch (_) {
      state = state.copyWith(
          isLoading: false, error: 'Connection error');
    }
  }
}

final healthReportProvider = StateNotifierProvider.autoDispose<
    HealthReportNotifier, HealthReportState>(
  (ref) => HealthReportNotifier(ref.watch(dioProvider)),
);
