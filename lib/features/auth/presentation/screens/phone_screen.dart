import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';

class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});

  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _usePhoneLogin = false;
  // Dev mode
  final _phoneController = TextEditingController();
  bool _showDevMode = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final notifier = ref.read(loginProvider.notifier);
    if (_usePhoneLogin) {
      final phone =
          '+84${_phoneController.text.replaceFirst(RegExp(r'^0'), '')}';
      notifier.login(phone: phone, password: _passwordController.text);
    } else {
      notifier.login(
          email: _emailController.text.trim(),
          password: _passwordController.text);
    }
  }

  void _submitDev() {
    final phone =
        '+84${_phoneController.text.replaceFirst(RegExp(r'^0'), '')}';
    ref.read(loginProvider.notifier).loginDev(phone);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(loginProvider);

    ref.listen(loginProvider, (_, next) {
      if (next.success) {
        context.go('/home');
      } else if (next.needsVerification) {
        context.push('/verify-email-prompt',
            extra: next.unverifiedEmail ?? _emailController.text.trim());
      } else if (next.error?.startsWith('DEV_NEEDS_REGISTER:') == true) {
        final phone = next.error!.replaceFirst('DEV_NEEDS_REGISTER:', '');
        context.pushReplacement('/register-dev', extra: 'DEV_PHONE:$phone');
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                const Text('Welcome Back!',
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary, height: 1.2)),
                const SizedBox(height: 12),
                const Text('Sign in to continue monitoring\nyour loved ones',
                    style: TextStyle(fontSize: 15, color: AppColors.textSecondary,
                        height: 1.5)),
                const SizedBox(height: 28),

                // Email/Phone toggle
                Row(children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _usePhoneLogin = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: !_usePhoneLogin
                              ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text('Email',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: !_usePhoneLogin
                                    ? Colors.white : AppColors.textSecondary,
                                fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _usePhoneLogin = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _usePhoneLogin
                              ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text('Phone',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: _usePhoneLogin
                                    ? Colors.white : AppColors.textSecondary,
                                fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ),
                ]),
                const SizedBox(height: 20),

                // Email or Phone field
                if (!_usePhoneLogin)
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Email',
                      prefixIcon: const Icon(Icons.email_outlined,
                          color: AppColors.textSecondary),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.socialBorder)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.socialBorder)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                      filled: true, fillColor: AppColors.background,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    ),
                    validator: _usePhoneLogin ? null : (v) {
                      if (v == null || v.trim().isEmpty) return 'Please enter your email';
                      if (!v.contains('@')) return 'Invalid email format';
                      return null;
                    },
                  )
                else
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Phone number',
                      prefixIcon: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Text('🇻🇳', style: TextStyle(fontSize: 18)),
                          SizedBox(width: 6),
                          Text('+84', style: TextStyle(fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary)),
                        ]),
                      ),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.socialBorder)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.socialBorder)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                      filled: true, fillColor: AppColors.background,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    ),
                    validator: _usePhoneLogin ? (v) {
                      if (v == null || v.trim().isEmpty) return 'Please enter your phone';
                      if (!RegExp(r'^\d{9,10}$').hasMatch(v.trim())) return 'Phone must be 9-10 digits';
                      return null;
                    } : null,
                  ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outlined,
                        color: AppColors.textSecondary),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                          color: AppColors.textHint, size: 20),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.socialBorder)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.socialBorder)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                    errorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.error)),
                    filled: true, fillColor: AppColors.background,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Please enter your password';
                    return null;
                  },
                ),

                if (state.error != null && !state.error!.startsWith('DEV_')) ...[
                  const SizedBox(height: 12),
                  Text(state.error!,
                      style: const TextStyle(color: AppColors.error, fontSize: 13)),
                ],

                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/forgot-password'),
                    style: TextButton.styleFrom(
                        padding: EdgeInsets.zero, minimumSize: const Size(0, 0),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                    child: const Text('Forgot Password?',
                        style: TextStyle(color: AppColors.primary, fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity, height: 54,
                  child: ElevatedButton(
                    onPressed: state.isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: state.isLoading
                        ? const SizedBox(width: 22, height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5))
                        : const Text('Sign In',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(height: 32),

                // Social login: disabled until backend OAuth integration is complete.
                // const Row(children: [
                //   Expanded(child: Divider()),
                //   Padding(
                //     padding: EdgeInsets.symmetric(horizontal: 16),
                //     child: Text('Or continue with',
                //         style: TextStyle(color: AppColors.textHint, fontSize: 13)),
                //   ),
                //   Expanded(child: Divider()),
                // ]),
                // const SizedBox(height: 24),
                // _SocialButton(...)
                // const SizedBox(height: 12),
                // _SocialButton(...)

                // Dev mode — only available in debug builds
                if (kDebugMode) ...[
                  const SizedBox(height: 28),
                  Center(
                    child: InkWell(
                      onTap: () => setState(() => _showDevMode = !_showDevMode),
                      child: Text(_showDevMode ? '▲ Hide Dev Mode' : '▼ Dev Mode',
                          style: const TextStyle(fontSize: 12, color: AppColors.textHint)),
                    ),
                  ),
                  if (_showDevMode) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF8E1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: AppColors.warning.withValues(alpha: 0.4)),
                      ),
                      child: const Text(
                        'Dev Mode — Enter phone to bypass email login',
                        style: TextStyle(fontSize: 12, color: Color(0xFF795548)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        hintText: 'Phone number',
                        prefixIcon: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 12),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Text('🇻🇳', style: TextStyle(fontSize: 18)),
                            SizedBox(width: 6),
                            Text('+84', style: TextStyle(fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary)),
                          ]),
                        ),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                        filled: true, fillColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity, height: 48,
                      child: OutlinedButton.icon(
                        onPressed: state.isLoading ? null : _submitDev,
                        icon: const Icon(Icons.developer_mode, size: 18),
                        label: const Text('Dev Login (bypass)',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.warning,
                          side: const BorderSide(color: AppColors.warning),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ],

                const SizedBox(height: 40),
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account? ",
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                      GestureDetector(
                        onTap: () => context.push('/register'),
                        child: const Text('Sign Up',
                            style: TextStyle(color: AppColors.primary, fontSize: 14,
                                fontWeight: FontWeight.w700)),
                      ),
                    ],
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

// ── Social button widgets (disabled until OAuth integration) ──────────
// TODO: Re-enable when Google/Facebook OAuth flows are implemented.
//
// class _SocialButton extends StatelessWidget { ... }
// class _GoogleIcon extends StatelessWidget { ... }
// class _FacebookIcon extends StatelessWidget { ... }
