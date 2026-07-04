import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/medication_provider.dart';

class ElderlyMedicationScreen extends ConsumerStatefulWidget {
  const ElderlyMedicationScreen({super.key});

  @override
  ConsumerState<ElderlyMedicationScreen> createState() =>
      _ElderlyMedicationScreenState();
}

class _ElderlyMedicationScreenState
    extends ConsumerState<ElderlyMedicationScreen> {
  static const _dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  void _showAddDialog({MedicationItem? existing}) {
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    final dosageCtrl = TextEditingController(text: existing?.dosage ?? '');
    final instructionsCtrl =
        TextEditingController(text: existing?.instructions ?? '');
    final times = <TimeOfDay>[
      ...?existing?.scheduleTimes.map((t) {
        final parts = t.split(':');
        return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
      }),
    ];
    final days = <int>{...?existing?.daysOfWeek};

    final isEdit = existing != null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Center(
                  child: SizedBox(
                    width: 40,
                    child: Divider(thickness: 3, color: AppColors.textHint),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  isEdit ? 'Edit medication' : 'Add new medication',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: nameCtrl,
                  decoration: InputDecoration(
                    labelText: 'Medication name',
                    hintText: 'e.g. Metformin',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon:
                        const Icon(Icons.medication, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: dosageCtrl,
                  decoration: InputDecoration(
                    labelText: 'Dosage',
                    hintText: 'e.g. 500mg',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon:
                        const Icon(Icons.scale, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 14),
                // Time picker
                Row(
                  children: [
                    const Icon(Icons.access_time,
                        color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
                    const Text('Medication time',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                            fontSize: 14)),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () async {
                        final picked = await showTimePicker(
                          context: ctx,
                          initialTime: const TimeOfDay(hour: 8, minute: 0),
                        );
                        if (picked != null) {
                          setSheetState(() => times.add(picked));
                        }
                      },
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Add time'),
                    ),
                  ],
                ),
                if (times.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: times.asMap().entries.map((entry) {
                      final t = entry.value;
                      final h = t.hour.toString().padLeft(2, '0');
                      final m = t.minute.toString().padLeft(2, '0');
                      return Chip(
                        label: Text('$h:$m',
                            style: const TextStyle(fontSize: 13)),
                        deleteIcon: const Icon(Icons.close, size: 16),
                        onDeleted: () =>
                            setSheetState(() => times.removeAt(entry.key)),
                        backgroundColor: AppColors.primary.withOpacity(0.08),
                        labelStyle: const TextStyle(color: AppColors.primary),
                      );
                    }).toList(),
                  ),
                ],
                const SizedBox(height: 14),
                // Day-of-week selector
                const Text('Days of week',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                        fontSize: 14)),
                const SizedBox(height: 8),
                Row(
                  children: List.generate(7, (i) {
                    final selected = days.contains(i);
                    return Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setSheetState(() {
                            if (selected) {
                              days.remove(i);
                            } else {
                              days.add(i);
                            }
                          });
                        },
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primary
                                : AppColors.surface,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: selected
                                  ? AppColors.primary
                                  : AppColors.textHint.withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            _dayLabels[i],
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: selected
                                  ? Colors.white
                                  : AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: instructionsCtrl,
                  decoration: InputDecoration(
                    labelText: 'Instructions (optional)',
                    hintText: 'e.g. Take after meals',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.info_outline,
                        color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () {
                      if (nameCtrl.text.trim().isNotEmpty &&
                          dosageCtrl.text.trim().isNotEmpty) {
                        final notifier =
                            ref.read(medicationsProvider.notifier);
                        final timeStrings = times
                            .map((t) =>
                                '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}')
                            .toList();
                        final dayList = days.toList()..sort();

                        final med = existing;
                        if (isEdit && med != null) {
                          notifier.updateMedication(
                            medicationId: med.id,
                            name: nameCtrl.text.trim(),
                            dosage: dosageCtrl.text.trim(),
                            instructions: instructionsCtrl.text.trim().isNotEmpty
                                ? instructionsCtrl.text.trim()
                                : null,
                            scheduleTimes:
                                timeStrings.isNotEmpty ? timeStrings : null,
                            daysOfWeek: dayList.isNotEmpty ? dayList : null,
                          );
                        } else {
                          notifier.addMedication(
                            name: nameCtrl.text.trim(),
                            dosage: dosageCtrl.text.trim(),
                            instructions: instructionsCtrl.text.trim().isNotEmpty
                                ? instructionsCtrl.text.trim()
                                : null,
                            scheduleTimes:
                                timeStrings.isNotEmpty ? timeStrings : null,
                            daysOfWeek: dayList.isNotEmpty ? dayList : null,
                          );
                        }
                        Navigator.pop(ctx);
                      }
                    },
                    child: Text(isEdit ? 'Update' : 'Add medication',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmDelete(MedicationItem item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete medication'),
        content: Text('Are you sure you want to delete "${item.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await ref
                  .read(medicationsProvider.notifier)
                  .deleteMedication(item.id);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final medState = ref.watch(medicationsProvider);
    final items = medState.items;
    final takenCount = items.where((m) => m.taken).length;
    final totalCount = items.length;
    final progress = totalCount == 0 ? 0.0 : takenCount / totalCount;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'My Medications',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: medState.isLoading && items.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : medState.error != null && items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.textHint, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        medState.error!,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () =>
                            ref.read(medicationsProvider.notifier).load(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _buildTodayProgress(takenCount, totalCount, progress),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Medication List',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '$takenCount/$totalCount taken',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    if (items.isEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.medication_outlined,
                                color: AppColors.textHint, size: 48),
                            SizedBox(height: 12),
                            Text(
                              'No medications yet',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Press + to add medication',
                              style: TextStyle(
                                color: AppColors.textHint,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ...items.map(
                        (m) => _MedCard(
                          item: m,
                          onToggle: () => ref
                              .read(medicationsProvider.notifier)
                              .toggleTaken(m.id),
                          onEdit: () => _showAddDialog(existing: m),
                          onDelete: () => _confirmDelete(m),
                          onHistory: () => context.push('/elderly/medication-history', extra: {
                            'medicationId': m.id,
                            'medicationName': m.name,
                          }),
                        ),
                      ),
                  ],
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildTodayProgress(int taken, int total, double progress) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2E7D9A), Color(0xFF1A5570)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Today',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${(progress * 100).toInt()}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Taken $taken / $total doses',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(Color(0xFF81D4FA)),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            total == 0
                ? 'Add medication to start tracking'
                : taken == total
                    ? 'Great! You have taken all medication today'
                    : '${total - taken} doses remaining',
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _MedCard extends StatelessWidget {
  final MedicationItem item;
  final VoidCallback onToggle;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback? onHistory;

  const _MedCard({
    required this.item,
    required this.onToggle,
    required this.onEdit,
    required this.onDelete,
    this.onHistory,
  });

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: item.taken
              ? AppColors.success.withOpacity(0.3)
              : AppColors.textHint.withOpacity(0.15),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: item.taken
                  ? AppColors.success.withOpacity(0.1)
                  : AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              Icons.medication,
              color: item.taken ? AppColors.success : AppColors.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                    decoration:
                        item.taken ? TextDecoration.lineThrough : null,
                    decorationColor: AppColors.textHint,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      item.dosage,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    if (item.scheduleTimes.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      const Icon(Icons.access_time,
                          size: 12, color: AppColors.textHint),
                      const SizedBox(width: 2),
                      Text(
                        item.scheduleTimes.join(', '),
                        style: const TextStyle(
                          color: AppColors.textHint,
                          fontSize: 11,
                        ),
                      ),
                    ],
                    if (item.instructions != null &&
                        item.instructions!.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Container(
                        width: 4,
                        height: 4,
                        decoration: const BoxDecoration(
                          color: AppColors.textHint,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          item.instructions!,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (item.nextDoseTime != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _formatTime(item.nextDoseTime!),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          // History button
          if (onHistory != null) ...[
            InkWell(
              onTap: onHistory,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.history, color: AppColors.success, size: 16),
              ),
            ),
            const SizedBox(width: 6),
          ],
          // Edit button
          InkWell(
            onTap: onEdit,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.edit, color: AppColors.primary, size: 16),
            ),
          ),
          const SizedBox(width: 6),
          // Delete button
          InkWell(
            onTap: onDelete,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.06),
                borderRadius: BorderRadius.circular(8),
              ),
              child:
                  const Icon(Icons.delete_outline, color: AppColors.error, size: 16),
            ),
          ),
          const SizedBox(width: 8),
          // Taken toggle
          GestureDetector(
            onTap: onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: item.taken ? AppColors.success : Colors.transparent,
                border: Border.all(
                  color: item.taken
                      ? AppColors.success
                      : AppColors.textHint.withOpacity(0.5),
                  width: 2,
                ),
              ),
              child: item.taken
                  ? const Icon(Icons.check, color: Colors.white, size: 16)
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}
