import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/auth_provider.dart';

/// UC-05: Verify PIN for local authentication (e.g. app unlock).
class PinVerifyScreen extends ConsumerStatefulWidget {
  const PinVerifyScreen({super.key});

  @override
  ConsumerState<PinVerifyScreen> createState() => _PinVerifyScreenState();
}

class _PinVerifyScreenState extends ConsumerState<PinVerifyScreen> {
  final _pinCtrl = TextEditingController();
  bool _obscurePin = true;
  String? _error;
  int _attempts = 0;

  @override
  void dispose() {
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final pin = _pinCtrl.text.trim();
    if (pin.isEmpty) return;

    setState(() => _error = null);
    final notifier = ref.read(pinProvider.notifier);
    await notifier.verifyPin(pin);

    if (!mounted) return;
    final state = ref.read(pinProvider);
    if (state.verified) {
      final role = await SecureStorage.getRole();
      if (mounted) {
        context.go(role == 'ELDERLY' ? '/elderly/home' : '/family/dashboard');
      }
    } else {
      setState(() {
        _attempts++;
        _error = _attempts >= 3
            ? 'Too many attempts. Use password to sign in.'
            : 'Incorrect PIN. ${3 - _attempts} attempts remaining.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pinProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.lock_outline,
                      color: AppColors.primary, size: 40),
                ),
                const SizedBox(height: 24),
                const Text('Enter PIN',
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                const Text('Use your PIN to unlock the app',
                    style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary)),
                const SizedBox(height: 36),
                TextFormField(
                  controller: _pinCtrl,
                  obscureText: _obscurePin,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  onChanged: (_) {
                    if (_error != null) setState(() => _error = null);
                  },
                  style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 12,
                      color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: '••••••',
                    counterText: '',
                    suffixIcon: GestureDetector(
                      onTap: () =>
                          setState(() => _obscurePin = !_obscurePin),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: Icon(
                            _obscurePin
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: AppColors.textHint,
                            size: 20),
                      ),
                    ),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(
                            color: AppColors.textHint)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(
                            color: AppColors.primary, width: 2)),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!,
                      style: const TextStyle(
                          color: AppColors.error, fontSize: 13),
                      textAlign: TextAlign.center),
                ],
                const SizedBox(height: 28),
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
                          borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: state.isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5))
                        : const Text('Unlock',
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600)),
                  ),
                ),
                if (_attempts >= 3) ...[
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => context.go('/phone'),
                    child: const Text('Sign in with password instead',
                        style: TextStyle(
                            color: AppColors.primary, fontSize: 14)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
