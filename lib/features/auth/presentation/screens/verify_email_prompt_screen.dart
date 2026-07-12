import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';

/// Shown after successful registration.
/// Prompts the user to check their email for the verification link.
class VerifyEmailPromptScreen extends ConsumerStatefulWidget {
  final String email;

  const VerifyEmailPromptScreen({super.key, required this.email});

  @override
  ConsumerState<VerifyEmailPromptScreen> createState() =>
      _VerifyEmailPromptScreenState();
}

class _VerifyEmailPromptScreenState
    extends ConsumerState<VerifyEmailPromptScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(verifyEmailProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 96, height: 96,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.mark_email_unread,
                      color: AppColors.primary, size: 48),
                ),
                const SizedBox(height: 28),
                const Text('Verify Your Email',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary),
                    textAlign: TextAlign.center),
                const SizedBox(height: 12),
                Text(
                  'We\'ve sent a verification link to\n${widget.email}',
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary,
                      height: 1.5),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Please check your inbox and click the link to verify your account.',
                  style: TextStyle(fontSize: 13, color: AppColors.textHint,
                      height: 1.4),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Resend button
                if (state.success && state.message != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(state.message!,
                        style: const TextStyle(color: AppColors.success, fontSize: 13),
                        textAlign: TextAlign.center),
                  ),
                  const SizedBox(height: 16),
                ],
                if (state.error != null) ...[
                  Text(state.error!,
                      style: const TextStyle(color: AppColors.error, fontSize: 13),
                      textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                ],

                OutlinedButton.icon(
                  onPressed: state.isLoading
                      ? null
                      : () => ref
                          .read(verifyEmailProvider.notifier)
                          .resend(widget.email),
                  icon: state.isLoading
                      ? const SizedBox(width: 16, height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.refresh, size: 18),
                  label: const Text('Resend Email'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  ),
                ),
                const SizedBox(height: 40),

                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: () => context.go('/phone'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: const Text('Back to Sign In',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
