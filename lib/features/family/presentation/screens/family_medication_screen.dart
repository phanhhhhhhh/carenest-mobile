import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class FamilyMedicationScreen extends StatelessWidget {
  const FamilyMedicationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Quản lý thuốc'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildComplianceCard(),
          const SizedBox(height: 16),
          _buildTodaySchedule(),
          const SizedBox(height: 16),
          _buildMedicationList(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Thêm thuốc'),
      ),
    );
  }

  Widget _buildComplianceCard() {
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
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Text(
                '85%',
                style: TextStyle(
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
                      child: const LinearProgressIndicator(
                        value: 0.85,
                        minHeight: 8,
                        backgroundColor: Color(0xFFE8F5E9),
                        valueColor:
                            AlwaysStoppedAnimation(AppColors.success),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text('17/20 liều đã uống đúng giờ',
                        style: TextStyle(
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

  Widget _buildTodaySchedule() {
    final schedule = [
      _ScheduleItem('07:00', 'Amlodipine 5mg', true),
      _ScheduleItem('08:00', 'Metformin 500mg', true),
      _ScheduleItem('12:00', 'Metformin 500mg', false),
      _ScheduleItem('18:00', 'Metformin 500mg', false),
      _ScheduleItem('21:00', 'Atorvastatin 20mg', false),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Lịch hôm nay',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: schedule.asMap().entries.map((e) {
              final isLast = e.key == schedule.length - 1;
              return _ScheduleTile(item: e.value, isLast: isLast);
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildMedicationList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tất cả thuốc',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        _MedManageCard(
          name: 'Amlodipine',
          dose: '5mg',
          schedule: '07:00 & 19:00',
          iconColor: AppColors.error,
        ),
        const SizedBox(height: 8),
        _MedManageCard(
          name: 'Metformin',
          dose: '500mg',
          schedule: '08:00, 12:00 & 18:00',
          iconColor: const Color(0xFF1565C0),
        ),
        const SizedBox(height: 8),
        _MedManageCard(
          name: 'Atorvastatin',
          dose: '20mg',
          schedule: '21:00',
          iconColor: AppColors.warning,
        ),
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
  final _ScheduleItem item;
  final bool isLast;

  const _ScheduleTile({required this.item, required this.isLast});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Text(
            item.time,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: item.done ? AppColors.textHint : AppColors.textPrimary,
            ),
          ),
          title: Text(
            item.med,
            style: TextStyle(
              fontSize: 14,
              color: item.done ? AppColors.textHint : AppColors.textPrimary,
              decoration: item.done ? TextDecoration.lineThrough : null,
            ),
          ),
          trailing: item.done
              ? const Icon(Icons.check_circle, color: AppColors.success, size: 22)
              : const Icon(Icons.circle_outlined, color: AppColors.textHint, size: 22),
        ),
        if (!isLast)
          const Divider(height: 1, indent: 16, endIndent: 16),
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
