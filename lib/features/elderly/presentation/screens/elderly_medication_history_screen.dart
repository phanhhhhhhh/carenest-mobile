import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/medication_provider.dart';

class ElderlyMedicationHistoryScreen extends ConsumerStatefulWidget {
  final String medicationId;
  final String medicationName;

  const ElderlyMedicationHistoryScreen({
    super.key,
    required this.medicationId,
    required this.medicationName,
  });

  @override
  ConsumerState<ElderlyMedicationHistoryScreen> createState() =>
      _ElderlyMedicationHistoryScreenState();
}

class _ElderlyMedicationHistoryScreenState
    extends ConsumerState<ElderlyMedicationHistoryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref
          .read(medicationsProvider.notifier)
          .fetchLogs(widget.medicationId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final medState = ref.watch(medicationsProvider);
    final logs = medState.logs;
    final isLoading = medState.isLoading && logs.isEmpty;
    final error = medState.logsError;

    // Group logs by date
    final grouped = <String, List<MedicationLogEntry>>{};
    for (final log in logs) {
      final dateKey =
          '${log.takenAt.year}-${log.takenAt.month.toString().padLeft(2, '0')}-${log.takenAt.day.toString().padLeft(2, '0')}';
      grouped.putIfAbsent(dateKey, () => []).add(log);
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'History - ${widget.medicationName}',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
            fontSize: 16,
          ),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error != null && logs.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.textHint, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        error,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => ref
                            .read(medicationsProvider.notifier)
                            .fetchLogs(widget.medicationId),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : logs.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.history,
                              color: AppColors.textHint, size: 48),
                          SizedBox(height: 12),
                          Text(
                            'No medication history yet',
                            style: TextStyle(
                                color: AppColors.textSecondary, fontSize: 14),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async => ref
                          .read(medicationsProvider.notifier)
                          .fetchLogs(widget.medicationId),
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // Summary card
                          _buildSummaryCard(logs),
                          const SizedBox(height: 20),
                          // Log entries grouped by date
                          ...grouped.entries.map((entry) {
                            final dateStr = entry.key;
                            final dayLogs = entry.value;
                            final parsed =
                                DateTime.tryParse(dateStr) ?? DateTime.now();
                            final dayLabel = _formatDateLabel(parsed);

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding:
                                      const EdgeInsets.only(left: 4, bottom: 10, top: 6),
                                  child: Text(
                                    dayLabel,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                ...dayLogs.map((log) => _LogEntryTile(log: log)),
                                const SizedBox(height: 4),
                              ],
                            );
                          }),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildSummaryCard(List<MedicationLogEntry> logs) {
    final taken = logs.where((l) => l.status == 'TAKEN').length;
    final missed = logs.where((l) => l.status == 'MISSED').length;
    final total = logs.length;
    final adherence =
        total == 0 ? 0.0 : taken / total;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2E7D9A), Color(0xFF1A5570)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Adherence Overview',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${(adherence * 100).toInt()}%',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: adherence,
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(Color(0xFF81D4FA)),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _StatPill(
                icon: Icons.check_circle,
                color: AppColors.success,
                label: '$taken taken',
              ),
              const SizedBox(width: 12),
              _StatPill(
                icon: Icons.cancel,
                color: AppColors.error,
                label: '$missed missed',
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDateLabel(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final date = DateTime(dt.year, dt.month, dt.day);
    final diff = today.difference(date).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    final weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${weekDays[dt.weekday - 1]}, ${dt.day}/${dt.month}/${dt.year}';
  }
}

class _LogEntryTile extends StatelessWidget {
  final MedicationLogEntry log;
  const _LogEntryTile({required this.log});

  @override
  Widget build(BuildContext context) {
    final isTaken = log.status == 'TAKEN';
    final timeStr =
        '${log.takenAt.hour.toString().padLeft(2, '0')}:${log.takenAt.minute.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isTaken
              ? AppColors.success.withOpacity(0.2)
              : AppColors.error.withOpacity(0.15),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isTaken
                  ? AppColors.success.withOpacity(0.1)
                  : AppColors.error.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isTaken ? Icons.check : Icons.close,
              color: isTaken ? AppColors.success : AppColors.error,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              isTaken ? 'Taken' : 'Missed',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: isTaken ? AppColors.success : AppColors.error,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.06),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              timeStr,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  const _StatPill({
    required this.icon,
    required this.color,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
