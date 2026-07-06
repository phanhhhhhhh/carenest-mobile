import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../family/presentation/providers/family_provider.dart';
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
  String _role = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final name = await SecureStorage.getName();
    final phone = await SecureStorage.getPhone();
    final role = await SecureStorage.getRole();
    if (mounted) {
      setState(() {
        _name = name ?? 'User';
        _phone = phone ?? '';
        _role = role ?? 'ELDERLY';
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
              const SizedBox(height: 28),
              _buildHealthProfile(),
              const SizedBox(height: 20),
              _buildConnectedFamily(),
              const SizedBox(height: 20),
              _buildSettingsSection(context),
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
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: const Icon(Icons.person,
                  size: 56, color: AppColors.primary),
            ),
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary,
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
        Text(
          _name,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        if (_phone.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            _phone,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
        ],
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: _role == 'ELDERLY'
                ? AppColors.primary.withOpacity(0.1)
                : AppColors.secondary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _role == 'ELDERLY' ? 'Elderly' : 'Family',
            style: TextStyle(
              color: _role == 'ELDERLY'
                  ? AppColors.primary
                  : AppColors.secondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHealthProfile() {
    final profileState = ref.watch(elderlyProfileProvider);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
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
          const Row(
            children: [
              Icon(Icons.health_and_safety,
                  color: AppColors.primary, size: 22),
              SizedBox(width: 10),
              Text(
                'Health Profile',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          if (profileState.isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (profileState.error != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(
                  children: [
                    Text(
                      profileState.error!,
                      style: const TextStyle(
                          color: AppColors.error, fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => ref
                          .read(elderlyProfileProvider.notifier)
                          .load(),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          else ...[
            _buildConditionTags(profileState.profile?.healthConditions ?? []),
            if (profileState.profile?.bloodType?.isNotEmpty == true) ...[
              const SizedBox(height: 14),
              _InfoRow('Blood Type', profileState.profile!.bloodType!),
            ],
            if (profileState.profile?.weight != null) ...[
              const SizedBox(height: 8),
              _InfoRow('Weight', '${profileState.profile!.weight} kg'),
            ],
            if (profileState.profile?.height != null) ...[
              const SizedBox(height: 8),
              _InfoRow('Height', '${profileState.profile!.height} cm'),
            ],
            if ((profileState.profile?.allergies ?? []).isNotEmpty) ...[
              const SizedBox(height: 14),
              _buildAllergyTags(profileState.profile!.allergies),
            ],
            if (profileState.profile?.notes?.isNotEmpty == true) ...[
              const SizedBox(height: 14),
              _InfoRow('Notes', profileState.profile!.notes ?? ''),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildConditionTags(List<String> conditions) {
    if (conditions.isEmpty) {
      return const Text(
        'No medical conditions recorded',
        style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
      );
    }
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: conditions.map((c) {
        Color tagColor;
        switch (c.toLowerCase()) {
          case 'diabetes':
            tagColor = AppColors.warning;
            break;
          case 'hypertension':
            tagColor = AppColors.error;
            break;
          default:
            tagColor = AppColors.primary;
        }
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: tagColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: tagColor.withOpacity(0.3)),
          ),
          child: Text(
            c,
            style: TextStyle(
              color: tagColor,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAllergyTags(List<String> allergies) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Drug Allergies',
            style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: allergies.map((a) {
            return Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: Text(
                a,
                style: const TextStyle(
                  color: AppColors.error,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildConnectedFamily() {
    final familyState = ref.watch(linkedFamilyProvider);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
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
          const Row(
            children: [
              Icon(Icons.people, color: AppColors.secondary, size: 22),
              SizedBox(width: 10),
              Text(
                'Connected Family Members',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          if (familyState.isLoading && familyState.members.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (familyState.members.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'No family members connected yet.\nAsk your family to add you by phone number.',
                style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.5),
                textAlign: TextAlign.center,
              ),
            )
          else
            ...familyState.members.map((m) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    radius: 22,
                    backgroundColor: AppColors.secondary.withOpacity(0.1),
                    child: const Icon(Icons.person,
                        color: AppColors.secondary, size: 24),
                  ),
                  title: Text(m.name,
                      style: const TextStyle(
                          fontWeight: FontWeight.w500, fontSize: 14)),
                  subtitle: Text(m.phone,
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12)),
                  trailing: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                    ),
                  ),
                )),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(BuildContext context) {
    final items = [
      (
        Icons.edit,
        'Edit Profile',
        AppColors.primary,
        AppColors.primary.withOpacity(0.08),
        () => context.go('/elderly/edit-profile'),
      ),
      (
        Icons.contact_emergency,
        'Emergency Contacts',
        AppColors.sosPrimary,
        AppColors.sosPrimary.withOpacity(0.08),
        () => context.go('/elderly/emergency-contacts'),
      ),
      (
        Icons.notifications_outlined,
        'Notification Settings',
        AppColors.secondary,
        AppColors.secondary.withOpacity(0.08),
        () => context.go('/notification-settings'),
      ),
      (
        Icons.workspace_premium_outlined,
        'Upgrade to Premium',
        AppColors.warning,
        AppColors.warning.withOpacity(0.08),
        () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Feature under development')),
          );
        }
      ),
      (
        Icons.help_outline,
        'Help & Support',
        AppColors.textSecondary,
        AppColors.textHint.withOpacity(0.08),
        () {}
      ),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
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
                    title: Text(
                      item.$2,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
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
                color: AppColors.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.logout,
                  color: AppColors.error, size: 20),
            ),
            title: const Text(
              'Sign Out',
              style: TextStyle(
                color: AppColors.error,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
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

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
