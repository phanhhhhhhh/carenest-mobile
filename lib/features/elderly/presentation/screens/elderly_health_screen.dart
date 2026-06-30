import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/health_metric_provider.dart';

class ElderlyHealthScreen extends ConsumerStatefulWidget {
  const ElderlyHealthScreen({super.key});

  @override
  ConsumerState<ElderlyHealthScreen> createState() =>
      _ElderlyHealthScreenState();
}

class _MetricConfig {
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final String unit;
  final List<double> normalRange;
  const _MetricConfig(
    this.label,
    this.icon,
    this.color,
    this.bgColor,
    this.unit, {
    this.normalRange = const [],
  });
}

class _ElderlyHealthScreenState extends ConsumerState<ElderlyHealthScreen> {
  String _elderlyId = '';
  bool _idLoaded = false;
  String _period = 'week';

  static const _metricConfigs = <String, _MetricConfig>{
    'BLOOD_PRESSURE': _MetricConfig(
      'Huyết áp',
      Icons.favorite,
      AppColors.error,
      Color(0xFFFFEBEE),
      'mmHg',
      normalRange: [90, 140],
    ),
    'BLOOD_GLUCOSE': _MetricConfig(
      'Đường huyết',
      Icons.water_drop,
      Color(0xFF1565C0),
      Color(0xFFE3F2FD),
      'mmol/L',
      normalRange: [3.9, 6.7],
    ),
    'HEART_RATE': _MetricConfig(
      'Nhịp tim',
      Icons.monitor_heart,
      AppColors.secondary,
      Color(0xFFE8F5E9),
      'bpm',
      normalRange: [60, 100],
    ),
    'WEIGHT': _MetricConfig(
      'Cân nặng',
      Icons.monitor_weight,
      AppColors.warning,
      Color(0xFFFFF3E0),
      'kg',
    ),
  };

  @override
  void initState() {
    super.initState();
    _loadUserId();
  }

  Future<void> _loadUserId() async {
    final id = await SecureStorage.getUserId();
    if (mounted) {
      setState(() {
        _elderlyId = id ?? '';
        _idLoaded = true;
      });
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inHours < 1) return '${diff.inMinutes}m trước';
    if (diff.inDays == 0) {
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m';
    }
    if (diff.inDays == 1) return 'Hôm qua';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${dt.day}/${dt.month}';
  }

  String _getStatus(HealthMetricData data) {
    final config = _metricConfigs[data.type];
    if (config == null || config.normalRange.isEmpty) return 'normal';
    final val = double.tryParse(data.value);
    if (val == null) return 'normal';
    final above = val > config.normalRange[1];
    final below = val < config.normalRange[0];
    if (above) return 'high';
    if (below) return 'low';
    return 'normal';
  }

  @override
  Widget build(BuildContext context) {
    if (!_idLoaded) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: _buildAppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final healthState = ref.watch(healthMetricProvider(_elderlyId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(),
      body: _buildBody(healthState),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddMetricSheet(context),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: const Text(
        'Health Metrics',
        style: TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
      ),
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
    );
  }

  Widget _buildBody(HealthMetricState state) {
    if (state.isLoading && state.latestByType.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.error != null && state.latestByType.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.textHint, size: 48),
            const SizedBox(height: 12),
            Text(
              state.error!,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () =>
                  ref.read(healthMetricProvider(_elderlyId).notifier).load(),
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildPeriodSelector(),
        const SizedBox(height: 16),
        _buildAiInsight(state),
        const SizedBox(height: 20),
        if (state.latestByType.isEmpty)
          _buildEmptyState()
        else ...[
          const Text(
            'Chỉ số mới nhất',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          ..._metricConfigs.entries.map((entry) {
            final data = state.latestByType[entry.key];
            return _MetricSection(
              config: entry.value,
              data: data,
              status: data != null ? _getStatus(data) : 'none',
              timeLabel: data != null ? _formatTime(data.recordedAt) : '',
              metrics: state.metrics.where((m) => m.type == entry.key).toList(),
            );
          }),
        ],
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildPeriodSelector() {
    return Row(
      children: [
        _PeriodChip(
          label: '7 ngày',
          selected: _period == 'week',
          onTap: () => setState(() => _period = 'week'),
        ),
        const SizedBox(width: 8),
        _PeriodChip(
          label: '30 ngày',
          selected: _period == 'month',
          onTap: () => setState(() => _period = 'month'),
        ),
      ],
    );
  }

  Widget _buildAiInsight(HealthMetricState state) {
    String insight;
    if (state.latestByType.isEmpty) {
      insight = 'Bắt đầu theo dõi sức khỏe bằng cách thêm chỉ số đầu tiên. '
          'Tôi sẽ giúp bạn phân tích xu hướng và đưa ra lời khuyên phù hợp!';
    } else {
      final abnormal = state.latestByType.entries
          .where((e) => _getStatus(e.value) != 'normal')
          .toList();
      if (abnormal.isEmpty) {
        insight = 'Các chỉ số của bạn hôm nay đều trong ngưỡng bình thường. '
            'Tiếp tục duy trì lối sống lành mạnh nhé!';
      } else {
        final names = abnormal
            .map((e) => _metricConfigs[e.key]?.label ?? e.key)
            .join(', ');
        insight = 'Chú ý: $names đang ngoài ngưỡng bình thường. '
            'Hãy theo dõi thêm và tham khảo ý kiến bác sĩ nếu tình trạng kéo dài.';
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8F5E9), Color(0xFFF1F8E9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.success.withOpacity(0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome,
                color: AppColors.success, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AI Insight',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  insight,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.monitor_heart_outlined,
                color: AppColors.primary, size: 40),
          ),
          const SizedBox(height: 16),
          const Text(
            'Chưa có dữ liệu sức khỏe',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Nhấn nút + để thêm chỉ số đầu tiên',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
        ],
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
            const Center(
              child: SizedBox(
                width: 40,
                child: Divider(thickness: 3, color: AppColors.textHint),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Thêm chỉ số sức khỏe',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            ..._metricConfigs.entries.map((e) => ListTile(
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: e.value.bgColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(e.value.icon, color: e.value.color, size: 22),
                  ),
                  title: Text(e.value.label,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary)),
                  subtitle: Text('Đơn vị: ${e.value.unit}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right,
                      color: AppColors.textHint),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showValueDialog(
                        context, e.key, e.value.label, e.value.unit);
                  },
                )),
          ],
        ),
      ),
    );
  }

  void _showValueDialog(
      BuildContext context, String type, String label, String unit) {
    final valueCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Nhập $label'),
        content: TextFormField(
          controller: valueCtrl,
          autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Giá trị ($unit)',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () {
              if (valueCtrl.text.trim().isNotEmpty) {
                ref
                    .read(healthMetricProvider(_elderlyId).notifier)
                    .addMetric(
                      type: type,
                      value: valueCtrl.text.trim(),
                      unit: unit,
                    );
                Navigator.pop(context);
              }
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _PeriodChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

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
            color: selected ? AppColors.primary : AppColors.textHint.withOpacity(0.3),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _MetricSection extends StatelessWidget {
  final _MetricConfig config;
  final HealthMetricData? data;
  final String status;
  final String timeLabel;
  final List<HealthMetricData> metrics;

  const _MetricSection({
    required this.config,
    required this.data,
    required this.status,
    required this.timeLabel,
    required this.metrics,
  });

  String _statusLabel() {
    switch (status) {
      case 'high':
        return 'Cao';
      case 'low':
        return 'Thấp';
      case 'normal':
        return 'Bình thường';
      default:
        return '';
    }
  }

  Color _statusColor() {
    switch (status) {
      case 'high':
        return AppColors.error;
      case 'low':
        return AppColors.warning;
      case 'normal':
        return AppColors.success;
      default:
        return AppColors.textHint;
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayValue = data != null
        ? (data!.type == 'BLOOD_PRESSURE' && data!.valueSecondary != null
            ? '${data!.value}/${data!.valueSecondary}'
            : data!.value)
        : '--';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: config.bgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(config.icon, color: config.color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  config.label,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (status != 'none')
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor().withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: _statusColor().withOpacity(0.3)),
                  ),
                  child: Text(
                    _statusLabel(),
                    style: TextStyle(
                      color: _statusColor(),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, color: AppColors.textHint),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                displayValue,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  config.unit,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              if (timeLabel.isNotEmpty) ...[
                const SizedBox(width: 10),
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    '• $timeLabel',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textHint,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),
          _buildMiniChart(),
        ],
      ),
    );
  }

  Widget _buildMiniChart() {
    if (metrics.length < 2) {
      return Container(
        height: 50,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Center(
          child: Text(
            'Cần thêm dữ liệu để hiển thị biểu đồ',
            style: TextStyle(color: AppColors.textHint, fontSize: 12),
          ),
        ),
      );
    }

    final sorted = List<HealthMetricData>.from(metrics)
      ..sort((a, b) => a.recordedAt.compareTo(b.recordedAt));
    final values = sorted
        .map((m) => double.tryParse(m.value) ?? 0.0)
        .toList();
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    final minVal = values.reduce((a, b) => a < b ? a : b);
    final range = (maxVal - minVal).clamp(1, double.infinity);

    return SizedBox(
      height: 50,
      child: CustomPaint(
        size: const Size(double.infinity, 50),
        painter: _MiniChartPainter(values: values, minVal: minVal.toDouble(), range: range.toDouble(), color: config.color),
      ),
    );
  }
}

class _MiniChartPainter extends CustomPainter {
  final List<double> values;
  final double minVal;
  final double range;
  final Color color;

  _MiniChartPainter({
    required this.values,
    required this.minVal,
    required this.range,
    required this.color,
  });

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

    // Draw last point dot
    final lastX = (values.length - 1) * stepX;
    final lastY = size.height - ((values.last - minVal) / range * size.height * 0.8) - size.height * 0.1;
    canvas.drawCircle(Offset(lastX, lastY), 3.5, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _MiniChartPainter oldDelegate) => true;
}
