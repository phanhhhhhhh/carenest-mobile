import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  void _showAddDialog() {
    final nameCtrl = TextEditingController();
    final dosageCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Thêm thuốc'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Tên thuốc'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: dosageCtrl,
              decoration:
                  const InputDecoration(labelText: 'Liều lượng (vd: 5mg)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.trim().isNotEmpty &&
                  dosageCtrl.text.trim().isNotEmpty) {
                ref.read(medicationListProvider.notifier).addMedication(
                      name: nameCtrl.text.trim(),
                      dosage: dosageCtrl.text.trim(),
                    );
                Navigator.pop(context);
              }
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final medState = ref.watch(medicationListProvider);
    final items = medState.items;
    final takenCount = items.where((m) => m.taken).length;
    final totalCount = items.length;
    final progress = totalCount == 0 ? 0.0 : takenCount / totalCount;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Thuốc của tôi'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: medState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : medState.error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        medState.error!,
                        style:
                            const TextStyle(color: AppColors.error, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () =>
                            ref.read(medicationListProvider.notifier).load(),
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _buildTodayProgress(takenCount, totalCount, progress),
                    const SizedBox(height: 16),
                    const Text(
                      'Danh sách thuốc',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (items.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 32),
                        child: Center(
                          child: Text(
                            'Chưa có thuốc nào. Nhấn + để thêm.',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      )
                    else
                      ...items.map(
                        (m) => _MedCard(
                          item: m,
                          onToggle: () => ref
                              .read(medicationListProvider.notifier)
                              .toggleTaken(m.id),
                        ),
                      ),
                  ],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Thêm thuốc'),
      ),
    );
  }

  Widget _buildTodayProgress(int taken, int total, double progress) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Hôm nay',
              style: TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 4),
          Text(
            'Đã uống $taken/$total liều',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation(Colors.white),
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

  const _MedCard({
    required this.item,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.medication,
                    color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${item.name} ${item.dosage}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (item.instructions != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        item.instructions!,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                    if (item.nextDoseTime != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.access_time,
                              size: 12, color: AppColors.textHint),
                          const SizedBox(width: 4),
                          Text(
                            _formatTime(item.nextDoseTime!),
                            style: const TextStyle(
                                color: AppColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              _DoseChip(
                taken: item.taken,
                onTap: onToggle,
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

class _DoseChip extends StatelessWidget {
  final bool taken;
  final VoidCallback onTap;

  const _DoseChip({
    required this.taken,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: taken
              ? AppColors.success.withValues(alpha: 0.1)
              : AppColors.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: taken ? AppColors.success : AppColors.textHint,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              taken ? Icons.check_circle : Icons.circle_outlined,
              size: 14,
              color: taken ? AppColors.success : AppColors.textHint,
            ),
            const SizedBox(width: 4),
            Text(
              taken ? 'Đã uống' : 'Chưa uống',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: taken ? AppColors.success : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
