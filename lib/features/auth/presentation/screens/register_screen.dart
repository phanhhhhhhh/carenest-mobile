import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String _selectedRole = 'ELDERLY';
  bool _agreedToTerms = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please agree to the Terms of Service')),
      );
      return;
    }
    final email = _emailController.text.trim();
    ref.read(registerProvider.notifier).register(
          email: email.isNotEmpty ? email : null,
          password: _passwordController.text,
          confirmPassword: _confirmPasswordController.text,
          name: _nameController.text.trim(),
          role: _selectedRole,
          phone: _phoneController.text.trim().isNotEmpty
              ? '+84${_phoneController.text.trim().replaceFirst(RegExp(r'^0'), '')}'
              : null,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(registerProvider);

    ref.listen(registerProvider, (_, next) {
      if (next.success) {
        context.go('/home');
      } else if (next.needsEmailVerification) {
        context.go('/verify-email-prompt',
            extra: next.verificationContact ?? _emailController.text.trim());
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: AppColors.textHint.withValues(alpha: 0.3)),
                    ),
                    child: const Icon(Icons.arrow_back,
                        color: AppColors.textSecondary, size: 22),
                  ),
                ),
                const SizedBox(height: 24),
                Text('Create Account',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                const Text('Fill in your details to complete registration',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                const SizedBox(height: 28),

                _buildLabel('Email (optional)'),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _emailController,
                  hint: 'example@email.com (skip for phone-only)',
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v != null && v.trim().isNotEmpty &&
                        !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim())) {
                      return 'Invalid email format';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 18),

                _buildLabel('Full Name *'),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _nameController,
                  hint: 'Full Name',
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Name is required';
                    if (v.trim().length < 2) return 'Name must be at least 2 characters';
                    return null;
                  },
                  textCapitalization: TextCapitalization.words,
                ),
                const SizedBox(height: 18),

                _buildLabel('Phone (optional)'),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _phoneController,
                  hint: '912 345 678',
                  keyboardType: TextInputType.phone,
                  validator: (v) {
                    if (v != null && v.trim().isNotEmpty &&
                        !RegExp(r'^\d{9,10}$').hasMatch(v.trim())) {
                      return 'Phone must be 9-10 digits';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 18),

                _buildLabel('Password *'),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _passwordController,
                  hint: 'Min 8 chars, 1 upper, 1 lower, 1 digit',
                  obscure: _obscurePassword,
                  suffix: IconButton(
                    icon: Icon(_obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                        color: AppColors.textHint, size: 20),
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 8) return 'At least 8 characters';
                    if (!RegExp(r'(?=.*[A-Z])(?=.*[a-z])(?=.*\d)').hasMatch(v)) {
                      return 'Need uppercase, lowercase, and digit';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 18),

                _buildLabel('Confirm Password *'),
                const SizedBox(height: 6),
                _buildTextField(
                  controller: _confirmPasswordController,
                  hint: 'Re-enter password',
                  obscure: _obscureConfirm,
                  suffix: IconButton(
                    icon: Icon(_obscureConfirm
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                        color: AppColors.textHint, size: 20),
                    onPressed: () =>
                        setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                  validator: (v) {
                    if (v != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 22),

                _buildLabel('I am'),
                const SizedBox(height: 8),
                _RoleSelector(
                  selected: _selectedRole,
                  onChange: (role) => setState(() => _selectedRole = role),
                ),
                const SizedBox(height: 22),

                Row(children: [
                  SizedBox(width: 22, height: 22,
                    child: Checkbox(
                      value: _agreedToTerms,
                      onChanged: (v) =>
                          setState(() => _agreedToTerms = v ?? false),
                      activeColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text.rich(TextSpan(
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      children: [
                        TextSpan(text: 'I agree to the '),
                        TextSpan(text: 'Terms of Service',
                            style: TextStyle(color: AppColors.primary,
                                fontWeight: FontWeight.w600)),
                        TextSpan(text: ' and '),
                        TextSpan(text: 'Privacy Policy',
                            style: TextStyle(color: AppColors.primary,
                                fontWeight: FontWeight.w600)),
                      ],
                    )),
                  ),
                ]),

                if (state.error != null) ...[
                  const SizedBox(height: 16),
                  Text(state.error!,
                      style: const TextStyle(color: AppColors.error, fontSize: 13)),
                ],
                const SizedBox(height: 28),

                SizedBox(
                  width: double.infinity, height: 52,
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
                        : const Text('Sign Up',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: () => context.pop(),
                    child: const Text.rich(TextSpan(
                      style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                      children: [
                        TextSpan(text: 'Already have an account? '),
                        TextSpan(text: 'Sign In',
                            style: TextStyle(color: AppColors.primary,
                                fontWeight: FontWeight.w700)),
                      ],
                    )),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) => Text(text,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
          color: AppColors.textPrimary));

  Widget _buildTextField({
    required TextEditingController controller,
    String? hint,
    bool obscure = false,
    Widget? suffix,
    String? Function(String?)? validator,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      validator: validator,
      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500,
          color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textHint, fontWeight: FontWeight.w400),
        suffixIcon: suffix,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.textHint)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.error)),
        filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}

class _RoleSelector extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChange;
  const _RoleSelector({required this.selected, required this.onChange});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      _RoleCard(label: 'Elderly', icon: Icons.elderly_woman_rounded,
          isSelected: selected == 'ELDERLY', onTap: () => onChange('ELDERLY')),
      const SizedBox(width: 12),
      _RoleCard(label: 'Family\n/ Relative', icon: Icons.family_restroom_rounded,
          isSelected: selected == 'FAMILY', onTap: () => onChange('FAMILY')),
    ]);
  }
}

class _RoleCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;
  const _RoleCard({required this.label, required this.icon,
      required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppColors.primary
                  : AppColors.textHint.withValues(alpha: 0.4),
              width: isSelected ? 2 : 1,
            ),
            boxShadow: isSelected ? [
              BoxShadow(color: AppColors.primary.withValues(alpha: 0.25),
                  blurRadius: 8, offset: const Offset(0, 3)),
            ] : [],
          ),
          child: Column(children: [
            Icon(icon, color: isSelected ? Colors.white : AppColors.textSecondary, size: 30),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center, style: TextStyle(
              color: isSelected ? Colors.white : AppColors.textSecondary,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              fontSize: 13, height: 1.3,
            )),
          ]),
        ),
      ),
    );
  }
}
