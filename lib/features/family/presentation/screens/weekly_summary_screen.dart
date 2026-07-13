import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/family_provider.dart';
import '../providers/weekly_summary_provider.dart';

class WeeklySummaryScreen extends ConsumerWidget {
  const WeeklySummaryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dash = ref.watch(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    final elderlyName = dash.data?.elderlyName ?? 'Loved one';

    if (elderlyId == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: _appBar(elderlyName),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.people_outline, size: 56, color: AppColors.textHint),
              SizedBox(height: 16),
              Text('No elderly person linked yet',
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 15)),
            ],
          ),
        ),
      );
    }

    final state = ref.watch(weeklySummaryProvider(elderlyId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _appBar(elderlyName),
      body: state.isLoading && state.summaries.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.summaries.isEmpty
              ? _buildError(state.error!, elderlyId, ref)
              : state.summaries.isEmpty
                  ? _buildEmpty(elderlyId, ref)
                  : _buildList(state, elderlyId, ref),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: state.isLoading
            ? null
            : () => ref
                .read(weeklySummaryProvider(elderlyId).notifier)
                .generateNow(),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: state.isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child:
                    CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.auto_awesome),
        label: Text(state.isLoading ? 'Generating...' : 'Generate Now'),
      ),
    );
  }

  PreferredSizeWidget _appBar(String name) {
    return AppBar(
      title: Text('Weekly Report — $name',
          style: const TextStyle(
              fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
    );
  }

  Widget _buildError(String error, String elderlyId, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 48),
            const SizedBox(height: 16),
            Text(error,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 14)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () =>
                  ref.invalidate(weeklySummaryProvider(elderlyId)),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(String elderlyId, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome,
                  color: AppColors.primary, size: 40),
            ),
            const SizedBox(height: 16),
            const Text('No weekly reports yet',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            const Text(
              'AI-generated weekly health summaries\nwill appear here',
              textAlign: TextAlign.center,
              style:
                  TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref
                  .read(weeklySummaryProvider(elderlyId).notifier)
                  .generateNow(),
              icon: const Icon(Icons.auto_awesome, size: 18),
              label: const Text('Generate First Report'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList(
      WeeklySummaryState state, String elderlyId, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: () async =>
          ref.read(weeklySummaryProvider(elderlyId).notifier).load(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.summaries.length,
        itemBuilder: (_, i) {
          final s = state.summaries[i];
          final isLatest = i == 0;
          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: isLatest
                  ? Border.all(color: AppColors.primary.withValues(alpha: 0.3))
                  : null,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryLight],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.auto_awesome,
                          color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  color: AppColors.textPrimary)),
                          const SizedBox(height: 2),
                          Text(s.weekLabel,
                              style: const TextStyle(
                                  color: AppColors.textSecondary, fontSize: 12)),
                        ],
                      ),
                    ),
                    if (isLatest)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Latest',
                            style: TextStyle(
                                color: AppColors.success,
                                fontSize: 11,
                                fontWeight: FontWeight.w600)),
                      ),
                  ],
                ),
                const SizedBox(height: 14),
                // Stats row
                Row(
                  children: [
                    _StatMini(
                        icon: Icons.medication,
                        color: AppColors.primary,
                        value: '${s.medicationAdherence}%',
                        label: 'Adherence'),
                    const SizedBox(width: 16),
                    _StatMini(
                        icon: Icons.monitor_heart,
                        color: AppColors.secondary,
                        value: '${s.totalMetrics}',
                        label: 'Metrics'),
                    const SizedBox(width: 16),
                    _StatMini(
                        icon: Icons.warning_amber,
                        color: s.abnormalMetrics > 0
                            ? AppColors.error
                            : AppColors.success,
                        value: '${s.abnormalMetrics}',
                        label: 'Abnormal'),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(),
                const SizedBox(height: 10),
                Text(s.content,
                    style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        height: 1.6)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatMini extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  const _StatMini({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 4),
        Text(value,
            style: TextStyle(
                color: color,
                fontSize: 15,
                fontWeight: FontWeight.w700)),
        const SizedBox(width: 4),
        Text(label,
            style: const TextStyle(
                color: AppColors.textHint, fontSize: 11)),
      ],
    );
  }
}
