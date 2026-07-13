import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/family_provider.dart';
import '../providers/emergency_event_provider.dart';
import '../providers/appointment_provider.dart';
import '../providers/camera_provider.dart';
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
    if (mounted) setState(() => _name = name ?? 'you');
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
              if (data != null && data.linkedElderly.length > 1)
                _buildElderlySelector(data),
              _buildElderlyCard(data),
              const SizedBox(height: 20),
              _buildVitalsRow(data?.elderlyId),
              const SizedBox(height: 24),
              _buildMedicationToday(data?.elderlyId),
              const SizedBox(height: 24),
              _buildCameraPreview(data?.elderlyId),
              const SizedBox(height: 24),
              _buildRecentActivity(data?.elderlyId),
              const SizedBox(height: 24),
              _buildUpcomingAppointments(),
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
        Builder(
          builder: (context) {
            final notifState = ref.watch(notificationProvider);
            final alertStateUnread = notifState.unreadCount;
            return Stack(
              children: [
                IconButton(
                  onPressed: () => context.push('/notifications'),
                  icon: const Icon(
                    Icons.notifications_outlined,
                    color: AppColors.textPrimary,
                    size: 26,
                  ),
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
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildElderlySelector(FamilyDashboardData data) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: SizedBox(
        height: 40,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: data.linkedElderly.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final elder = data.linkedElderly[index];
            final isSelected = index == data.selectedIndex;
            return GestureDetector(
              onTap: () {
                ref.read(familyDashboardProvider.notifier).selectElderly(index);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.textHint.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.elderly,
                      size: 16,
                      color: isSelected ? Colors.white : AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      elder.elderlyName,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? Colors.white
                            : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildElderlyCard(dynamic data) {
    final hasElderly =
        data?.elderlyName != null && data!.elderlyName!.isNotEmpty;

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
            color: AppColors.primary.withValues(alpha: 0.3),
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
                  color: Colors.white.withValues(alpha: 0.2),
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
                      'Your loved one',
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasElderly ? data!.elderlyName! : 'Not linked',
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
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.5),
                    width: 2,
                  ),
                ),
              ),
            ],
          ),
          if (hasElderly && data!.healthConditions.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: List<Widget>.from(
                data.healthConditions.map(
                  (c) => Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      c,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// Wireframe A1: hàng 3 ô chỉ số sinh hiệu (Nhịp tim / Huyết áp / Đường)
  /// mỗi ô có chấm trạng thái OK / Cảnh báo dựa trên ngưỡng đã đặt.
  Widget _buildVitalsRow(String? elderlyId) {
    if (elderlyId == null) {
      return const SizedBox.shrink();
    }
    final healthState = ref.watch(healthMetricProvider(elderlyId));
    final hr = healthState.latestByType['HEART_RATE'];
    final bp = healthState.latestByType['BLOOD_PRESSURE'];
    final glucose = healthState.latestByType['BLOOD_GLUCOSE'];

    bool isBpWarning(HealthMetricData? d) {
      if (d == null) return false;
      final sys = double.tryParse(d.value) ?? 0;
      return sys >= 135;
    }

    return Row(
      children: [
        _VitalMiniCard(
          label: 'Nhịp tim',
          value: hr != null ? hr.value : '--',
          isWarning: false,
          onTap: () => context.go('/family/health'),
        ),
        const SizedBox(width: 10),
        _VitalMiniCard(
          label: 'Huyết áp',
          value: bp != null
              ? (bp.valueSecondary != null
                    ? '${bp.value}/${bp.valueSecondary}'
                    : bp.value)
              : '--',
          isWarning: isBpWarning(bp),
          onTap: () => context.go('/family/health'),
        ),
        const SizedBox(width: 10),
        _VitalMiniCard(
          label: 'Đường',
          value: glucose != null ? glucose.value : '--',
          isWarning: false,
          onTap: () => context.go('/family/health'),
        ),
      ],
    );
  }

  /// Wireframe A1: "Thuốc hôm nay" — tiêu đề + fraction (3/4) + "Xem tất cả"
  /// + danh sách thuốc trong ngày với icon tick/pending.
  Widget _buildMedicationToday(String? elderlyId) {
    final medsState = ref.watch(medicationsProvider);
    final items = medsState.items;
    final takenCount = items.where((m) => m.taken).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Thuốc hôm nay',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            Row(
              children: [
                if (items.isNotEmpty)
                  Text(
                    '$takenCount/${items.length}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                TextButton(
                  onPressed: () => context.go('/family/medication'),
                  child: const Text(
                    'Xem tất cả →',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (medsState.isLoading && items.isEmpty)
          const SizedBox(
            height: 60,
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Center(
              child: Text(
                'Chưa có thuốc nào',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
            ),
          )
        else
          Container(
            padding: const EdgeInsets.symmetric(vertical: 4),
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
              children: items.take(4).map((med) {
                final timeLabel = med.nextDoseTime != null
                    ? '${med.nextDoseTime!.hour.toString().padLeft(2, '0')}:${med.nextDoseTime!.minute.toString().padLeft(2, '0')}'
                    : (med.scheduleTimes.isNotEmpty
                          ? med.scheduleTimes.first
                          : '');
                return ListTile(
                  dense: true,
                  leading: Icon(
                    med.taken ? Icons.check_circle : Icons.access_time_filled,
                    color: med.taken ? AppColors.success : AppColors.warning,
                    size: 22,
                  ),
                  title: Text(
                    '${med.name} ${med.dosage}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    timeLabel,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  trailing: Text(
                    med.taken ? 'Đã uống' : 'Sắp tới',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: med.taken ? AppColors.success : AppColors.warning,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  /// Wireframe A1: khối camera live preview + nút Xem / Gọi / Check-in.
  Widget _buildCameraPreview(String? elderlyId) {
    if (elderlyId == null) return const SizedBox.shrink();
    final camState = ref.watch(cameraProvider(elderlyId));
    final hasCamera = camState.cameras.isNotEmpty;
    final cam = hasCamera ? camState.cameras.first : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              cam != null ? 'Camera — ${cam.label}' : 'Camera',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            if (hasCamera && cam!.isOnline)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'LIVE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.error,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        if (!hasCamera)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                const Icon(
                  Icons.videocam_off,
                  color: AppColors.textHint,
                  size: 32,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Chưa liên kết camera nào',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/camera'),
                  child: const Text('+ Thêm camera'),
                ),
              ],
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A1A2E),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Icon(
                        cam!.isOnline
                            ? Icons.play_circle_fill
                            : Icons.videocam_off,
                        color: Colors.white54,
                        size: 40,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _CameraActionButton(
                        icon: Icons.play_arrow,
                        label: 'Xem',
                        onTap: () => context.push('/camera'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _CameraActionButton(
                        icon: Icons.mic,
                        label: 'Gọi',
                        onTap: () => context.push('/camera'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _CameraActionButton(
                        icon: Icons.event_available,
                        label: 'Check-in',
                        onTap: () => context.push('/camera'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildUpcomingAppointments() {
    final state = ref.watch(appointmentProvider);
    final upcoming = state.upcoming.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Upcoming Appointments',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/family/appointments'),
              child: const Text(
                'View All',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (state.isLoading && upcoming.isEmpty)
          const SizedBox(
            height: 60,
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (upcoming.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Column(
              children: [
                Icon(Icons.event_note, color: AppColors.textHint, size: 32),
                SizedBox(height: 8),
                Text(
                  'No appointments yet',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          )
        else
          ...upcoming.map(
            (apt) => _AppointmentPreviewCard(
              doctor: apt.doctor,
              specialty: apt.specialty,
              date: apt.appointmentDate,
              onTap: () => context.push('/family/appointments'),
            ),
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
          activityItems.add(
            _ActivityItem(
              icon: Icons.medication,
              iconColor: AppColors.primary,
              title: med.name,
              subtitle:
                  '${med.dosage}${timeLabel.isNotEmpty ? ' at $timeLabel' : ''}',
              time: med.taken ? 'Taken' : 'Upcoming',
            ),
          );
        }
      }

      // Health metrics
      final healthState = ref.watch(healthMetricProvider(elderlyId));
      if (!healthState.isLoading && healthState.latestByType.isNotEmpty) {
        for (final entry in healthState.latestByType.entries.take(2)) {
          final data = entry.value;
          final typeLabel = switch (entry.key) {
            'BLOOD_PRESSURE' => 'Blood Pressure',
            'BLOOD_GLUCOSE' => 'Blood Sugar',
            'HEART_RATE' => 'Heart Rate',
            _ => entry.key,
          };
          final valueStr = data.valueSecondary != null
              ? '${data.value}/${data.valueSecondary}'
              : data.value;
          final unitStr = data.unit ?? '';
          activityItems.add(
            _ActivityItem(
              icon: Icons.monitor_heart,
              iconColor: AppColors.success,
              title: '$typeLabel reading',
              subtitle: '$valueStr $unitStr',
              time: _formatRelative(data.recordedAt),
            ),
          );
        }
      }

      // Emergency events
      final alertState = ref.watch(emergencyEventProvider(elderlyId));
      if (!alertState.isLoading && alertState.events.isNotEmpty) {
        for (final event
            in alertState.events.where((e) => e.status == 'ACTIVE').take(1)) {
          activityItems.add(
            _ActivityItem(
              icon: Icons.warning_amber,
              iconColor: AppColors.warning,
              title: event.type == 'SOS' ? 'SOS Emergency' : 'Alert',
              subtitle: event.description,
              time: _formatRelative(event.createdAt),
            ),
          );
        }
      }
    }

    // Fall back to placeholder if no data
    if (activityItems.isEmpty) {
      activityItems.add(
        const _ActivityItem(
          icon: Icons.info_outline,
          iconColor: AppColors.textHint,
          title: 'No activity yet',
          subtitle: 'Data appears when new activity occurs',
          time: '',
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Cảnh báo gần đây',
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
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: List.generate(activityItems.length, (i) {
              if (i < activityItems.length - 1) {
                return Column(
                  children: [activityItems[i], const Divider(height: 20)],
                );
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
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    return '${diff.inDays}d ago';
  }
}

/// Ô chỉ số sinh hiệu nhỏ theo wireframe A1 (Nhịp tim / Huyết áp / Đường)
/// với chấm trạng thái OK (xanh) hoặc Cảnh báo (đỏ).
class _VitalMiniCard extends StatelessWidget {
  final String label;
  final String value;
  final bool isWarning;
  final VoidCallback onTap;

  const _VitalMiniCard({
    required this.label,
    required this.value,
    required this.isWarning,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = isWarning ? AppColors.error : AppColors.success;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.textHint.withValues(alpha: 0.25),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 9,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.4,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: statusColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isWarning ? 'Cảnh báo' : 'OK',
                    style: TextStyle(fontSize: 9, color: statusColor),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Nút hành động nhỏ trong khối camera preview (Xem / Gọi / Check-in).
class _CameraActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _CameraActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 16),
      label: Text(label, style: const TextStyle(fontSize: 12)),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: BorderSide(color: AppColors.primary.withValues(alpha: 0.4)),
        padding: const EdgeInsets.symmetric(vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}

class _AppointmentPreviewCard extends StatelessWidget {
  final String doctor;
  final String specialty;
  final DateTime date;
  final VoidCallback onTap;

  const _AppointmentPreviewCard({
    required this.doctor,
    required this.specialty,
    required this.date,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final timeStr =
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    final day = date.day;
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final monthStr = months[date.month - 1];

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '$day',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    monthStr,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctor,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$specialty • $timeStr',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textHint),
          ],
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
            color: iconColor.withValues(alpha: 0.08),
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
          style: const TextStyle(color: AppColors.textHint, fontSize: 12),
        ),
      ],
    );
  }
}
