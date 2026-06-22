import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class ElderlyHealthScreen extends StatelessWidget {
  const ElderlyHealthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Sức khỏe'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: () => _showAddMetricSheet(context),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Nhập chỉ số'),
            style: TextButton.styleFrom(foregroundColor: AppColors.primary),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildAiInsight(),
          const SizedBox(height: 16),
          const Text(
            'Chỉ số gần nhất',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  icon: Icons.favorite,
                  iconColor: AppColors.error,
                  label: 'Huyết áp',
                  value: '120/80',
                  unit: 'mmHg',
                  status: 'Bình thường',
                  statusColor: AppColors.success,
                  time: '08:30 hôm nay',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MetricCard(
                  icon: Icons.water_drop,
                  iconColor: const Color(0xFF1565C0),
                  label: 'Đường huyết',
                  value: '5.5',
                  unit: 'mmol/L',
                  status: 'Bình thường',
                  statusColor: AppColors.success,
                  time: '07:00 hôm nay',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  icon: Icons.monitor_heart,
                  iconColor: AppColors.secondary,
                  label: 'Nhịp tim',
                  value: '72',
                  unit: 'bpm',
                  status: 'Bình thường',
                  statusColor: AppColors.success,
                  time: '08:30 hôm nay',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MetricCard(
                  icon: Icons.monitor_weight,
                  iconColor: AppColors.warning,
                  label: 'Cân nặng',
                  value: '65',
                  unit: 'kg',
                  status: 'Ổn định',
                  statusColor: AppColors.success,
                  time: 'Hôm qua',
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'Biểu đồ 7 ngày qua',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          _buildChartPlaceholder(),
        ],
      ),
    );
  }

  Widget _buildAiInsight() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Các chỉ số của bạn hôm nay đều trong ngưỡng bình thường. Huyết áp ổn định, tiếp tục duy trì lối sống lành mạnh nhé!',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChartPlaceholder() {
    return Container(
      height: 160,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.textHint.withOpacity(0.2)),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bar_chart, size: 40, color: AppColors.textHint),
            SizedBox(height: 8),
            Text('Biểu đồ huyết áp 7 ngày',
                style: TextStyle(color: AppColors.textHint, fontSize: 13)),
            Text('(fl_chart sẽ được tích hợp tại đây)',
                style: TextStyle(color: AppColors.textHint, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  void _showAddMetricSheet(BuildContext context) {
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
            const Text('Nhập chỉ số sức khỏe',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 16),
            ...[
              ('Huyết áp (mmHg)', Icons.favorite, AppColors.error),
              ('Đường huyết (mmol/L)', Icons.water_drop, const Color(0xFF1565C0)),
              ('Nhịp tim (bpm)', Icons.monitor_heart, AppColors.secondary),
              ('Cân nặng (kg)', Icons.monitor_weight, AppColors.warning),
            ].map((item) => ListTile(
                  leading: Icon(item.$2, color: item.$3),
                  title: Text(item.$1),
                  trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
                  onTap: () => Navigator.pop(ctx),
                )),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final String unit;
  final String status;
  final Color statusColor;
  final String time;

  const _MetricCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.unit,
    required this.status,
    required this.statusColor,
    required this.time,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
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
          Row(
            children: [
              Icon(icon, color: iconColor, size: 18),
              const SizedBox(width: 6),
              Text(label,
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          Text(unit,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 11)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(status,
                style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w500)),
          ),
          const SizedBox(height: 4),
          Text(time,
              style:
                  const TextStyle(color: AppColors.textHint, fontSize: 11)),
        ],
      ),
    );
  }
}
