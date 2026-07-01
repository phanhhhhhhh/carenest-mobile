import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../elderly/presentation/providers/medication_provider.dart';
import '../providers/family_provider.dart';

class FamilyMedicationScreen extends ConsumerStatefulWidget {
  const FamilyMedicationScreen({super.key});

  @override
  ConsumerState<FamilyMedicationScreen> createState() =>
      _FamilyMedicationScreenState();
}

class _FamilyMedicationScreenState
    extends ConsumerState<FamilyMedicationScreen> {
  final _nameCtrl = TextEditingController();
  final _dosageCtrl = TextEditingController();
  final _instructionsCtrl = TextEditingController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _dosageCtrl.dispose();
    _instructionsCtrl.dispose();
    super.dispose();
  }

  void _showAddSheet() {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    final elderlyName = dash.data?.elderlyName ?? 'người thân';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: SizedBox(
                  width: 40,
                  child: Divider(thickness: 3, color: AppColors.textHint)),
            ),
            const SizedBox(height: 16),
            Text('Thêm thuốc cho $elderlyName',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 20),
            TextField(
              controller: _nameCtrl,
              decoration: InputDecoration(
                labelText: 'Tên thuốc',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.medication, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _dosageCtrl,
              decoration: InputDecoration(
                labelText: 'Liều lượng',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.scale, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _instructionsCtrl,
              decoration: InputDecoration(
                labelText: 'Hướng dẫn (tùy chọn)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.info_outline, color: AppColors.primary),
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
                      borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () {
                  if (_nameCtrl.text.trim().isNotEmpty &&
                      _dosageCtrl.text.trim().isNotEmpty) {
                    ref.read(medicationsProvider.notifier).addMedication(
                          name: _nameCtrl.text.trim(),
                          dosage: _dosageCtrl.text.trim(),
                          instructions: _instructionsCtrl.text.trim().isNotEmpty
                              ? _instructionsCtrl.text.trim()
                              : null,
                          elderlyId: elderlyId,
                        );
                    _nameCtrl.clear();
                    _dosageCtrl.clear();
                    _instructionsCtrl.clear();
                    Navigator.pop(ctx);
                  }
                },
                child: const Text('Thêm thuốc',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dash = ref.watch(familyDashboardProvider);
    final elderlyName = dash.data?.elderlyName ?? 'Người thân';

    final medState = ref.watch(medicationsProvider);
    final items = medState.items;
    final taken = items.where((m) => m.taken).length;
    final total = items.length;
    final progress = total == 0 ? 0.0 : taken / total;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Thuốc — $elderlyName',
            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: medState.isLoading && items.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildComplianceCard(taken, total, progress),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Danh sách thuốc',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary)),
                    Text('$taken/$total đã uống',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
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
                    child: Column(
                      children: [
                        const Icon(Icons.medication_outlined, color: AppColors.textHint, size: 48),
                        const SizedBox(height: 12),
                        const Text('Chưa có thuốc nào',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                        const SizedBox(height: 4),
                        Text('Nhấn + để thêm thuốc cho $elderlyName',
                            style: const TextStyle(color: AppColors.textHint, fontSize: 13)),
                      ],
                    ),
                  )
                else
                  ...items.map((m) => _MedCard(item: m, onToggle: () {
                        ref.read(medicationsProvider.notifier).toggleTaken(m.id);
                      })),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddSheet,
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildComplianceCard(int taken, int total, double progress) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF1A5570)],
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
              const Text('Tuân thủ thuốc',
                  style: TextStyle(color: Colors.white70, fontSize: 14)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('${(progress * 100).toInt()}%',
                    style: const TextStyle(color: Colors.white, fontSize: 13,
                        fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Đã uống $taken / $total liều',
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF81D4FA)),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            total == 0
                ? 'Thêm thuốc để bắt đầu theo dõi'
                : taken == total
                    ? '🎉 Đã uống đủ thuốc hôm nay!'
                    : 'Còn ${total - taken} liều chưa uống',
            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13),
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

  String _fmt(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

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
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: item.taken
                  ? AppColors.success.withOpacity(0.1)
                  : AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(Icons.medication,
                color: item.taken ? AppColors.success : AppColors.primary, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name,
                    style: TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15,
                        color: AppColors.textPrimary,
                        decoration: item.taken ? TextDecoration.lineThrough : null)),
                const SizedBox(height: 3),
                Text(item.dosage,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
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
              child: Text(_fmt(item.nextDoseTime!),
                  style: const TextStyle(color: AppColors.primary, fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: 12),
          ],
          GestureDetector(
            onTap: onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 28, height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: item.taken ? AppColors.success : Colors.transparent,
                border: Border.all(
                  color: item.taken ? AppColors.success : AppColors.textHint.withOpacity(0.5),
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
