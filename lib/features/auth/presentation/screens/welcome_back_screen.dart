import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';

/// Shown after successful OTP verification — welcomes the user by name.
class WelcomeBackScreen extends StatefulWidget {
  final String userName;
  final Map<String, dynamic>? user;

  const WelcomeBackScreen({super.key, required this.userName, this.user});

  @override
  State<WelcomeBackScreen> createState() => _WelcomeBackScreenState();
}

class _WelcomeBackScreenState extends State<WelcomeBackScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _anim;
  late Animation<double> _fade;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));
    _fade = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _anim, curve: const Interval(0.0, 0.6, curve: Curves.easeOut)));
    _scale = Tween<double>(begin: 0.6, end: 1).animate(
        CurvedAnimation(parent: _anim, curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack)));
    _anim.forward();

    // Auto-navigate to home after 3 seconds
    Future.delayed(const Duration(milliseconds: 3000), () {
      if (mounted) context.go('/home');
    });
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8F5E9),
      body: SafeArea(
        child: Center(
          child: AnimatedBuilder(
            animation: _anim,
            builder: (context, _) {
              return Opacity(
                opacity: _fade.value,
                child: Transform.scale(
                  scale: _scale.value,
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120, height: 120,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.2),
                                  blurRadius: 24,
                                  offset: const Offset(0, 8)),
                            ],
                          ),
                          child: const Icon(Icons.verified_rounded,
                              color: AppColors.primary, size: 64),
                        ),
                        const SizedBox(height: 32),
                        Text('🎉',
                            style: const TextStyle(fontSize: 40)),
                        const SizedBox(height: 12),
                        const Text('Welcome to CareNest!',
                            style: TextStyle(fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary),
                            textAlign: TextAlign.center),
                        const SizedBox(height: 10),
                        Text('We\'re so happy to have you,\n${widget.userName}! 🌿',
                            style: const TextStyle(fontSize: 16,
                                color: AppColors.textSecondary, height: 1.5),
                            textAlign: TextAlign.center),
                        const SizedBox(height: 8),
                        const Text(
                          'Your account is ready.\nLet\'s take care of your loved ones together.',
                          style: TextStyle(fontSize: 13,
                              color: AppColors.textHint, height: 1.4),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 48),
                        SizedBox(
                          width: 200, height: 48,
                          child: ElevatedButton(
                            onPressed: () => context.go('/home'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14)),
                            ),
                            child: const Text('Get Started',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
