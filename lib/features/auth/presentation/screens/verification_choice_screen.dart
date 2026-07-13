import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';

/// After registration, user chooses how to receive their verification code.
class VerificationChoiceScreen extends StatelessWidget {
  final String email;
  final String phone;
  final String userName;

  const VerificationChoiceScreen({
    super.key,
    required this.email,
    required this.phone,
    required this.userName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 88, height: 88,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.verified_user_outlined,
                    color: AppColors.primary, size: 44),
              ),
              const SizedBox(height: 28),
              Text('Welcome, $userName!',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary),
                  textAlign: TextAlign.center),
              const SizedBox(height: 12),
              const Text(
                'Choose how you\'d like to receive your verification code.',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),

              // Email option
              _OptionCard(
                icon: Icons.email_outlined,
                title: 'Send via Email',
                subtitle: email,
                color: AppColors.primary,
                onTap: () => context.push('/verify-otp', extra: {
                  'target': email,
                  'method': 'EMAIL',
                  'userName': userName,
                }),
              ),
              const SizedBox(height: 16),

              // SMS option
              _OptionCard(
                icon: Icons.sms_outlined,
                title: 'Send via SMS',
                subtitle:
                    phone.length > 10 ? '••••${phone.substring(phone.length - 4)}' : phone,
                color: AppColors.secondary,
                onTap: () => context.push('/verify-otp', extra: {
                  'target': phone,
                  'method': 'SMS',
                  'userName': userName,
                }),
              ),
              const SizedBox(height: 40),

              TextButton(
                onPressed: () => context.go('/phone'),
                child: const Text('Back to Sign In',
                    style: TextStyle(color: AppColors.textHint, fontSize: 14)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _OptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontSize: 16,
                          fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: color, size: 22),
          ],
        ),
      ),
    );
  }
}
