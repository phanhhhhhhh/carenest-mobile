import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/family_provider.dart';
import '../providers/health_threshold_provider.dart';

class HealthThresholdScreen extends ConsumerStatefulWidget {
  const HealthThresholdScreen({super.key});

  @override
  ConsumerState<HealthThresholdScreen> createState() =>
      _HealthThresholdScreenState();
}

class _HealthThresholdScreenState
    extends ConsumerState<HealthThresholdScreen> {
  static const _metricTypes = [
    'BLOOD_PRESSURE',
    'BLOOD_GLUCOSE',
    'HEART_RATE',
    'WEIGHT',
  ];

  String _displayType(String type) {
    switch (type) {
      case 'BLOOD_PRESSURE':
        return 'Blood Pressure';
      case 'BLOOD_GLUCOSE':
        return 'Blood Sugar';
      case 'HEART_RATE':
        return 'Heart Rate';
      case 'WEIGHT':
        return 'Weight';
      default:
        return type;
    }
  }

  String _unit(String type) {
    switch (type) {
      case 'BLOOD_PRESSURE':
        return 'mmHg';
      case 'BLOOD_GLUCOSE':
        return 'mmol/L';
      case 'HEART_RATE':
        return 'bpm';
      case 'WEIGHT':
        return 'kg';
      default:
        return '';
    }
  }

  IconData _icon(String type) {
    switch (type) {
      case 'BLOOD_PRESSURE':
        return Icons.favorite;
      case 'BLOOD_GLUCOSE':
        return Icons.water_drop;
      case 'HEART_RATE':
        return Icons.monitor_heart;
      case 'WEIGHT':
        return Icons.monitor_weight;
      default:
        return Icons.health_and_safety;
    }
  }

  Color _iconColor(String type) {
    switch (type) {
      case 'BLOOD_PRESSURE':
        return AppColors.error;
      case 'BLOOD_GLUCOSE':
        return const Color(0xFF1565C0);
      case 'HEART_RATE':
        return AppColors.secondary;
      case 'WEIGHT':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }

  void _showEditSheet({
    required String metricType,
    ThresholdItem? existing,
  }) {
    final isBP = metricType == 'BLOOD_PRESSURE';
    final minCtrl = TextEditingController(
        text: existing?.minValue?.toString() ?? '');
    final maxCtrl = TextEditingController(
        text: existing?.maxValue?.toString() ?? '');
    final min2Ctrl = TextEditingController(
        text: existing?.minValueSecondary?.toString() ?? '');
    final max2Ctrl = TextEditingController(
        text: existing?.maxValueSecondary?.toString() ?? '');
    bool alertFamily = existing?.alertFamily ?? true;

    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Center(
                  child: SizedBox(
                      width: 40,
                      child:
                          Divider(thickness: 3, color: AppColors.textHint)),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(_icon(metricType),
                        color: _iconColor(metricType), size: 24),
                    const SizedBox(width: 10),
                    Text(
                      existing != null
                          ? 'Edit ${_displayType(metricType)} Threshold'
                          : 'Set ${_displayType(metricType)} Threshold',
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text('Unit: ${_unit(metricType)}',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 13)),
                const SizedBox(height: 20),
                if (isBP) ...[
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minCtrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration: InputDecoration(
                            labelText: 'Systolic Min',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: min2Ctrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration: InputDecoration(
                            labelText: 'Diastolic Min',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: maxCtrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration: InputDecoration(
                            labelText: 'Systolic Max',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: max2Ctrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration: InputDecoration(
                            labelText: 'Diastolic Max',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minCtrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration: InputDecoration(
                            labelText: 'Min Value',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: maxCtrl,
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true),
                          decoration: InputDecoration(
                            labelText: 'Max Value',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 14),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Alert family when out of range',
                      style: TextStyle(
                          fontSize: 14, color: AppColors.textPrimary)),
                  value: alertFamily,
                  activeColor: AppColors.primary,
                  onChanged: (v) =>
                      setSheetState(() => alertFamily = v),
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
                      final notifier = ref
                          .read(healthThresholdProvider(elderlyId).notifier);
                      if (existing != null) {
                        notifier.update(
                          existing.id,
                          minValue: double.tryParse(minCtrl.text),
                          maxValue: double.tryParse(maxCtrl.text),
                          minValueSecondary: double.tryParse(min2Ctrl.text),
                          maxValueSecondary: double.tryParse(max2Ctrl.text),
                          alertFamily: alertFamily,
                        );
                      } else {
                        notifier.create(
                          metricType: metricType,
                          minValue: double.tryParse(minCtrl.text),
                          maxValue: double.tryParse(maxCtrl.text),
                          minValueSecondary: double.tryParse(min2Ctrl.text),
                          maxValueSecondary: double.tryParse(max2Ctrl.text),
                          alertFamily: alertFamily,
                        );
                      }
                      Navigator.pop(ctx);
                    },
                    child: Text(
                        existing != null ? 'Update' : 'Save Threshold',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
                if (existing != null) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        ref
                            .read(
                                healthThresholdProvider(elderlyId).notifier)
                            .delete(existing.id);
                      },
                      child: const Text('Delete Threshold'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleRecommend() async {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    await ref
        .read(healthThresholdProvider(elderlyId).notifier)
        .getRecommendations();
    if (!mounted) return;
    // Apply AI recommendations
    final state = ref.read(healthThresholdProvider(elderlyId));
    final recs = state.recommendations;
    if (recs != null && recs.isNotEmpty && mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.auto_awesome, color: AppColors.primary, size: 24),
              SizedBox(width: 8),
              Text('AI Recommendations',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          content: Text(
            'Gemini AI analyzed the health profile and suggests the '
            'following thresholds. Apply them?',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                Navigator.pop(ctx);
                final notifier =
                    ref.read(healthThresholdProvider(elderlyId).notifier);
                for (final r in recs) {
                  await notifier.create(
                    metricType: r.metricType,
                    minValue: r.minValue,
                    maxValue: r.maxValue,
                    minValueSecondary: r.minValueSecondary,
                    maxValueSecondary: r.maxValueSecondary,
                  );
                }
                ref
                    .read(healthThresholdProvider(elderlyId).notifier)
                    .clearRecommendations();
              },
              child: const Text('Apply All'),
            ),
          ],
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('No recommendations available'),
            backgroundColor: AppColors.warning),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final dash = ref.watch(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    final elderlyName = dash.data?.elderlyName ?? 'Loved one';

    if (elderlyId == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: _appBar(elderlyName),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.people_outline, size: 56, color: AppColors.textHint),
              SizedBox(height: 16),
              Text('No elderly person linked yet',
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 15)),
            ],
          ),
        ),
      );
    }

    final state = ref.watch(healthThresholdProvider(elderlyId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _appBar(elderlyName),
      body: state.isLoading && state.thresholds.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // AI recommend banner
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFE8F5E9), Color(0xFFF1F8E9)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: AppColors.success.withOpacity(0.2)),
                  ),
                  child: Row(
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
                      const Expanded(
                        child: Text(
                          'AI can analyze the health profile and suggest '
                          'personalized thresholds for each metric.',
                          style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                              height: 1.4),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: state.isSaving ? null : _handleRecommend,
                        icon: const Icon(Icons.auto_awesome, size: 16),
                        label: const Text('Recommend',
                            style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Alert Thresholds',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 4),
                const Text(
                    'Set personal limits — AI will alert when exceeded',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 13)),
                const SizedBox(height: 16),
                ..._metricTypes.map((type) {
                  final existing = ref.read(healthThresholdProvider(elderlyId).notifier).findFor(type);
                  return _ThresholdCard(
                    type: type,
                    displayType: _displayType(type),
                    unit: _unit(type),
                    icon: _icon(type),
                    color: _iconColor(type),
                    existing: existing,
                    onTap: () =>
                        _showEditSheet(metricType: type, existing: existing),
                  );
                }),
                const SizedBox(height: 20),
              ],
            ),
    );
  }

  PreferredSizeWidget _appBar(String name) {
    return AppBar(
      title: Text('Health Thresholds — $name',
          style: const TextStyle(
              fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
    );
  }
}

class _ThresholdCard extends StatelessWidget {
  final String type;
  final String displayType;
  final String unit;
  final IconData icon;
  final Color color;
  final ThresholdItem? existing;
  final VoidCallback onTap;

  const _ThresholdCard({
    required this.type,
    required this.displayType,
    required this.unit,
    required this.icon,
    required this.color,
    required this.existing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: existing != null
              ? AppColors.success.withOpacity(0.3)
              : AppColors.textHint.withOpacity(0.15),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(displayType,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: AppColors.textPrimary)),
                  const SizedBox(height: 3),
                  Text(
                    existing != null
                        ? '${existing!.rangeDisplay} $unit'
                        : 'Tap to set range',
                    style: TextStyle(
                      color: existing != null
                          ? AppColors.textSecondary
                          : AppColors.textHint,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: existing != null
                    ? AppColors.success.withOpacity(0.1)
                    : AppColors.textHint.withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                existing != null ? 'Set' : 'Not set',
                style: TextStyle(
                  color: existing != null
                      ? AppColors.success
                      : AppColors.textHint,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, color: AppColors.textHint),
          ],
        ),
      ),
    );
  }
}
