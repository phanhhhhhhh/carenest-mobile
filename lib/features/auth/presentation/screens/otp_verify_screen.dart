import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// Screen to enter the 6-digit OTP code sent via email or SMS.
class OtpVerifyScreen extends ConsumerStatefulWidget {
  final String target; // email or phone
  final String method; // EMAIL or SMS
  final String userName;

  const OtpVerifyScreen({
    super.key,
    required this.target,
    required this.method,
    required this.userName,
  });

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _isLoading = false;
  String? _error;
  int _secondsLeft = 120;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
    _sendOtp();
  }

  @override
  void dispose() {
    for (var c in _controllers) {
      c.dispose();
    }
    for (var f in _focusNodes) {
      f.dispose();
    }
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() {
        if (_secondsLeft > 0) _secondsLeft--;
      });
    });
  }

  Future<void> _sendOtp() async {
    try {
      await ref
          .read(otpProvider.notifier)
          .sendOtp(widget.target, widget.method);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not send code. Try again.');
      }
    }
  }

  void _verify() {
    final code = _controllers.map((c) => c.text).join();
    if (code.length != 6) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    ref.read(otpProvider.notifier).verifyOtp(widget.target, code).then((
      result,
    ) {
      if (!mounted) return;
      if (result != null) {
        // Success — navigate to welcome-back
        context.go(
          '/welcome-back',
          extra: {
            'userName': result['name'] ?? widget.userName,
            'accessToken': result['accessToken'],
            'refreshToken': result['refreshToken'],
            'user': result['user'],
          },
        );
      } else {
        setState(() {
          _isLoading = false;
          _error =
              ref.read(otpProvider).error ?? 'Invalid code. Please try again.';
        });
        // Clear input on error
        for (var c in _controllers) c.clear();
        _focusNodes.first.requestFocus();
      }
    });
  }

  void _onChanged(int index, String value) {
    if (value.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    // Auto-submit when all 6 digits entered
    final allFilled = _controllers.every((c) => c.text.isNotEmpty);
    if (allFilled && !_isLoading) {
      _verify();
    }
  }

  @override
  Widget build(BuildContext context) {
    final icon = widget.method == 'SMS' ? Icons.sms : Icons.email_outlined;
    final methodName = widget.method == 'SMS' ? 'SMS' : 'email';
    final maskedTarget = widget.target.contains('@')
        ? widget.target
        : '••••${widget.target.substring(widget.target.length - 4)}';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              Icon(icon, size: 56, color: AppColors.primary),
              const SizedBox(height: 24),
              Text(
                'Enter Verification Code',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'We sent a 6-digit code via $methodName to\n$maskedTarget',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),

              // 6-digit input boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(6, (i) {
                  return SizedBox(
                    width: 48,
                    height: 60,
                    child: TextField(
                      controller: _controllers[i],
                      focusNode: _focusNodes[i],
                      textAlign: TextAlign.center,
                      maxLength: 1,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: _error != null
                                ? AppColors.error
                                : AppColors.textHint.withValues(alpha: 0.3),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: AppColors.textHint.withValues(alpha: 0.3),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.primary,
                            width: 2,
                          ),
                        ),
                      ),
                      onChanged: (v) => _onChanged(i, v),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),

              if (_error != null) ...[
                Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
              ],

              if (_isLoading) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 8),
                const Text(
                  'Verifying...',
                  style: TextStyle(fontSize: 13, color: AppColors.textHint),
                ),
              ],

              const SizedBox(height: 24),

              // Resend
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _secondsLeft > 0
                        ? 'Resend in ${_secondsLeft}s'
                        : 'Didn\'t receive it?',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textHint,
                    ),
                  ),
                  if (_secondsLeft == 0) ...[
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _secondsLeft = 120;
                          _error = null;
                        });
                        _sendOtp();
                      },
                      child: const Text(
                        'Resend',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
