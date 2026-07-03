import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/family_provider.dart';
import '../providers/emergency_event_provider.dart';
import '../../../elderly/presentation/providers/health_metric_provider.dart';
import '../../../elderly/presentation/providers/medication_provider.dart';
import '../../../notifications/presentation/providers/notification_provider.dart';

class FamilyDashboardScreen extends ConsumerStatefulWidget {
  const FamilyDashboardScreen({super.key});

  @override
  ConsumerState<FamilyDashboardScreen> createState() =>
      _FamilyDashboardScreenState();
}

class _FamilyDashboardScreenState extends ConsumerState<FamilyDashboardScreen> {
  String _name = '';

  @override
  void initState() {
    super.initState();
    _loadName();
  }

  Future<void> _loadName() async {
    final name = await SecureStorage.getName();
    if (mounted) setState(() => _name = name ?? 'bạn');
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  @override
  Widget build(BuildContext context) {
    final dashState = ref.watch(familyDashboardProvider);
    final data = dashState.data;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async =>
              ref.read(familyDashboardProvider.notifier).refresh(),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildElderlyCard(data),
              const SizedBox(height: 20),
              _buildSummaryGrid(data),
              const SizedBox(height: 24),
              _buildRecentActivity(data?.elderlyId),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$_greeting, $_name!',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
        Builder(builder: (context) {
          final notifState = ref.watch(notificationProvider);
          final alertStateUnread = notifState.unreadCount;
          return Stack(
            children: [
              IconButton(
                onPressed: () => context.push('/notifications'),
                icon: const Icon(Icons.notifications_outlined,
                    color: AppColors.textPrimary, size: 26),
              ),
              if (alertStateUnread > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$alertStateUnread',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
            ],
          );
        }),
      ],
    );
  }

  Widget _buildElderlyCard(dynamic data) {
    final hasElderly = data?.elderlyName != null && data!.elderlyName!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF1A5570)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.elderly, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Người thân của bạn',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasElderly ? data!.elderlyName! : 'Chưa liên kết',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: hasElderly ? AppColors.success : AppColors.textHint,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
                ),
              ),
            ],
          ),
          if (hasElderly && data!.healthConditions.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: List<Widget>.from(data.healthConditions
                  .map((c) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          c,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ))),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSummaryGrid(dynamic data) {
    final totalMeds = data?.totalMedications ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tổng quan',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            _SummaryCard(
              icon: Icons.medication,
              iconColor: AppColors.primary,
              iconBgColor: AppColors.primary.withOpacity(0.08),
              label: 'Thuốc',
              value: '$totalMeds',
              subtitle: 'đang dùng',
              onTap: () => context.go('/family/medication'),
            ),
            const SizedBox(width: 10),
            _SummaryCard(
              icon: Icons.favorite,
              iconColor: AppColors.error,
              iconBgColor: const Color(0xFFFFEBEE),
              label: 'Huyết áp',
              value: '--',
              subtitle: 'Cập nhật',
              onTap: () => context.go('/family/health'),
            ),
            const SizedBox(width: 10),
            _SummaryCard(
              icon: Icons.notifications_active,
              iconColor: AppColors.warning,
              iconBgColor: const Color(0xFFFFF3E0),
              label: 'Cảnh báo',
              value: '0',
              subtitle: 'đang active',
              onTap: () => context.go('/family/alerts'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentActivity(String? elderlyId) {
    final List<Widget> activityItems = [];

    if (elderlyId != null) {
      // Medications
      final medsState = ref.watch(medicationsProvider);
      if (!medsState.isLoading && medsState.items.isNotEmpty) {
        for (final med in medsState.items.take(3)) {
          final timeLabel = med.nextDoseTime != null
              ? '${med.nextDoseTime!.hour.toString().padLeft(2, '0')}:${med.nextDoseTime!.minute.toString().padLeft(2, '0')}'
              : '';
          activityItems.add(_ActivityItem(
            icon: Icons.medication,
            iconColor: AppColors.primary,
            title: med.name,
            subtitle: '${med.dosage}${timeLabel.isNotEmpty ? ' lúc $timeLabel' : ''}',
            time: med.taken ? 'Đã uống' : 'Sắp tới',
          ));
        }
      }

      // Health metrics
      final healthState = ref.watch(healthMetricProvider(elderlyId));
      if (!healthState.isLoading && healthState.latestByType.isNotEmpty) {
        for (final entry in healthState.latestByType.entries.take(2)) {
          final data = entry.value;
          final typeLabel = switch (entry.key) {
            'BLOOD_PRESSURE' => 'Huyết áp',
            'BLOOD_GLUCOSE' => 'Đường huyết',
            'HEART_RATE' => 'Nhịp tim',
            _ => entry.key,
          };
          final valueStr = data.valueSecondary != null
              ? '${data.value}/${data.valueSecondary}'
              : data.value;
          final unitStr = data.unit ?? '';
          activityItems.add(_ActivityItem(
            icon: Icons.monitor_heart,
            iconColor: AppColors.success,
            title: 'Chỉ số $typeLabel',
            subtitle: '$valueStr $unitStr',
            time: _formatRelative(data.recordedAt),
          ));
        }
      }

      // Emergency events
      final alertState = ref.watch(emergencyEventProvider(elderlyId));
      if (!alertState.isLoading && alertState.events.isNotEmpty) {
        for (final event in alertState.events.where((e) => e.status == 'ACTIVE').take(1)) {
          activityItems.add(_ActivityItem(
            icon: Icons.warning_amber,
            iconColor: AppColors.warning,
            title: event.type == 'SOS' ? 'SOS khẩn cấp' : 'Cảnh báo',
            subtitle: event.description,
            time: _formatRelative(event.createdAt),
          ));
        }
      }
    }

    // Fall back to placeholder if no data
    if (activityItems.isEmpty) {
      activityItems.add(const _ActivityItem(
        icon: Icons.info_outline,
        iconColor: AppColors.textHint,
        title: 'Chưa có hoạt động',
        subtitle: 'Dữ liệu sẽ xuất hiện khi có hoạt động mới',
        time: '',
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Hoạt động gần đây',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 14),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
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
            children: List.generate(activityItems.length, (i) {
              if (i < activityItems.length - 1) {
                return Column(children: [
                  activityItems[i],
                  const Divider(height: 20),
                ]);
              }
              return activityItems[i];
            }),
          ),
        ),
      ],
    );
  }

  String _formatRelative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inHours < 1) return '${diff.inMinutes} phút trước';
    if (diff.inDays == 0) return 'Hôm nay';
    if (diff.inDays == 1) return 'Hôm qua';
    return '${diff.inDays} ngày trước';
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String label;
  final String value;
  final String subtitle;
  final VoidCallback onTap;

  const _SummaryCard({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.label,
    required this.value,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(height: 10),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textHint,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final String time;

  const _ActivityItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.time,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  fontSize: 14,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Text(
          time,
          style: const TextStyle(
            color: AppColors.textHint,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
