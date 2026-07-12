import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/services/gemini_service.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/health_metric_provider.dart';
import '../providers/google_fit_provider.dart';
import '../../../family/presentation/providers/health_threshold_provider.dart';
import 'package:url_launcher/url_launcher.dart';

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

  // AI Insight state
  String? _aiInsight;
  bool _aiLoading = false;
  String? _aiError;

  static const _metricConfigs = <String, _MetricConfig>{
    'BLOOD_PRESSURE': _MetricConfig(
      'Blood Pressure',
      Icons.favorite,
      AppColors.error,
      Color(0xFFFFEBEE),
      'mmHg',
      normalRange: [90, 140],
    ),
    'BLOOD_GLUCOSE': _MetricConfig(
      'Blood Sugar',
      Icons.water_drop,
      Color(0xFF1565C0),
      Color(0xFFE3F2FD),
      'mmol/L',
      normalRange: [3.9, 6.7],
    ),
    'HEART_RATE': _MetricConfig(
      'Heart Rate',
      Icons.monitor_heart,
      AppColors.secondary,
      Color(0xFFE8F5E9),
      'bpm',
      normalRange: [60, 100],
    ),
    'WEIGHT': _MetricConfig(
      'Weight',
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
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays == 0) {
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m';
    }
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${dt.day}/${dt.month}';
  }

  String _getStatus(HealthMetricData data) {
    // Try backend thresholds first
    if (_elderlyId.isNotEmpty) {
      final threshold = ref.read(healthThresholdProvider(_elderlyId).notifier).findFor(data.type);
      if (threshold != null) {
        final val = double.tryParse(data.value);
        if (val != null) {
          if (threshold.minValue != null && val < threshold.minValue!) return 'low';
          if (threshold.maxValue != null && val > threshold.maxValue!) return 'high';
          return 'normal';
        }
      }
    }

    // Fallback to built-in config
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
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: 'googleFit',
            mini: true,
            onPressed: () => _handleGoogleFit(),
            backgroundColor: AppColors.secondary,
            child: const Icon(Icons.sync, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 12),
          FloatingActionButton(
            heroTag: 'addMetric',
            onPressed: () => _showAddMetricSheet(context),
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Future<void> _handleGoogleFit() async {
    if (_elderlyId.isEmpty) return;
    final fitNotifier = ref.read(googleFitProvider(_elderlyId).notifier);
    final state = ref.read(googleFitProvider(_elderlyId));

    if (state.isConnected) {
      // Already connected — offer sync or disconnect
      final action = await showModalBottomSheet<String>(
        context: context,
        shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        builder: (ctx) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.sync, color: AppColors.primary),
                title: const Text('Sync Now'),
                subtitle: const Text('Pull latest data from Google Fit'),
                onTap: () => Navigator.pop(ctx, 'sync'),
              ),
              ListTile(
                leading: const Icon(Icons.link_off, color: AppColors.error),
                title: const Text('Disconnect'),
                subtitle: const Text('Stop syncing with Google Fit'),
                onTap: () => Navigator.pop(ctx, 'disconnect'),
              ),
            ],
          ),
        ),
      );

      if (action == 'sync') {
        await fitNotifier.syncNow();
        if (mounted) {
          ref.read(healthMetricProvider(_elderlyId).notifier).load();
        }
      } else if (action == 'disconnect') {
        await fitNotifier.disconnect();
      }
    } else {
      // Not connected — get auth URL
      final url = await fitNotifier.connect();
      if (url != null && mounted) {
        try {
          await launchUrl(Uri.parse(url),
              mode: LaunchMode.externalApplication);
        } catch (_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Could not open browser'),
                  backgroundColor: AppColors.error),
            );
          }
        }
      }
    }
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
      actions: [
        IconButton(
          icon: const Icon(Icons.assessment, color: AppColors.primary),
          tooltip: 'Health Report',
          onPressed: () => context.push('/health-report'),
        ),
      ],
    );
  }

  Widget _buildBody(HealthMetricState state) {
    // Trigger AI insight loading when data first arrives or changes
    if (!_aiLoading && _aiInsight == null && state.latestByType.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _loadAiInsight(state);
      });
    }

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
              child: const Text('Retry'),
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
            'Latest Readings',
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
          label: '7 days',
          selected: _period == 'week',
          onTap: () {
            setState(() => _period = 'week');
            if (_elderlyId.isNotEmpty) {
              ref.read(healthMetricProvider(_elderlyId).notifier).loadPeriod('week');
            }
          },
        ),
        const SizedBox(width: 8),
        _PeriodChip(
          label: '30 days',
          selected: _period == 'month',
          onTap: () {
            setState(() => _period = 'month');
            if (_elderlyId.isNotEmpty) {
              ref.read(healthMetricProvider(_elderlyId).notifier).loadPeriod('month');
            }
          },
        ),
      ],
    );
  }

  Future<void> _loadAiInsight(HealthMetricState state) async {
    if (state.latestByType.isEmpty) {
      setState(() {
        _aiInsight = 'Start tracking your health by adding your first reading. '
            'I will help you analyze trends and provide personalized advice!';
        _aiLoading = false;
        _aiError = null;
      });
      return;
    }

    final hasGemini = AppConfig.geminiApiKey != 'YOUR_GEMINI_API_KEY';
    if (!hasGemini) {
      // Fallback to rule-based when no API key
      setState(() {
        _aiInsight = _ruleBasedInsight(state);
        _aiLoading = false;
        _aiError = null;
      });
      return;
    }

    if (_aiLoading) return;
    setState(() {
      _aiLoading = true;
      _aiError = null;
    });

    try {
      final prompt = _buildHealthPrompt(state);
      final gemini = GeminiService();
      final reply = await gemini.sendMessage(prompt);
      if (mounted) {
        setState(() {
          _aiInsight = reply;
          _aiLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _aiInsight = _ruleBasedInsight(state);
          _aiLoading = false;
          _aiError = 'Cannot connect to AI, showing basic analysis';
        });
      }
    }
  }

  String _buildHealthPrompt(HealthMetricState state) {
    final buf = StringBuffer();
    buf.writeln('Briefly analyze the following health metrics for an elderly person (reply in English, max 3-4 sentences, friendly tone like a care assistant):');
    for (final entry in state.latestByType.entries) {
      final config = _metricConfigs[entry.key];
      final data = entry.value;
      if (config != null) {
        final display = data.valueSecondary != null
            ? '${data.value}/${data.valueSecondary}'
            : data.value;
        buf.writeln('- ${config.label}: $display ${config.unit} (at ${data.recordedAt.hour}:${data.recordedAt.minute.toString().padLeft(2, '0')})');
      }
    }
    buf.writeln('Evaluate each metric, flag any abnormalities, and give one short piece of advice.');
    return buf.toString();
  }

  String _ruleBasedInsight(HealthMetricState state) {
    final abnormal = state.latestByType.entries
        .where((e) => _getStatus(e.value) != 'normal')
        .toList();
    if (abnormal.isEmpty) {
      return 'All your readings today are within normal range. '
          'Keep up the healthy lifestyle!';
    }
    final names = abnormal
        .map((e) => _metricConfigs[e.key]?.label ?? e.key)
        .join(', ');
    return 'Note: $names are outside normal range. '
        'Monitor closely and consult your doctor if it persists.';
  }

  Widget _buildAiInsight(HealthMetricState state) {
    final displayText = _aiInsight ?? _ruleBasedInsight(state);

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _aiLoading
                      ? AppColors.warning.withOpacity(0.15)
                      : AppColors.success.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: _aiLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.warning,
                        ),
                      )
                    : const Icon(Icons.auto_awesome,
                        color: AppColors.success, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'AI Insight',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (_aiLoading) ...[
                          const SizedBox(width: 8),
                          const Text(
                            'analyzing...',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      displayText,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              if (!_aiLoading && _aiInsight != null)
                InkWell(
                  onTap: () => _loadAiInsight(state),
                  borderRadius: BorderRadius.circular(12),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(Icons.refresh,
                        color: AppColors.textHint, size: 18),
                  ),
                ),
            ],
          ),
          if (_aiError != null) ...[
            const SizedBox(height: 8),
            Text(
              _aiError!,
              style: const TextStyle(
                color: AppColors.warning,
                fontSize: 11,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
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
            'No health data yet',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Press + to add your first reading',
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
              'Add health metric',
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
                  subtitle: Text('Unit: ${e.value.unit}',
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
        title: Text('Enter $label'),
        content: TextFormField(
          controller: valueCtrl,
          autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Value ($unit)',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
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
            child: const Text('Save'),
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
        return 'High';
      case 'low':
        return 'Low';
      case 'normal':
        return 'Normal';
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
            'Need more data to show chart',
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
