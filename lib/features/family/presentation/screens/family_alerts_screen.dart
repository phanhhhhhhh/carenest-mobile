import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/family_provider.dart';
import '../providers/emergency_event_provider.dart';

class FamilyAlertsScreen extends ConsumerStatefulWidget {
  const FamilyAlertsScreen({super.key});

  @override
  ConsumerState<FamilyAlertsScreen> createState() => _FamilyAlertsScreenState();
}

class _FamilyAlertsScreenState extends ConsumerState<FamilyAlertsScreen> {
  bool _markingRead = false;

  Future<void> _markAllRead(String elderlyId) async {
    setState(() => _markingRead = true);
    final userId = await SecureStorage.getUserId();
    if (userId != null) {
      await ref.read(emergencyEventProvider(elderlyId).notifier).markAllRead(userId);
    }
    if (mounted) setState(() => _markingRead = false);
  }

  @override
  Widget build(BuildContext context) {
    final dash = ref.watch(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;

    if (elderlyId == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: _appBar(0, ''),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.people_outline, size: 56, color: AppColors.textHint),
              SizedBox(height: 16),
              Text('Chưa có người cao tuổi được liên kết',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
            ],
          ),
        ),
      );
    }

    final state = ref.watch(emergencyEventProvider(elderlyId));
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _appBar(state.activeCount, elderlyId),
      body: _buildBody(state, elderlyId),
    );
  }

  PreferredSizeWidget _appBar(int activeCount, String elderlyId) {
    return AppBar(
      title: Row(
        children: [
          const Text('Cảnh báo',
              style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          if (activeCount > 0) ...[
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('$activeCount mới',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ],
        ],
      ),
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      actions: [
        if (activeCount > 0)
          TextButton(
            onPressed: _markingRead ? null : () => _markAllRead(elderlyId),
            child: _markingRead
                ? const SizedBox(width: 16, height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Đánh dấu đã đọc',
                    style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w500)),
          ),
      ],
    );
  }

  Widget _buildBody(EmergencyEventState state, String elderlyId) {
    if (state.isLoading && state.events.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null && state.events.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(state.error!, textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.invalidate(emergencyEventProvider(elderlyId)),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (state.events.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline, color: AppColors.success, size: 44),
            ),
            const SizedBox(height: 16),
            const Text('Không có cảnh báo nào',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            const Text('Mọi thứ đều ổn!',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          ],
        ),
      );
    }

    // Split into active and resolved
    final active = state.events.where((e) => e.status == 'ACTIVE').toList();
    final resolved = state.events.where((e) => e.status != 'ACTIVE').toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (active.isNotEmpty) ...[
          const Text('Đang active',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                  color: AppColors.error)),
          const SizedBox(height: 10),
          ...active.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _buildEventCard(e),
              )),
        ],
        if (resolved.isNotEmpty) ...[
          if (active.isNotEmpty) const SizedBox(height: 10),
          const Text('Đã xử lý',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary)),
          const SizedBox(height: 10),
          ...resolved.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _buildEventCard(e),
              )),
        ],
      ],
    );
  }

  Widget _buildEventCard(EmergencyEventData event) {
    final isActive = event.status == 'ACTIVE';
    final color = _eventColor(event.type);
    final icon = _eventIcon(event.type);
    final title = _eventTitle(event.type);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isActive ? color.withOpacity(0.04) : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: isActive ? Border.all(color: color.withOpacity(0.3)) : null,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44, height: 44,
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
                Row(
                  children: [
                    Expanded(
                      child: Text(title,
                          style: TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 15,
                              color: isActive ? AppColors.textPrimary : AppColors.textSecondary)),
                    ),
                    if (isActive)
                      Container(
                        width: 8, height: 8,
                        decoration: const BoxDecoration(
                            color: AppColors.error, shape: BoxShape.circle),
                      )
                    else
                      const Icon(Icons.check_circle, color: AppColors.success, size: 18),
                  ],
                ),
                const SizedBox(height: 4),
                Text(event.description,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 12, color: AppColors.textHint),
                    const SizedBox(width: 4),
                    Text(_formatRelative(event.createdAt),
                        style: const TextStyle(color: AppColors.textHint, fontSize: 12)),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isActive
                            ? AppColors.error.withOpacity(0.08)
                            : AppColors.success.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isActive ? 'ACTIVE' : 'RESOLVED',
                        style: TextStyle(
                          color: isActive ? AppColors.error : AppColors.success,
                          fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _eventTitle(String type) {
    switch (type) {
      case 'SOS': return 'SOS khẩn cấp';
      case 'MISSED_MEDICATION': return 'Bỏ lỡ thuốc';
      case 'ABNORMAL_VITALS': return 'Chỉ số bất thường';
      default: return 'Cảnh báo';
    }
  }

  IconData _eventIcon(String type) {
    switch (type) {
      case 'SOS': return Icons.sos;
      case 'MISSED_MEDICATION': return Icons.medication_liquid;
      case 'ABNORMAL_VITALS': return Icons.warning_amber;
      default: return Icons.notifications;
    }
  }

  Color _eventColor(String type) {
    switch (type) {
      case 'SOS': return AppColors.sosPrimary;
      case 'MISSED_MEDICATION': return AppColors.warning;
      case 'ABNORMAL_VITALS': return AppColors.error;
      default: return AppColors.primary;
    }
  }

  String _formatRelative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inHours < 1) return '${diff.inMinutes} phút trước';
    if (diff.inDays == 0) return 'Hôm nay ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    if (diff.inDays == 1) return 'Hôm qua ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    return '${diff.inDays} ngày trước';
  }
}
