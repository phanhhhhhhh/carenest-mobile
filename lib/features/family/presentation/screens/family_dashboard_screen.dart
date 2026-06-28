import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/family_provider.dart';

class FamilyDashboardScreen extends ConsumerStatefulWidget {
  const FamilyDashboardScreen({super.key});

  @override
  ConsumerState<FamilyDashboardScreen> createState() =>
      _FamilyDashboardScreenState();
}

class _FamilyDashboardScreenState
    extends ConsumerState<FamilyDashboardScreen> {
  String _name = '';

  @override
  void initState() {
    super.initState();
    SecureStorage.getName().then((v) {
      if (mounted) setState(() => _name = v ?? 'bạn');
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashState = ref.watch(familyDashboardProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: dashState.isLoading && dashState.data == null
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(context, dashState),
                    const SizedBox(height: 20),
                    _buildElderlyCard(dashState),
                    const SizedBox(height: 20),
                    _buildSummaryGrid(dashState),
                    const SizedBox(height: 20),
                    _buildRecentActivity(),
                    if (dashState.lastRefreshed != null) ...[
                      const SizedBox(height: 12),
                      _buildLastRefreshed(dashState.lastRefreshed!),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, FamilyDashboardState dashState) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Xin chào, $_name!',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                _formatDate(),
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () => ref.read(familyDashboardProvider.notifier).refresh(),
          icon: dashState.isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.refresh, color: AppColors.textSecondary),
        ),
        Stack(
          children: [
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.notifications_outlined, color: AppColors.textSecondary),
            ),
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
        IconButton(
          onPressed: () async {
            await ref.read(authRepositoryProvider).signOut();
            if (context.mounted) context.go('/phone');
          },
          icon: const Icon(Icons.logout, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildElderlyCard(FamilyDashboardState dashState) {
    final elderlyName = dashState.data?.elderlyName;
    final healthConditions = dashState.data?.healthConditions.isNotEmpty == true
        ? dashState.data!.healthConditions.join(', ')
        : null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            child: const Icon(Icons.elderly, size: 34, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  elderlyName ?? 'Chưa liên kết',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (healthConditions != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    healthConditions,
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
                const SizedBox(height: 8),
                const Row(
                  children: [
                    _StatusDot(color: AppColors.success),
                    SizedBox(width: 6),
                    Text(
                      'Tình trạng bình thường',
                      style: TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.white70),
        ],
      ),
    );
  }

  Widget _buildSummaryGrid(FamilyDashboardState dashState) {
    final total = dashState.data?.totalMedications ?? 0;
    final taken = dashState.data?.takenMedications ?? 0;
    final medValue = total > 0 ? '$taken/$total liều' : '--';
    final medProgress = total > 0 ? taken / total : 0.0;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: [
        _SummaryCard(
          icon: Icons.medication,
          iconColor: AppColors.primary,
          title: 'Uống thuốc',
          value: medValue,
          subtitle: 'Hôm nay',
          progress: medProgress.toDouble(),
        ),
        const _SummaryCard(
          icon: Icons.favorite,
          iconColor: AppColors.error,
          title: 'Huyết áp',
          value: '--',
          subtitle: 'mmHg',
        ),
        const _SummaryCard(
          icon: Icons.water_drop,
          iconColor: Color(0xFF1565C0),
          title: 'Đường huyết',
          value: '--',
          subtitle: 'mmol/L',
        ),
        const _SummaryCard(
          icon: Icons.warning_amber,
          iconColor: AppColors.warning,
          title: 'Cảnh báo',
          value: '--',
          subtitle: '',
        ),
      ],
    );
  }

  Widget _buildRecentActivity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Hoạt động gần đây',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(
              'Chưa có hoạt động gần đây',
              style: const TextStyle(color: AppColors.textHint, fontSize: 14),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLastRefreshed(DateTime lastRefreshed) {
    final h = lastRefreshed.hour.toString().padLeft(2, '0');
    final m = lastRefreshed.minute.toString().padLeft(2, '0');
    final s = lastRefreshed.second.toString().padLeft(2, '0');
    return Center(
      child: Text(
        'Cập nhật lúc $h:$m:$s',
        style: const TextStyle(fontSize: 11, color: AppColors.textHint),
      ),
    );
  }

  String _formatDate() {
    final now = DateTime.now();
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    return '${days[now.weekday - 1]}, ${now.day}/${now.month}/${now.year}';
  }
}

class _StatusDot extends StatelessWidget {
  final Color color;

  const _StatusDot({required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;
  final String subtitle;
  final double? progress;
  final bool hasAlert;

  const _SummaryCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.value,
    required this.subtitle,
    this.progress,
    this.hasAlert = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 18),
              const Spacer(),
              if (hasAlert)
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                      color: AppColors.error, shape: BoxShape.circle),
                ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(title,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 11)),
          if (progress != null) ...[
            const SizedBox(height: 4),
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 4,
                backgroundColor: AppColors.background,
                valueColor: AlwaysStoppedAnimation(iconColor),
              ),
            ),
          ],
          Text(subtitle,
              style: const TextStyle(color: AppColors.textHint, fontSize: 11)),
        ],
      ),
    );
  }
}
