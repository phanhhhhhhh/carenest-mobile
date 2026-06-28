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
  String? _lastLoadedElderlyId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensureLoaded());
  }

  void _ensureLoaded() {
    final elderlyId = ref.read(familyDashboardProvider).data?.elderlyId;
    if (elderlyId != null && elderlyId != _lastLoadedElderlyId) {
      _lastLoadedElderlyId = elderlyId;
      ref.read(medicationsProvider.notifier).load(elderlyId: elderlyId);
    }
  }

  void _showAddMedicationDialog() {
    final elderlyId = ref.read(familyDashboardProvider).data?.elderlyId;
    if (elderlyId == null) return;

    final nameCtrl = TextEditingController();
    final dosageCtrl = TextEditingController();
    final instrCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Thêm thuốc'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Tên thuốc',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: dosageCtrl,
              decoration: const InputDecoration(
                labelText: 'Liều lượng',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: instrCtrl,
              decoration: const InputDecoration(
                labelText: 'Hướng dẫn (không bắt buộc)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.isEmpty || dosageCtrl.text.isEmpty) return;
              Navigator.pop(ctx);
              await ref.read(medicationsProvider.notifier).addMedication(
                    name: nameCtrl.text,
                    dosage: dosageCtrl.text,
                    instructions:
                        instrCtrl.text.isNotEmpty ? instrCtrl.text : null,
                    elderlyId: elderlyId,
                  );
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Listen for elderlyId changes from the family dashboard
    ref.listen<FamilyDashboardState>(familyDashboardProvider, (_, next) {
      final nextId = next.data?.elderlyId;
      if (nextId != null && nextId != _lastLoadedElderlyId) {
        _lastLoadedElderlyId = nextId;
        ref.read(medicationsProvider.notifier).load(elderlyId: nextId);
      }
    });

    final dashState = ref.watch(familyDashboardProvider);
    final medState = ref.watch(medicationsProvider);
    final elderlyId = dashState.data?.elderlyId;

    // Dashboard still loading and no elderly info yet
    if (dashState.isLoading && elderlyId == null) {
      return _buildScaffold(
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 12),
              Text(
                'Đang tải thông tin...',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    // No elderly linked to this family account
    if (elderlyId == null) {
      return _buildScaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.elderly, size: 64, color: AppColors.textHint),
              const SizedBox(height: 16),
              const Text(
                'Chưa liên kết người cao tuổi',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Loading medications for the linked elderly
    if (medState.isLoading) {
      return _buildScaffold(
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // Error loading medications
    if (medState.error != null) {
      return _buildScaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline,
                  size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text(
                medState.error!,
                style: const TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref
                      .read(medicationsProvider.notifier)
                      .load(elderlyId: elderlyId);
                },
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    // --- Real data ---
    final items = medState.items;
    final total = items.length;
    final takenCount = items.where((m) => m.taken).length;
    final complianceValue = total > 0 ? takenCount / total : 0.0;
    final compliancePercent = (complianceValue * 100).round();

    // Sort schedule items by nextDoseTime
    final scheduleItems = List<MedicationItem>.from(items)
      ..sort((a, b) {
        if (a.nextDoseTime == null && b.nextDoseTime == null) return 0;
        if (a.nextDoseTime == null) return 1;
        if (b.nextDoseTime == null) return -1;
        return a.nextDoseTime!.compareTo(b.nextDoseTime!);
      });

    // Group medications by name+dosage for the medication list
    final Map<String, List<MedicationItem>> grouped = {};
    for (final item in items) {
      final key = '${item.name}_${item.dosage}';
      grouped.putIfAbsent(key, () => []);
      grouped[key]!.add(item);
    }

    return _buildScaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildComplianceCard(compliancePercent, complianceValue, takenCount, total),
          const SizedBox(height: 16),
          _buildTodaySchedule(scheduleItems),
          const SizedBox(height: 16),
          _buildMedicationList(grouped),
        ],
      ),
      fab: FloatingActionButton.extended(
        onPressed: _showAddMedicationDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Thêm thuốc'),
      ),
    );
  }

  Scaffold _buildScaffold({required Widget body, Widget? fab}) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Quản lý thuốc'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: body,
      floatingActionButton: fab,
    );
  }

  Widget _buildComplianceCard(
      int percent, double progress, int taken, int total) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tuân thủ uống thuốc tuần này',
              style:
                  TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                '$percent%',
                style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppColors.success),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress.clamp(0.0, 1.0),
                        minHeight: 8,
                        backgroundColor: const Color(0xFFE8F5E9),
                        valueColor:
                            const AlwaysStoppedAnimation(AppColors.success),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('$taken/$total liều đã uống đúng giờ',
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTodaySchedule(List<MedicationItem> scheduleItems) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Lịch hôm nay',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        if (scheduleItems.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text('Chưa có thuốc nào trong lịch hôm nay',
                style: TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: scheduleItems.asMap().entries.map((e) {
                final isLast = e.key == scheduleItems.length - 1;
                final time = e.value.nextDoseTime;
                final timeStr = time != null
                    ? '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}'
                    : '--:--';
                return _ScheduleTile(
                  time: timeStr,
                  med: '${e.value.name} ${e.value.dosage}',
                  done: e.value.taken,
                  isLast: isLast,
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildMedicationList(Map<String, List<MedicationItem>> grouped) {
    const iconColors = [
      AppColors.error,
      Color(0xFF1565C0),
      AppColors.warning,
      AppColors.success,
      AppColors.primary,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tất cả thuốc',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        if (grouped.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text('Chưa có thuốc nào',
                style: TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
          )
        else
          ...grouped.entries.toList().asMap().entries.map((entry) {
            final idx = entry.key;
            final name = entry.value.value.first.name;
            final dose = entry.value.value.first.dosage;
            final times = entry.value.value
                .map((m) => m.nextDoseTime != null
                    ? '${m.nextDoseTime!.hour.toString().padLeft(2, '0')}:${m.nextDoseTime!.minute.toString().padLeft(2, '0')}'
                    : null)
                .where((t) => t != null)
                .join(', ');
            final color = iconColors[idx % iconColors.length];
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _MedManageCard(
                name: name,
                dose: dose,
                schedule: times.isNotEmpty ? times : 'Chưa có lịch',
                iconColor: color,
              ),
            );
          }),
      ],
    );
  }
}

class _ScheduleItem {
  final String time;
  final String med;
  final bool done;
  _ScheduleItem(this.time, this.med, this.done);
}

class _ScheduleTile extends StatelessWidget {
  final String time;
  final String med;
  final bool done;
  final bool isLast;

  const _ScheduleTile({
    required this.time,
    required this.med,
    required this.done,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Text(
            time,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: done ? AppColors.textHint : AppColors.textPrimary,
            ),
          ),
          title: Text(
            med,
            style: TextStyle(
              fontSize: 14,
              color: done ? AppColors.textHint : AppColors.textPrimary,
              decoration: done ? TextDecoration.lineThrough : null,
            ),
          ),
          trailing: done
              ? const Icon(Icons.check_circle,
                  color: AppColors.success, size: 22)
              : const Icon(Icons.circle_outlined,
                  color: AppColors.textHint, size: 22),
        ),
        if (!isLast) const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    );
  }
}

class _MedManageCard extends StatelessWidget {
  final String name;
  final String dose;
  final String schedule;
  final Color iconColor;

  const _MedManageCard({
    required this.name,
    required this.dose,
    required this.schedule,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.medication, color: iconColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$name $dose',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.textPrimary)),
                Text(schedule,
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.more_vert, color: AppColors.textHint),
          ),
        ],
      ),
    );
  }
}
