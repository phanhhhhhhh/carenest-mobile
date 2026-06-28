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
  final String unit;
  const _MetricConfig(this.label, this.icon, this.color, this.unit);
}

class _ElderlyHealthScreenState extends ConsumerState<ElderlyHealthScreen> {
  String _elderlyId = '';
  bool _idLoaded = false;

  static const _metricConfigs = <String, _MetricConfig>{
    'BLOOD_PRESSURE':
        _MetricConfig('Huyết áp', Icons.favorite, AppColors.error, 'mmHg'),
    'BLOOD_SUGAR': _MetricConfig(
        'Đường huyết', Icons.water_drop, Color(0xFF1565C0), 'mmol/L'),
    'HEART_RATE': _MetricConfig(
        'Nhịp tim', Icons.monitor_heart, AppColors.secondary, 'bpm'),
    'WEIGHT':
        _MetricConfig('Cân nặng', Icons.monitor_weight, AppColors.warning, 'kg'),
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
    if (diff.inHours < 1) return '${diff.inMinutes} phút trước';
    if (diff.inDays == 0) {
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m hôm nay';
    }
    if (diff.inDays == 1) return 'Hôm qua';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    if (!_idLoaded) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Sức khỏe'),
          backgroundColor: AppColors.surface,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final healthState = ref.watch(healthMetricProvider(_elderlyId));

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
      body: _buildBody(healthState),
    );
  }

  Widget _buildBody(HealthMetricState state) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              state.error!,
              style: const TextStyle(color: AppColors.error, fontSize: 14),
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
        if (state.latestByType.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(
              child: Text(
                'Chưa có dữ liệu sức khỏe',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
            ),
          )
        else
          ..._buildMetricRows(state.latestByType),
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
    );
  }

  Iterable<Widget> _buildMetricRows(Map<String, HealthMetricData> latestByType) sync* {
    final entries = latestByType.entries.toList();
    for (int i = 0; i < entries.length; i += 2) {
      yield Padding(
        padding: EdgeInsets.only(bottom: i + 2 < entries.length ? 10 : 0),
        child: Row(
          children: [
            Expanded(child: _buildMetricCard(entries[i])),
            if (i + 1 < entries.length) ...[
              const SizedBox(width: 10),
              Expanded(child: _buildMetricCard(entries[i + 1])),
            ],
          ],
        ),
      );
    }
  }

  Widget _buildMetricCard(MapEntry<String, HealthMetricData> entry) {
    final config = _metricConfigs[entry.key];
    final data = entry.value;
    final displayValue =
        entry.key == 'BLOOD_PRESSURE' && data.valueSecondary != null
            ? '${data.value}/${data.valueSecondary}'
            : data.value;
    final unitLabel = config?.unit ?? data.unit ?? '';
    final time = _formatTime(data.recordedAt);

    return Container(
      padding: const EdgeInsets.all(14),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                config?.icon ?? Icons.monitor_heart,
                color: config?.color ?? AppColors.primary,
                size: 18,
              ),
              const SizedBox(width: 6),
              Text(
                config?.label ?? entry.key,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            displayValue,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          Text(unitLabel,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 11)),
          const SizedBox(height: 6),
          Text(time,
              style:
                  const TextStyle(color: AppColors.textHint, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildAiInsight() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Các chỉ số của bạn hôm nay đều trong ngưỡng bình thường. '
              'Huyết áp ổn định, tiếp tục duy trì lối sống lành mạnh nhé!',
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
        border: Border.all(color: AppColors.textHint.withValues(alpha: 0.2)),
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
            const Text('Chọn loại chỉ số',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 16),
            ..._metricConfigs.entries.map((e) => ListTile(
                  leading: Icon(e.value.icon, color: e.value.color),
                  title: Text('${e.value.label} (${e.value.unit})'),
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
        title: Text('Nhập $label'),
        content: TextFormField(
          controller: valueCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Giá trị ($unit)',
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
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
