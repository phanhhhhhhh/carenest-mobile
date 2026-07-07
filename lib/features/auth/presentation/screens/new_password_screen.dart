import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/back_button.dart' as back_btn;

/// Step 3: Set new password with reset token (from email link).
class NewPasswordScreen extends ConsumerStatefulWidget {
  final String token;

  const NewPasswordScreen({super.key, required this.token});

  @override
  ConsumerState<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends ConsumerState<NewPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _error;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  int _strength(String p) {
    if (p.isEmpty) return 0;
    if (p.length < 8) return 1;
    bool hasUpper = p.contains(RegExp(r'[A-Z]'));
    bool hasLower = p.contains(RegExp(r'[a-z]'));
    bool hasDigit = p.contains(RegExp(r'\d'));
    if (!hasUpper || !hasLower || !hasDigit) return 2;
    return 3;
  }

  void _submit() {
    final p = _passwordController.text;
    final c = _confirmController.text;

    if (p.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters');
      return;
    }
    if (!RegExp(r'(?=.*[A-Z])(?=.*[a-z])(?=.*\d)').hasMatch(p)) {
      setState(() => _error = 'Need uppercase, lowercase, and digit');
      return;
    }
    if (p != c) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() => _error = null);
    ref.read(resetPasswordProvider.notifier).reset(
          token: widget.token,
          newPassword: p,
          confirmPassword: c,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(resetPasswordProvider);
    final strength = _strength(_passwordController.text);

    ref.listen(resetPasswordProvider, (_, next) {
      if (next.success) {
        context.pushReplacement('/password-reset-success');
      }
      if (next.error != null) {
        setState(() => _error = next.error);
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
              const Text('Set New Password',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              const Text('Must be at least 8 characters with uppercase, lowercase, and digit',
                  style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5)),
              const SizedBox(height: 40),

              const Text('New Password',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary)),
              const SizedBox(height: 6),
              _pwField(_passwordController, _obscurePassword,
                  () => setState(() => _obscurePassword = !_obscurePassword)),
              if (_passwordController.text.isNotEmpty) ...[
                const SizedBox(height: 12),
                Row(children: List.generate(3, (i) {
                  final active = i < strength;
                  return Expanded(
                    child: Container(
                      height: 4, margin: const EdgeInsets.only(right: 4),
                      decoration: BoxDecoration(
                        color: active
                            ? (strength < 2 ? AppColors.warning : AppColors.success)
                            : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                })),
                const SizedBox(height: 4),
                Text(['', 'Weak', 'Medium', 'Strong'][strength],
                    style: TextStyle(fontSize: 12,
                        color: strength < 2 ? AppColors.warning : AppColors.success)),
              ],
              const SizedBox(height: 20),

              const Text('Confirm Password',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary)),
              const SizedBox(height: 6),
              _pwField(_confirmController, _obscureConfirm,
                  () => setState(() => _obscureConfirm = !_obscureConfirm)),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
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
                      : const Text('Set Password',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pwField(TextEditingController ctrl, bool obscure, VoidCallback toggle) {
    return TextFormField(
      controller: ctrl,
      obscureText: obscure,
      onChanged: (_) => setState(() => _error = null),
      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500,
          color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: '••••••••',
        suffixIcon: GestureDetector(
          onTap: toggle,
          child: Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: AppColors.textHint, size: 20),
          ),
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.textHint)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        filled: true, fillColor: Colors.white,
      ),
    );
  }
}
