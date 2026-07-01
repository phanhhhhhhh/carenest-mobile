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
  String _period = 'week';

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(familyDashboardProvider);
    final elderlyId = dashboardState.data?.elderlyId;
    final elderlyName = dashboardState.data?.elderlyName ?? 'Người thân';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Sức khỏe — $elderlyName',
          style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _buildBody(elderlyId),
    );
  }

  Widget _buildBody(String? elderlyId) {
    if (elderlyId == null) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.people_outline, size: 56, color: AppColors.textHint),
            SizedBox(height: 16),
            Text('Chưa có người cao tuổi được liên kết',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
          ],
        ),
      );
    }

    final healthState = ref.watch(healthMetricProvider(elderlyId));

    if (healthState.isLoading && healthState.latestByType.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (healthState.error != null && healthState.latestByType.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 48),
              const SizedBox(height: 16),
              Text(healthState.error!, textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.error, fontSize: 14)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.invalidate(healthMetricProvider(elderlyId)),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Thử lại'),
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
            Icon(Icons.health_and_safety, size: 56, color: AppColors.textHint),
            SizedBox(height: 16),
            Text('Chưa có dữ liệu sức khỏe',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
          ],
        ),
      );
    }

    const order = ['BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'HEART_RATE', 'WEIGHT'];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildPeriodSelector(),
        const SizedBox(height: 16),
        for (final type in order)
          if (healthState.latestByType.containsKey(type)) ...[
            _buildMetricSection(type, healthState.latestByType[type]!,
                healthState.metrics.where((m) => m.type == type).toList()),
            const SizedBox(height: 12),
          ],
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildPeriodSelector() {
    return Row(
      children: [
        _PeriodChip(label: '7 ngày', selected: _period == 'week',
            onTap: () => setState(() => _period = 'week')),
        const SizedBox(width: 8),
        _PeriodChip(label: '30 ngày', selected: _period == 'month',
            onTap: () => setState(() => _period = 'month')),
      ],
    );
  }

  Widget _buildMetricSection(
      String type, HealthMetricData latest, List<HealthMetricData> all) {
    final config = _metricDefs[type]!;
    final displayValue = type == 'BLOOD_PRESSURE' && latest.valueSecondary != null
        ? '${latest.value}/${latest.valueSecondary}'
        : latest.value;
    final unitLabel = latest.unit ?? config.unit;
    final status = _deriveStatus(type, latest);
    final timeLabel = _formatTime(latest.recordedAt);

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
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: config.iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(config.icon, color: config.iconColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(config.title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: status.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(status.label,
                    style: TextStyle(color: status.color, fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(displayValue,
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary)),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(unitLabel,
                    style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
              ),
              if (timeLabel.isNotEmpty) ...[
                const SizedBox(width: 10),
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text('• $timeLabel',
                      style: const TextStyle(fontSize: 12, color: AppColors.textHint)),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),
          _buildMiniChart(all, config.iconColor),
        ],
      ),
    );
  }

  Widget _buildMiniChart(List<HealthMetricData> metrics, Color color) {
    if (metrics.length < 2) {
      return Container(
        height: 50,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Center(
          child: Text('Cần thêm dữ liệu',
              style: TextStyle(color: AppColors.textHint, fontSize: 12)),
        ),
      );
    }

    final sorted = List<HealthMetricData>.from(metrics)
      ..sort((a, b) => a.recordedAt.compareTo(b.recordedAt));
    final values = sorted.map((m) => double.tryParse(m.value) ?? 0.0).toList();
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    final minVal = values.reduce((a, b) => a < b ? a : b);
    final range = (maxVal - minVal).clamp(1, double.infinity);

    return SizedBox(
      height: 50,
      child: CustomPaint(
        size: const Size(double.infinity, 50),
        painter: _LineChart(values: values, minVal: minVal.toDouble(), range: range.toDouble(), color: color),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inHours < 1) return '${diff.inMinutes}m trước';
    if (diff.inDays == 0) return '${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    if (diff.inDays == 1) return 'Hôm qua';
    return '${dt.day}/${dt.month}';
  }

  _Status _deriveStatus(String type, HealthMetricData data) {
    switch (type) {
      case 'BLOOD_PRESSURE':
        final sys = double.tryParse(data.value);
        if (sys != null && sys < 130) return _Status('Bình thường', AppColors.success);
        if (sys != null && sys < 140) return _Status('Cao nhẹ', AppColors.warning);
        return _Status('Cao', AppColors.error);
      case 'BLOOD_GLUCOSE':
        final v = double.tryParse(data.value);
        if (v != null && v < 7.0) return _Status('Bình thường', AppColors.success);
        if (v != null && v < 11.1) return _Status('Cao', AppColors.warning);
        return _Status('Rất cao', AppColors.error);
      case 'HEART_RATE':
        final v = double.tryParse(data.value);
        if (v != null && v >= 60 && v <= 100) return _Status('Bình thường', AppColors.success);
        return _Status('Bất thường', AppColors.warning);
      default:
        return _Status('Ghi nhận', AppColors.success);
    }
  }
}

class _Status {
  final String label;
  final Color color;
  const _Status(this.label, this.color);
}

class _MetricDef {
  final String title;
  final IconData icon;
  final Color iconColor;
  final String unit;
  const _MetricDef(this.title, this.icon, this.iconColor, this.unit);
}

const _metricDefs = <String, _MetricDef>{
  'BLOOD_PRESSURE': _MetricDef('Huyết áp', Icons.favorite, AppColors.error, 'mmHg'),
  'BLOOD_GLUCOSE': _MetricDef('Đường huyết', Icons.water_drop, Color(0xFF1565C0), 'mmol/L'),
  'HEART_RATE': _MetricDef('Nhịp tim', Icons.monitor_heart, AppColors.secondary, 'bpm'),
  'WEIGHT': _MetricDef('Cân nặng', Icons.monitor_weight, AppColors.warning, 'kg'),
};

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _PeriodChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? AppColors.primary : AppColors.textHint.withOpacity(0.3)),
        ),
        child: Text(label,
            style: TextStyle(
                color: selected ? Colors.white : AppColors.textSecondary,
                fontSize: 13, fontWeight: FontWeight.w600)),
      ),
    );
  }
}

class _LineChart extends CustomPainter {
  final List<double> values;
  final double minVal;
  final double range;
  final Color color;
  _LineChart({required this.values, required this.minVal, required this.range, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [color.withOpacity(0.3), color.withOpacity(0.02)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    final fillPath = Path();
    final stepX = size.width / (values.length - 1);

    for (int i = 0; i < values.length; i++) {
      final x = i * stepX;
      final y = size.height - ((values[i] - minVal) / range * size.height * 0.8) - size.height * 0.1;
      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }
    fillPath.lineTo((values.length - 1) * stepX, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);
    final lx = (values.length - 1) * stepX;
    final ly = size.height - ((values.last - minVal) / range * size.height * 0.8) - size.height * 0.1;
    canvas.drawCircle(Offset(lx, ly), 3.5, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _LineChart old) => true;
}
