import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class FamilyProfileScreen extends ConsumerStatefulWidget {
  const FamilyProfileScreen({super.key});

  @override
  ConsumerState<FamilyProfileScreen> createState() =>
      _FamilyProfileScreenState();
}

class _FamilyProfileScreenState extends ConsumerState<FamilyProfileScreen> {
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
              _buildConnectedElderly(),
              const SizedBox(height: 16),
              _buildSettings(context),
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
          backgroundColor: AppColors.secondary.withOpacity(0.15),
          child:
              const Icon(Icons.person, size: 48, color: AppColors.secondary),
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
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 14),
          ),
        ],
        const SizedBox(height: 8),
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.secondary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text(
            'Người thân / Gia đình',
            style: TextStyle(
                color: AppColors.secondary,
                fontSize: 12,
                fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  Widget _buildConnectedElderly() {
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
              Icon(Icons.people, color: AppColors.primary, size: 20),
              SizedBox(width: 8),
              Text(
                'Người thân đã kết nối',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary),
              ),
            ],
          ),
          const Divider(height: 20),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: const Icon(Icons.elderly, color: AppColors.primary),
            ),
            title: const Text('Nguyễn Văn An',
                style: TextStyle(
                    fontWeight: FontWeight.w500, fontSize: 14)),
            subtitle: const Text('72 tuổi • Bố',
                style: TextStyle(
                    color: AppColors.textSecondary, fontSize: 12)),
            trailing: Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                  color: AppColors.success, shape: BoxShape.circle),
            ),
          ),
          const Divider(height: 1),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.primary.withOpacity(0.05),
              child: const Icon(Icons.add, color: AppColors.textHint),
            ),
            title: const Text('Thêm người thân',
                style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500)),
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildSettings(BuildContext context) {
    final items = [
      (Icons.edit, 'Chỉnh sửa hồ sơ', AppColors.primary, () {}),
      (Icons.notifications, 'Cài đặt thông báo', AppColors.secondary, () {}),
      (Icons.workspace_premium, 'Nâng cấp Premium', AppColors.warning, () {}),
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
          ...items.map((item) => Column(
                children: [
                  ListTile(
                    leading: Icon(item.$1, color: item.$3, size: 22),
                    title: Text(item.$2,
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w500)),
                    trailing: const Icon(Icons.chevron_right,
                        color: AppColors.textHint),
                    onTap: item.$4,
                  ),
                  const Divider(height: 1, indent: 16),
                ],
              )),
          ListTile(
            leading:
                const Icon(Icons.logout, color: AppColors.error, size: 22),
            title: const Text('Đăng xuất',
                style: TextStyle(
                    color: AppColors.error,
                    fontSize: 14,
                    fontWeight: FontWeight.w500)),
            trailing: const Icon(Icons.chevron_right,
                color: AppColors.textHint),
            onTap: () async {
              await ref.read(authRepositoryProvider).signOut();
              if (context.mounted) context.go('/phone');
            },
          ),
        ],
      ),
    );
  }
}
