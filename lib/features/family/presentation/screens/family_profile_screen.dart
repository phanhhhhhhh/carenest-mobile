import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/family_provider.dart';

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
        _name = name ?? 'User';
        _phone = phone ?? '';
      });
    }
  }

  void _showAddFamilyDialog() {
    final phoneCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Add family member'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Enter the elderly person\'s phone number to send a connection request.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Phone number',
                hintText: 'e.g., 0912345678',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon:
                    const Icon(Icons.phone, color: AppColors.primary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          Consumer(
            builder: (context, ref, _) {
              final linkState = ref.watch(familyLinkProvider);
              return ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                onPressed: linkState.isLoading
                    ? null
                    : () async {
                        final phone = phoneCtrl.text.trim();
                        if (phone.isEmpty) return;

                        // Resolve phone → userId first (normalize format)
                        final rawPhone = phoneCtrl.text.trim();
                        String? elderlyId;
                        try {
                          // Normalize: strip leading 0, ensure +84 prefix
                          String normalized = rawPhone;
                          if (normalized.startsWith('0')) {
                            normalized = '+84${normalized.substring(1)}';
                          } else if (!normalized.startsWith('+')) {
                            normalized = '+84$normalized';
                          }
                          final dio = ref.read(dioProvider);
                          final lookupResp = await dio.get('/users/by-phone/$normalized');
                          elderlyId = lookupResp.data['id']?.toString();
                        } catch (_) {
                          // lookup failed
                        }

                        if (elderlyId == null) {
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('No user found with that phone number'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                          return;
                        }

                        final ok = await ref
                            .read(familyLinkProvider.notifier)
                            .sendLinkRequest(elderlyId);
                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(ok
                                  ? 'Connection request sent!'
                                  : linkState.error ??
                                      'Could not send request'),
                              backgroundColor:
                                  ok ? AppColors.success : AppColors.error,
                            ),
                          );
                          if (ok) {
                            ref
                                .read(familyDashboardProvider.notifier)
                                .refresh();
                          }
                        }
                      },
                child: Text(
                    linkState.isLoading ? 'Sending...' : 'Send request'),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dash = ref.watch(familyDashboardProvider);
    final elderlyName = dash.data?.elderlyName;
    final healthConditions = dash.data?.healthConditions ?? [];
    final totalMeds = dash.data?.totalMedications ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              _buildAvatar(),
              const SizedBox(height: 28),
              if (elderlyName != null) ...[
                _buildConnectedElderly(
                    elderlyName, healthConditions, totalMeds),
                const SizedBox(height: 20),
              ],
              _buildAddFamilyCard(),
              const SizedBox(height: 20),
              _buildSettings(context),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    return Column(
      children: [
        Stack(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: AppColors.secondary.withValues(alpha: 0.1),
              child: const Icon(Icons.person,
                  size: 56, color: AppColors.secondary),
            ),
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.surface, width: 3),
                ),
                child: const Icon(Icons.camera_alt,
                    color: Colors.white, size: 16),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(_name,
            style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary)),
        if (_phone.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(_phone,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 14)),
        ],
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.secondary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text('Family / Caregiver',
              style: TextStyle(
                  color: AppColors.secondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _buildConnectedElderly(
      String name, List<String> conditions, int totalMeds) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
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
          const Row(
            children: [
              Icon(Icons.people, color: AppColors.primary, size: 22),
              SizedBox(width: 10),
              Text('Connected family member',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
            ],
          ),
          const Divider(height: 24),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              child: const Icon(Icons.elderly,
                  color: AppColors.primary, size: 28),
            ),
            title: Text(name,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 15)),
            subtitle: Row(
              children: [
                if (conditions.isNotEmpty)
                  Text(conditions.first,
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12)),
                if (totalMeds > 0) ...[
                  if (conditions.isNotEmpty) const Text(' • '),
                  Text('$totalMeds medications',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12)),
                ],
              ],
            ),
            trailing: Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                  color: AppColors.success, shape: BoxShape.circle),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddFamilyCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: InkWell(
        onTap: _showAddFamilyDialog,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.person_add,
                    color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Add family member',
                        style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600)),
                    SizedBox(height: 2),
                    Text('Connect with an elderly account to monitor health',
                        style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right,
                  color: AppColors.primary, size: 22),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettings(BuildContext context) {
    final items = [
      (
        Icons.edit,
        'Edit Profile',
        AppColors.primary,
        AppColors.primary.withValues(alpha: 0.08),
        () {}
      ),
      (
        Icons.notifications_outlined,
        'Notification Settings',
        AppColors.secondary,
        AppColors.secondary.withValues(alpha: 0.08),
        () => context.go('/notification-settings'),
      ),
      (
        Icons.workspace_premium_outlined,
        'Upgrade Premium',
        AppColors.warning,
        AppColors.warning.withValues(alpha: 0.08),
        () => context.go('/premium-plans'),
      ),
      (
        Icons.help_outline,
        'Help & Support',
        AppColors.textSecondary,
        AppColors.textHint.withValues(alpha: 0.08),
        () {}
      ),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          ...items.map((item) => Column(
                children: [
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: item.$4,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(item.$1, color: item.$3, size: 20),
                    ),
                    title: Text(item.$2,
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w500)),
                    trailing: const Icon(Icons.chevron_right,
                        color: AppColors.textHint, size: 20),
                    onTap: item.$5,
                  ),
                  const Divider(height: 1, indent: 72),
                ],
              )),
          ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.logout,
                  color: AppColors.error, size: 20),
            ),
            title: const Text('Log out',
                style: TextStyle(
                    color: AppColors.error,
                    fontSize: 15,
                    fontWeight: FontWeight.w500)),
            trailing: const Icon(Icons.chevron_right,
                color: AppColors.textHint, size: 20),
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
