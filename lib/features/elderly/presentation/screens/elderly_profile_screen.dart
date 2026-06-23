import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/elderly_provider.dart';

class ElderlyProfileScreen extends ConsumerStatefulWidget {
  const ElderlyProfileScreen({super.key});

  @override
  ConsumerState<ElderlyProfileScreen> createState() =>
      _ElderlyProfileScreenState();
}

class _ElderlyProfileScreenState extends ConsumerState<ElderlyProfileScreen> {
  String _name = '';
  String _phone = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final name = await SecureStorage.getName();
    final phone = await SecureStorage.getPhone();
    if (mounted) {
      setState(() {
        _name = name ?? 'Người dùng';
        _phone = phone ?? '';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              _buildAvatar(),
              const SizedBox(height: 24),
              _buildHealthProfile(),
              const SizedBox(height: 16),
              _buildSettingsSection(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    return Column(
      children: [
        CircleAvatar(
          radius: 44,
          backgroundColor: AppColors.primary.withOpacity(0.1),
          child: const Icon(Icons.person, size: 48, color: AppColors.primary),
        ),
        const SizedBox(height: 12),
        Text(
          _name,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        if (_phone.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            _phone,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
        ],
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text(
            'Người cao tuổi',
            style: TextStyle(
                color: AppColors.primary,
                fontSize: 12,
                fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  Widget _buildHealthProfile() {
    final profileState = ref.watch(elderlyProfileProvider);

    Widget profileContent;
    if (profileState.isLoading) {
      profileContent = const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    } else if (profileState.error != null) {
      profileContent = Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text(
          profileState.error!,
          style: const TextStyle(color: AppColors.error, fontSize: 14),
        ),
      );
    } else if (profileState.profile == null) {
      profileContent = const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Text(
          'Hồ sơ chưa được tạo',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
      );
    } else {
      final profile = profileState.profile!;
      final conditionsText = profile.healthConditions.isNotEmpty
          ? profile.healthConditions.join(', ')
          : 'Chưa có thông tin';
      profileContent = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _InfoRow('Bệnh mãn tính', conditionsText),
          if (profile.notes != null && profile.notes!.isNotEmpty)
            _InfoRow('Ghi chú', profile.notes!),
        ],
      );
    }

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
          const Row(
            children: [
              Icon(Icons.health_and_safety, color: AppColors.primary, size: 20),
              SizedBox(width: 8),
              Text(
                'Hồ sơ sức khỏe',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary),
              ),
            ],
          ),
          const Divider(height: 20),
          profileContent,
        ],
      ),
    );
  }

  Widget _buildSettingsSection(BuildContext context) {
    final items = [
      (Icons.edit, 'Chỉnh sửa hồ sơ', AppColors.primary, () {}),
      (Icons.notifications, 'Cài đặt thông báo', AppColors.secondary, () {}),
      (Icons.people, 'Gia đình đã kết nối', AppColors.warning, () {}),
      (Icons.help_outline, 'Trợ giúp', AppColors.textSecondary, () {}),
    ];

    return Container(
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
        children: [
          ...items.map((item) => _SettingsTile(
                icon: item.$1,
                iconColor: item.$3,
                label: item.$2,
                onTap: item.$4,
              )),
          const Divider(height: 1),
          _SettingsTile(
            icon: Icons.logout,
            iconColor: AppColors.error,
            label: 'Đăng xuất',
            onTap: () async {
              await ref.read(authRepositoryProvider).signOut();
              if (context.mounted) context.go('/phone');
            },
            textColor: AppColors.error,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  final Color? textColor;

  const _SettingsTile({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.onTap,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor, size: 22),
      title: Text(
        label,
        style: TextStyle(
            color: textColor ?? AppColors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w500),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
      onTap: onTap,
    );
  }
}
