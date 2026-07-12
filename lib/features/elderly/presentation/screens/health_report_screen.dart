import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/health_report_provider.dart';

/// UC-11: 30-day health report with metrics, charts, medication adherence,
/// appointment count, and AI weekly summary.
class HealthReportScreen extends ConsumerStatefulWidget {
  const HealthReportScreen({super.key});

  @override
  ConsumerState<HealthReportScreen> createState() =>
      _HealthReportScreenState();
}

class _HealthReportScreenState
    extends ConsumerState<HealthReportScreen> {
  String _elderlyId = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final id = await SecureStorage.getUserId();
    if (id != null && mounted) {
      setState(() => _elderlyId = id);
      ref.read(healthReportProvider.notifier).load(id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(healthReportProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Health Report',
            style: TextStyle(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          if (!state.isLoading && state.metricReports.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref
                  .read(healthReportProvider.notifier)
                  .load(_elderlyId),
            ),
        ],
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(HealthReportState state) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null && state.metricReports.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.health_and_safety_outlined,
                  size: 56, color: AppColors.textHint),
              const SizedBox(height: 16),
              Text(state.error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref
                    .read(healthReportProvider.notifier)
                    .load(_elderlyId),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(healthReportProvider.notifier).load(_elderlyId),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header with date range
          if (state.elderlyName != null)
            _sectionCard(
              title: 'Report for ${state.elderlyName}',
              subtitle: state.fromDate != null && state.toDate != null
                  ? '${state.fromDate} → ${state.toDate}'
                  : 'Last 30 days',
              icon: Icons.person,
              color: AppColors.primary,
            ),

          const SizedBox(height: 12),
          // Summary cards row
          Row(
            children: [
              Expanded(
                child: _statCard(
                    '${state.metricReports.length}',
                    'Metrics Tracked',
                    Icons.trending_up,
                    AppColors.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _statCard(
                    '${state.adherenceData.fold<int>(0, (s, m) => s + m.taken)}',
                    'Doses Taken',
                    Icons.medication,
                    AppColors.success),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _statCard(
                    '${state.totalAppointments}',
                    'Appointments',
                    Icons.event,
                    AppColors.secondary),
              ),
            ],
          ),

          // Medication Adherence
          if (state.adherenceData.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text('Medication Adherence',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            ...state.adherenceData.map(_buildAdherenceCard),
          ],

          // Per-metric reports
          if (state.metricReports.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text('Health Metrics',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            ...state.metricReports.map(_buildMetricCard),
          ],

          // AI Summary
          if (state.aiSummary != null && state.aiSummary!.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text('AI Weekly Summary',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            _aiSummaryCard(state.aiSummary!),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _sectionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppColors.textPrimary)),
                Text(subtitle,
                    style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(
      String value, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(value,
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: color)),
          const SizedBox(height: 4),
          Text(label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildAdherenceCard(MedicationAdherenceData m) {
    final rate = m.adherenceRate;
    final color = rate >= 0.8
        ? AppColors.success
        : rate >= 0.5
            ? AppColors.warning
            : AppColors.error;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(m.medicationName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 4),
                Text('Taken: ${m.taken}  •  Missed: ${m.missed}',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text('${(rate * 100).toInt()}%',
                style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w700,
                    fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(MetricReportData report) {
    Color trendColor;
    switch (report.trend) {
      case 'INCREASING':
        trendColor = AppColors.warning;
        break;
      case 'DECREASING':
        trendColor = AppColors.primary;
        break;
      case 'STABLE':
        trendColor = AppColors.success;
        break;
      default:
        trendColor = AppColors.textHint;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(report.displayName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 15)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: trendColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(report.trendLabel,
                    style: TextStyle(
                        color: trendColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Mini bar chart of data points
          if (report.dataPoints.isNotEmpty)
            SizedBox(
              height: 60,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: report.dataPoints.map((dp) {
                  final maxVal = report.maxValue ?? 1;
                  final fraction =
                      maxVal > 0 ? (dp.value ?? 0) / maxVal : 0.0;
                  return Expanded(
                    child: Container(
                      margin:
                          const EdgeInsets.symmetric(horizontal: 1),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Flexible(
                            child: Container(
                              height:
                                  (fraction * 56).clamp(4, 56),
                              decoration: BoxDecoration(
                                color: AppColors.primary
                                    .withValues(alpha: 0.6),
                                borderRadius:
                                    BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          const SizedBox(height: 8),
          // Stats row
          Row(
            children: [
              _metricStat('Avg', '${report.avgValue?.toStringAsFixed(1) ?? '--'} ${report.unit}'),
              const SizedBox(width: 16),
              _metricStat('Min', '${report.minValue?.toStringAsFixed(1) ?? '--'}'),
              const SizedBox(width: 16),
              _metricStat('Max', '${report.maxValue?.toStringAsFixed(1) ?? '--'}'),
              const Spacer(),
              _metricStat('Readings', '${report.count}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metricStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.textHint, fontSize: 10)),
        const SizedBox(height: 2),
        Text(value,
            style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _aiSummaryCard(String summary) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.secondary.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.secondary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.auto_awesome,
                color: AppColors.secondary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(summary,
                style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.5)),
          ),
        ],
      ),
    );
  }
}
