import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/family_provider.dart';
import '../../../elderly/presentation/providers/health_metric_provider.dart';

class FamilyHealthScreen extends ConsumerStatefulWidget {
  const FamilyHealthScreen({super.key});

  @override
  ConsumerState<FamilyHealthScreen> createState() =>
      _FamilyHealthScreenState();
}

class _FamilyHealthScreenState extends ConsumerState<FamilyHealthScreen> {
  String _selectedPeriod = '7';

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(familyDashboardProvider);
    final elderlyId = dashboardState.data?.elderlyId;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Sức khỏe'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) => setState(() => _selectedPeriod = value),
            itemBuilder: (_) => [
              PopupMenuItem(
                value: '7',
                child: Text(
                  '7 ngày qua',
                  style: TextStyle(
                    fontWeight: _selectedPeriod == '7'
                        ? FontWeight.w600
                        : FontWeight.normal,
                  ),
                ),
              ),
              const PopupMenuItem(
                value: '30',
                child: Text('30 ngày qua'),
              ),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    _selectedPeriod == '7' ? '7 ngày' : '30 ngày',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 13,
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down, color: AppColors.primary),
                ],
              ),
            ),
          ),
        ],
      ),
      body: _buildBody(elderlyId),
    );
  }

  Widget _buildBody(String? elderlyId) {
    if (elderlyId == null) {
      return const Center(
        child: Text(
          'Chưa có người cao tuổi được liên kết',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
        ),
      );
    }

    final healthState = ref.watch(healthMetricProvider(elderlyId));

    if (healthState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (healthState.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 48),
              const SizedBox(height: 16),
              Text(
                healthState.error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.error, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () =>
                    ref.invalidate(healthMetricProvider(elderlyId)),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Thử lại'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (healthState.latestByType.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.health_and_safety, size: 48, color: AppColors.textHint),
            SizedBox(height: 16),
            Text(
              'Chưa có dữ liệu sức khỏe',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
            ),
          ],
        ),
      );
    }

    const order = ['BLOOD_PRESSURE', 'BLOOD_SUGAR', 'HEART_RATE', 'WEIGHT'];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final type in order)
          if (healthState.latestByType.containsKey(type)) ...[
            _HealthMetricSection(data: healthState.latestByType[type]!),
            const SizedBox(height: 12),
          ],
      ],
    );
  }
}





class _MetricConfig {
  final String title;
  final IconData icon;
  final Color iconColor;
  final String unit;

  const _MetricConfig({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.unit,
  });
}

const _metricConfigs = <String, _MetricConfig>{
  'BLOOD_PRESSURE': _MetricConfig(
    title: 'Huyết áp',
    icon: Icons.favorite,
    iconColor: AppColors.error,
    unit: 'mmHg',
  ),
  'BLOOD_SUGAR': _MetricConfig(
    title: 'Đường huyết',
    icon: Icons.water_drop,
    iconColor: Color(0xFF1565C0),
    unit: 'mmol/L',
  ),
  'HEART_RATE': _MetricConfig(
    title: 'Nhịp tim',
    icon: Icons.monitor_heart,
    iconColor: AppColors.secondary,
    unit: 'bpm',
  ),
  'WEIGHT': _MetricConfig(
    title: 'Cân nặng',
    icon: Icons.monitor_weight,
    iconColor: AppColors.warning,
    unit: 'kg',
  ),
};





class _StatusInfo {
  final String label;
  final Color color;
  const _StatusInfo(this.label, this.color);
}





class _HealthMetricSection extends StatelessWidget {
  final HealthMetricData data;

  const _HealthMetricSection({required this.data});

  _MetricConfig get _config => _metricConfigs[data.type]!;


  String get _latestValue {
    final unitStr = data.unit ?? _config.unit;
    if (data.type == 'BLOOD_PRESSURE' && data.valueSecondary != null) {
      return '${data.value}/${data.valueSecondary} $unitStr';
    }
    return '${data.value} $unitStr';
  }


  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final date = DateTime(dt.year, dt.month, dt.day);

    if (date == today) {
      return '${dt.hour.toString().padLeft(2, '0')}'
          ':${dt.minute.toString().padLeft(2, '0')} hôm nay';
    }
    if (date == today.subtract(const Duration(days: 1))) {
      return 'Hôm qua ${dt.hour.toString().padLeft(2, '0')}'
          ':${dt.minute.toString().padLeft(2, '0')}';
    }
    return '${dt.day}/${dt.month}/${dt.year}';
  }


  _StatusInfo _deriveStatus() {
    switch (data.type) {
      case 'BLOOD_PRESSURE':
        final sys = double.tryParse(data.value);
        final dia = data.valueSecondary != null
            ? double.tryParse(data.valueSecondary!)
            : null;
        if (sys != null && dia != null) {
          if (sys < 130 && dia < 85) {
            return const _StatusInfo('Bình thường', AppColors.success);
          }
          if (sys < 140 && dia < 90) {
            return const _StatusInfo('Cao nhẹ', AppColors.warning);
          }
          return const _StatusInfo('Cao', AppColors.error);
        }
        return const _StatusInfo('Cần theo dõi', AppColors.warning);

      case 'BLOOD_SUGAR':
        final v = double.tryParse(data.value);
        if (v != null) {
          if (v < 7.0) {
            return const _StatusInfo('Bình thường', AppColors.success);
          }
          if (v < 11.1) {
            return const _StatusInfo('Cao', AppColors.warning);
          }
          return const _StatusInfo('Rất cao', AppColors.error);
        }
        return const _StatusInfo('Cần theo dõi', AppColors.warning);

      case 'HEART_RATE':
        final v = double.tryParse(data.value);
        if (v != null) {
          if (v >= 60 && v <= 100) {
            return const _StatusInfo('Bình thường', AppColors.success);
          }
          if (v > 100) {
            return const _StatusInfo('Nhanh', AppColors.warning);
          }
          return const _StatusInfo('Chậm', AppColors.warning);
        }
        return const _StatusInfo('Cần theo dõi', AppColors.warning);

      case 'WEIGHT':
        return const _StatusInfo('Ghi nhận', AppColors.success);

      default:
        return const _StatusInfo('Bình thường', AppColors.success);
    }
  }


  String? get _avgValue {
    if (data.type == 'BLOOD_PRESSURE') return null;
    if (data.valueSecondary == null) return null;
    return 'TB: ${data.valueSecondary}';
  }


  @override
  Widget build(BuildContext context) {
    final config = _config;
    final statusInfo = _deriveStatus();
    final avgValue = _avgValue;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(config.icon, color: config.iconColor, size: 18),
              const SizedBox(width: 8),
              Text(
                config.title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusInfo.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  statusInfo.label,
                  style: TextStyle(
                    color: statusInfo.color,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
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
                    Text(
                      _latestValue,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      _formatTime(data.recordedAt),
                      style: const TextStyle(
                        color: AppColors.textHint,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (avgValue != null) ...[
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
                          Icon(Icons.show_chart,
                              color: config.iconColor, size: 20),
                          const SizedBox(height: 2),
                          Text(
                            avgValue,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),

          _buildMiniChart(config.iconColor),
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
