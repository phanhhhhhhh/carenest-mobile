import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/medication_provider.dart';

/// Inline proactive reminder card shown above the chat messages area.
///
/// Displays the next upcoming medication dose that is still pending,
/// with a quick "Take" action button that logs the dose via
/// [MedicationListNotifier.toggleTaken].
class ProactiveReminderCard extends ConsumerWidget {
  const ProactiveReminderCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medsState = ref.watch(medicationsProvider);
    final items = medsState.items;

    // Show only pending (not yet taken) medications
    final pending = items.where((m) => !m.taken).toList();
    if (pending.isEmpty) return const SizedBox.shrink();

    // Show the first pending medication as a proactive nudge
    final next = pending.first;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppColors.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            ref.read(medicationsProvider.notifier).toggleTaken(next.id);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.notifications_active,
                    color: AppColors.warning,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '⏰ Time to take your medication',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${next.name} — ${next.dosage}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                      if (next.instructions != null &&
                          next.instructions!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          next.instructions!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () {
                    ref
                        .read(medicationsProvider.notifier)
                        .toggleTaken(next.id);
                  },
                  icon: const Icon(Icons.check, size: 18),
                  label: const Text('Take',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
