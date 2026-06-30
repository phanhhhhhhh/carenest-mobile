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
    final instructionsCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
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
            const Text(
              'Thêm thuốc mới',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                labelText: 'Tên thuốc',
                hintText: 'Ví dụ: Metformin',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.medication, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: dosageCtrl,
              decoration: InputDecoration(
                labelText: 'Liều lượng',
                hintText: 'Ví dụ: 500mg',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.scale, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: instructionsCtrl,
              decoration: InputDecoration(
                labelText: 'Hướng dẫn (tùy chọn)',
                hintText: 'Ví dụ: Uống sau khi ăn',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon:
                    const Icon(Icons.info_outline, color: AppColors.primary),
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
                    ref.read(medicationsProvider.notifier).addMedication(
                          name: nameCtrl.text.trim(),
                          dosage: dosageCtrl.text.trim(),
                          instructions: instructionsCtrl.text.trim().isNotEmpty
                              ? instructionsCtrl.text.trim()
                              : null,
                        );
                    Navigator.pop(ctx);
                  }
                },
                child: const Text('Thêm thuốc',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
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
          'Thuốc của tôi',
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
                        child: const Text('Thử lại'),
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
                          'Danh sách thuốc',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '$takenCount/$totalCount đã uống',
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
                              'Chưa có thuốc nào',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Nhấn + để thêm thuốc',
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
                        ),
                      ),
                  ],
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
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
                'Hôm nay',
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
            'Đã uống $taken / $total liều',
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
                ? 'Thêm thuốc để bắt đầu theo dõi'
                : taken == total
                    ? '🎉 Tuyệt vời! Bạn đã uống đủ thuốc hôm nay'
                    : 'Còn ${total - taken} liều cần uống',
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

  const _MedCard({required this.item, required this.onToggle});

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
            const SizedBox(width: 12),
          ],
          GestureDetector(
            onTap: onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: item.taken
                    ? AppColors.success
                    : Colors.transparent,
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
