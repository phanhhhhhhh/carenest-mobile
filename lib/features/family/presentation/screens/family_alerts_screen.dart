import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/family_provider.dart';
import '../providers/emergency_event_provider.dart';

class FamilyAlertsScreen extends ConsumerStatefulWidget {
  const FamilyAlertsScreen({super.key});

  @override
  ConsumerState<FamilyAlertsScreen> createState() => _FamilyAlertsScreenState();
}

class _FamilyAlertsScreenState extends ConsumerState<FamilyAlertsScreen> {
  String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      return 'Hôm nay ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Hôm qua ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else {
      return '${difference.inDays} ngày trước';
    }
  }

  IconData _eventIcon(String type) {
    switch (type) {
      case 'SOS':
        return Icons.sos;
      case 'MISSED_MEDICATION':
        return Icons.medication_liquid;
      case 'ABNORMAL_VITALS':
        return Icons.warning_amber;
      default:
        return Icons.notifications;
    }
  }

  Color _eventColor(String type) {
    switch (type) {
      case 'SOS':
        return AppColors.sosPrimary;
      case 'MISSED_MEDICATION':
        return AppColors.warning;
      case 'ABNORMAL_VITALS':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }

  String _eventTitle(String type) {
    switch (type) {
      case 'SOS':
        return 'SOS đã được gửi';
      case 'MISSED_MEDICATION':
        return 'Bỏ lỡ liều thuốc';
      case 'ABNORMAL_VITALS':
        return 'Chỉ số bất thường';
      default:
        return 'Cảnh báo';
    }
  }

  @override
  Widget build(BuildContext context) {
    final dashboardState = ref.watch(familyDashboardProvider);
    final elderlyId = dashboardState.data?.elderlyId;

    if (elderlyId == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Cảnh báo'),
          backgroundColor: AppColors.surface,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
        ),
        body: const Center(
          child: Text(
            'Chưa có người cao tuổi được liên kết',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
          ),
        ),
      );
    }

    final emergencyState = ref.watch(emergencyEventProvider(elderlyId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Cảnh báo'),
            if (emergencyState.activeCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${emergencyState.activeCount} mới',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ],
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () => ref.refresh(emergencyEventProvider(elderlyId)),
            child: const Text(
              'Đánh dấu đã đọc',
              style: TextStyle(color: AppColors.primary, fontSize: 12),
            ),
          ),
        ],
      ),
      body: _buildBody(emergencyState, elderlyId),
    );
  }

  Widget _buildBody(EmergencyEventState state, String elderlyId) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(
                state.error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.refresh(emergencyEventProvider(elderlyId)),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (state.events.isEmpty) {
      return const Center(
        child: Text(
          'Không có cảnh báo nào',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: state.events.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) => _buildEventCard(state.events[i]),
    );
  }

  Widget _buildEventCard(EmergencyEventData event) {
    final isActive = event.status == 'ACTIVE';
    final color = _eventColor(event.type);
    final icon = _eventIcon(event.type);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isActive ? color.withOpacity(0.05) : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: isActive
            ? Border.all(color: color.withOpacity(0.3))
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _eventTitle(event.type),
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: !isActive
                              ? AppColors.textSecondary
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (isActive)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.error,
                          shape: BoxShape.circle,
                        ),
                      ),
                    if (!isActive)
                      const Icon(
                        Icons.check_circle,
                        color: AppColors.success,
                        size: 16,
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  event.description,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _formatRelativeTime(event.createdAt),
                  style: const TextStyle(
                    color: AppColors.textHint,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
