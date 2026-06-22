import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class FamilyHealthScreen extends StatelessWidget {
  const FamilyHealthScreen({super.key});

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
          PopupMenuButton<String>(
            onSelected: (_) {},
            itemBuilder: (_) => const [
              PopupMenuItem(value: '7', child: Text('7 ngày qua')),
              PopupMenuItem(value: '30', child: Text('30 ngày qua')),
            ],
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text('7 ngày', style: TextStyle(color: AppColors.primary, fontSize: 13)),
                  Icon(Icons.arrow_drop_down, color: AppColors.primary),
                ],
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _HealthMetricSection(
            title: 'Huyết áp',
            icon: Icons.favorite,
            iconColor: AppColors.error,
            latestValue: '120/80 mmHg',
            latestTime: '08:30 hôm nay',
            status: 'Bình thường',
            statusColor: AppColors.success,
            avgValue: 'TB: 122/82',
          ),
          SizedBox(height: 12),
          _HealthMetricSection(
            title: 'Đường huyết',
            icon: Icons.water_drop,
            iconColor: Color(0xFF1565C0),
            latestValue: '5.5 mmol/L',
            latestTime: '07:00 hôm nay',
            status: 'Bình thường',
            statusColor: AppColors.success,
            avgValue: 'TB: 5.7',
          ),
          SizedBox(height: 12),
          _HealthMetricSection(
            title: 'Nhịp tim',
            icon: Icons.monitor_heart,
            iconColor: AppColors.secondary,
            latestValue: '72 bpm',
            latestTime: '08:30 hôm nay',
            status: 'Ổn định',
            statusColor: AppColors.success,
            avgValue: 'TB: 74',
          ),
          SizedBox(height: 12),
          _HealthMetricSection(
            title: 'Cân nặng',
            icon: Icons.monitor_weight,
            iconColor: AppColors.warning,
            latestValue: '65 kg',
            latestTime: 'Hôm qua',
            status: 'Ổn định',
            statusColor: AppColors.success,
            avgValue: 'TB: 65.2',
          ),
        ],
      ),
    );
  }
}

class _HealthMetricSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final String latestValue;
  final String latestTime;
  final String status;
  final Color statusColor;
  final String avgValue;

  const _HealthMetricSection({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.latestValue,
    required this.latestTime,
    required this.status,
    required this.statusColor,
    required this.avgValue,
  });

  @override
  Widget build(BuildContext context) {
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
          Row(
            children: [
              Icon(icon, color: iconColor, size: 18),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary)),
              const Spacer(),
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
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(latestValue,
                        style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary)),
                    Text(latestTime,
                        style: const TextStyle(
                            color: AppColors.textHint, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.show_chart, color: iconColor, size: 20),
                        const SizedBox(height: 2),
                        Text(avgValue,
                            style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 11)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildMiniChart(iconColor),
        ],
      ),
    );
  }

  Widget _buildMiniChart(Color color) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Text(
          'Biểu đồ 7 ngày (fl_chart)',
          style: TextStyle(color: color.withOpacity(0.5), fontSize: 11),
        ),
      ),
    );
  }
}
