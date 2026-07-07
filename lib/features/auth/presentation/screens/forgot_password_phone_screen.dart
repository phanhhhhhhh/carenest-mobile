import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/back_button.dart' as back_btn;

/// Forgot Password: enter email to receive reset link.
class ForgotPasswordPhoneScreen extends ConsumerStatefulWidget {
  const ForgotPasswordPhoneScreen({super.key});

  @override
  ConsumerState<ForgotPasswordPhoneScreen> createState() =>
      _ForgotPasswordPhoneScreenState();
}

class _ForgotPasswordPhoneScreenState
    extends ConsumerState<ForgotPasswordPhoneScreen> {
  final _emailController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _submit() {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Please enter a valid email');
      return;
    }
    setState(() => _error = null);
    ref.read(forgotPasswordProvider.notifier).sendResetEmail(email);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(forgotPasswordProvider);

    ref.listen(forgotPasswordProvider, (_, next) {
      if (next.emailSent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Reset link sent! Check your email.'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              back_btn.CircleBackButton(onPressed: () => context.pop()),
              const SizedBox(height: 32),
              const Text('Forgot Password',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              const Text(
                'Enter your email and we\'ll send you a password reset link.',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary,
                    height: 1.5),
              ),
              const SizedBox(height: 40),
              const Text('Email',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                onChanged: (_) { if (_error != null) setState(() => _error = null); },
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'example@email.com',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.textHint)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                  filled: true, fillColor: Colors.white,
                ),
              ),
              if (_error != null || state.error != null) ...[
                const SizedBox(height: 8),
                Text(_error ?? state.error!,
                    style: const TextStyle(color: AppColors.error, fontSize: 13)),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: state.isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: state.isLoading
                      ? const SizedBox(width: 22, height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.5))
                      : const Text('Send Reset Link',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Back to Sign In',
                      style: TextStyle(fontSize: 14, color: AppColors.textHint)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
