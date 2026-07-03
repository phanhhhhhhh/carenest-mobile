import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/back_button.dart' as back_btn;

/// Step 1 of Forgot Password: enter phone number.
/// Matches Miro design: gray circle back button, +84 prefix, title & subtitle.
class ForgotPasswordPhoneScreen extends ConsumerStatefulWidget {
  const ForgotPasswordPhoneScreen({super.key});

  @override
  ConsumerState<ForgotPasswordPhoneScreen> createState() =>
      _ForgotPasswordPhoneScreenState();
}

class _ForgotPasswordPhoneScreenState
    extends ConsumerState<ForgotPasswordPhoneScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  bool _isValidPhone(String value) {
    return RegExp(r'^0?[3-9]\d{8}$').hasMatch(value);
  }

  void _submit() {
    final rawPhone = _phoneController.text;
    if (rawPhone.isEmpty) {
      setState(() => _error = 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!_isValidPhone(rawPhone)) {
      setState(() => _error = 'Số điện thoại không hợp lệ');
      return;
    }
    setState(() => _error = null);
    final phone = '+84${rawPhone.replaceFirst(RegExp(r'^0'), '')}';
    ref.read(forgotPasswordPhoneProvider.notifier).sendOtp(phone);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(forgotPasswordPhoneProvider);
    final rawPhone = _phoneController.text;
    final phone = '+84${rawPhone.replaceFirst(RegExp(r'^0'), '')}';

    ref.listen(forgotPasswordPhoneProvider, (_, next) {
      if (next.success) {
        context.push('/forgot-password/otp', extra: phone);
      }
    });
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),

                // Custom gray circle back button
                back_btn.CircleBackButton(onPressed: () => context.pop()),

                const SizedBox(height: 32),

                const Text(
                  'Quên mật khẩu',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Nhập số điện thoại đã đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 40),

                // Phone input with +84 prefix
                Text(
                  'Số điện thoại',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.textHint),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(left: 16, right: 4),
                        child: Text(
                          '+84',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      Expanded(
                        child: TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          onChanged: (_) {
                            if (_error != null) setState(() => _error = null);
                          },
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                          decoration: const InputDecoration(
                            hintText: '912 345 678',
                            border: InputBorder.none,
                            contentPadding:
                                EdgeInsets.symmetric(vertical: 14, horizontal: 4),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (_error != null || state.error != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _error ?? state.error!,
                    style: const TextStyle(
                      color: AppColors.error,
                      fontSize: 13,
                    ),
                  ),
                ],

                const SizedBox(height: 32),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: state.isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor:
                          AppColors.primary.withValues(alpha: 0.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: state.isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : const Text(
                            'Gửi mã OTP',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.pop(),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.textHint,
                    ),
                    child: const Text(
                      'Quay lại đăng nhập',
                      style: TextStyle(fontSize: 14),
                    ),
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
