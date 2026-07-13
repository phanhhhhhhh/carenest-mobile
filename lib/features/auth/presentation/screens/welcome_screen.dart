import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';

/// Full welcome flow: Splash → 4 onboarding slides → Get Started.
/// Rebuilt to match the official CareNest wireframe (Miro "Welcome Flow")
/// using the real mascot/icon/logo assets under assets/images/.
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool _splashDone = false;

  void _onSplashDone() {
    setState(() => _splashDone = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_splashDone) {
      return _SplashScreen(onDone: _onSplashDone);
    }
    return const _OnboardingFlow();
  }
}

// ═══════════════════════════════════════════════════════════════════
// SPLASH SCREEN — mascot + wordmark + tagline (wireframe screen 1)
// ═══════════════════════════════════════════════════════════════════
class _SplashScreen extends StatefulWidget {
  final VoidCallback onDone;
  const _SplashScreen({required this.onDone});

  @override
  State<_SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<_SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), widget.onDone);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/mascot/mascot_thumbsup.jpg',
                width: 220,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 8),
              Image.asset(
                'assets/images/brand/logo_wordmark.jpg',
                width: 200,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 4),
              const Text(
                'Chăm sóc sức khỏe từ nơi xa',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// ONBOARDING FLOW (4 slides — wireframe screens 2-5)
// ═══════════════════════════════════════════════════════════════════
class _OnboardingFlow extends StatefulWidget {
  const _OnboardingFlow();

  @override
  State<_OnboardingFlow> createState() => _OnboardingFlowState();
}

class _OnboardingFlowState extends State<_OnboardingFlow> {
  final _controller = PageController();
  int _currentPage = 0;
  static const _totalSlides = 4;

  void _goToPage(int page) {
    _controller.animateToPage(
      page,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  void _skip() => _goToPage(_totalSlides - 1);

  void _goToRegister() => context.go('/register');

  void _goToLogin() => context.go('/phone');

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: PageView(
          controller: _controller,
          physics: const NeverScrollableScrollPhysics(),
          onPageChanged: (page) => setState(() => _currentPage = page),
          children: [
            _OnboardSlide(
              imagePath: 'assets/images/mascot/mascot_dashboard.jpg',
              title: 'Chăm sóc sức khỏe từ xa\nmọi lúc, mọi nơi',
              subtitle:
                  'Kết nối với bác sĩ, theo dõi sức khỏe\nvà cập nhật tình trạng nhanh chóng',
              step: 0,
              totalSteps: _totalSlides,
              onSkip: _skip,
              onNext: () => _goToPage(1),
              nextLabel: null, // slide 1 in wireframe has no CTA button
            ),
            _OnboardSlide(
              imagePath: 'assets/images/icons/health_icon_grid.jpg',
              title: 'Đa tiện ích\nchăm sóc sức khỏe',
              subtitle: 'Theo dõi, quản lý và cải thiện\nsức khỏe mỗi ngày',
              step: 1,
              totalSteps: _totalSlides,
              onSkip: _skip,
              onNext: () => _goToPage(2),
              nextLabel: 'Khám phá ngay',
            ),
            _OnboardSlide(
              imagePath: 'assets/images/mascot/mascot_bigphone.jpg',
              title: 'Chủ động theo dõi\nsức khỏe mỗi ngày',
              subtitle:
                  'Nhắc nhở thông minh, kết nối bác sĩ\nvà người thân luôn bên cạnh',
              step: 2,
              totalSteps: _totalSlides,
              onSkip: _skip,
              onNext: () => _goToPage(3),
              nextLabel: 'Khám phá ngay',
            ),
            _FinalSlide(
              onRegister: _goToRegister,
              onLogin: _goToLogin,
            ),
          ],
        ),
      ),
    );
  }
}

/// Slide dùng chung cho 3 màn onboarding đầu (có "Bỏ qua" + dots).
class _OnboardSlide extends StatelessWidget {
  final String imagePath;
  final String title;
  final String subtitle;
  final int step;
  final int totalSteps;
  final VoidCallback onSkip;
  final VoidCallback onNext;
  final String? nextLabel;

  const _OnboardSlide({
    required this.imagePath,
    required this.title,
    required this.subtitle,
    required this.step,
    required this.totalSteps,
    required this.onSkip,
    required this.onNext,
    required this.nextLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Align(
            alignment: Alignment.topRight,
            child: TextButton(
              onPressed: onSkip,
              child: const Text('Bỏ qua',
                  style: TextStyle(color: AppColors.textSecondary)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.primaryDark,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          Expanded(
            child: Center(
              child: Image.asset(
                imagePath,
                fit: BoxFit.contain,
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(totalSteps, (i) {
              final isCurrent = i == step;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                height: 6,
                width: isCurrent ? 20 : 6,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: isCurrent
                      ? AppColors.primary
                      : AppColors.primary.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
          if (nextLabel != null)
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: onNext,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.arrow_forward, size: 18),
                label: Text(nextLabel!,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            )
          else
            // Slide 1 trong wireframe không có nút — chạm để tiếp tục
            TextButton(
              onPressed: onNext,
              child: const Text('Tiếp tục →',
                  style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600)),
            ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

/// Slide cuối (wireframe screen 5): không có dots/Bỏ qua, có 2 CTA.
class _FinalSlide extends StatelessWidget {
  final VoidCallback onRegister;
  final VoidCallback onLogin;

  const _FinalSlide({required this.onRegister, required this.onLogin});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 40),
          const Text(
            'Chủ động theo dõi\nsức khỏe mỗi ngày',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.primaryDark,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Nhắc nhở thông minh, kết nối bác sĩ\nvà người thân luôn bên cạnh',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          Expanded(
            child: Center(
              child: Image.asset(
                'assets/images/mascot/mascot_notifications.jpg',
                fit: BoxFit.contain,
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: onRegister,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              icon: const Icon(Icons.arrow_forward, size: 18),
              label: const Text('Bắt đầu ngay',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: OutlinedButton(
              onPressed: onLogin,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Đăng nhập',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}