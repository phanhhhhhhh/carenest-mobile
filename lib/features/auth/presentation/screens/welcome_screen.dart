import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';

/// Full welcome flow: Splash → 3 Onboarding slides → Get Started
/// Matches the Miro design images exactly.
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
    return _OnboardingFlow();
  }
}

// ═══════════════════════════════════════════════════════════════════
// SPLASH SCREEN
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
      backgroundColor: AppColors.primary,
      body: Stack(
        children: [
          // Decorative circles
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 256,
              height: 256,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -64,
            left: -64,
            child: Container(
              width: 192,
              height: 192,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),

          // Center content
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Heart icon in white rounded square
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 20,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.favorite_rounded,
                    color: AppColors.primary,
                    size: 56,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'CareNest',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Yên tâm khi xa nhà',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),

          // Loading dots
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (i) {
                return Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// ONBOARDING FLOW (3 slides + Get Started)
// ═══════════════════════════════════════════════════════════════════
class _OnboardingFlow extends StatefulWidget {
  @override
  State<_OnboardingFlow> createState() => _OnboardingFlowState();
}

class _OnboardingFlowState extends State<_OnboardingFlow> {
  final _controller = PageController();
  int _currentPage = 0;
  static const _totalSlides = 3;

  static const _slides = [
    _SlideData(
      title: 'Chăm sóc sức khỏe\ntoàn diện',
      subtitle:
          'Theo dõi huyết áp, nhịp tim, đường huyết và nhiều chỉ số khác mỗi ngày.',
      emoji: '❤️',
      gradient: [AppColors.onboardSplashStart, AppColors.onboardSplashEnd],
    ),
    _SlideData(
      title: 'Nhắc thuốc\nthông minh',
      subtitle:
          'Không bao giờ quên lịch uống thuốc với hệ thống nhắc nhở theo toa.',
      emoji: '💊',
      gradient: [AppColors.secondary, Color(0xFF66BB6A)],
    ),
    _SlideData(
      title: 'Yên tâm khi\nxa nhà',
      subtitle:
          'Người thân có thể theo dõi sức khỏe từ xa, nhận cảnh báo khẩn cấp ngay lập tức.',
      emoji: '🏠',
      gradient: [Color(0xFFFFB300), Color(0xFFFF9800)],
    ),
  ];

  bool get _isLastSlide => _currentPage == _totalSlides - 1;

  void _nextPage() {
    if (_isLastSlide) {
      // Go to Get Started
      _controller.animateToPage(
        _totalSlides, // Get Started is at index 3
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      _controller.animateToPage(
        _currentPage + 1,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goToRegister() => context.go('/phone');

  void _goToLogin() {
    // Navigate to login / phone screen
    context.go('/phone');
  }

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
          onPageChanged: (page) => setState(() => _currentPage = page),
          children: [
            ..._slides.map((slide) => _buildOnboardingSlide(slide)),
            _buildGetStartedPage(),
          ],
        ),
      ),
    );
  }

  Widget _buildOnboardingSlide(_SlideData slide) {
    final isActive = _slides.indexOf(slide) == _currentPage;
    final step = _slides.indexOf(slide) + 1;

    return Column(
      children: [
        // Top gradient area (55%)
        Expanded(
          flex: 55,
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: slide.gradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Stack(
              children: [
                // Decorative overlay
                Positioned.fill(
                  child: Container(
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
                // Emoji centered
                Center(
                  child: Text(
                    slide.emoji,
                    style: const TextStyle(fontSize: 80),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Bottom content area (45%)
        Expanded(
          flex: 45,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),

                // Step indicator
                Row(
                  children: List.generate(_totalSlides, (i) {
                    final isCurrent = i == step - 1;
                    return Container(
                      height: 4,
                      margin: const EdgeInsets.only(right: 6),
                      width: isCurrent
                          ? 24
                          : i < step
                              ? 6
                              : 6,
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? AppColors.primary
                            : i < step
                                ? AppColors.primary.withValues(alpha: 0.3)
                                : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  slide.title,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 12),

                // Subtitle
                Text(
                  slide.subtitle,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),

                const Spacer(),

                // Action button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      _isLastSlide ? 'Bắt đầu' : 'Tiếp tục',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGetStartedPage() {
    return Column(
      children: [
        // Illustration area (50%)
        Expanded(
          flex: 50,
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.1),
                  Colors.white,
                  AppColors.secondary.withValues(alpha: 0.1),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Nest/heart illustration
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.favorite_rounded,
                        color: AppColors.primary,
                        size: 80,
                      ),
                    ),
                  ],
                ),
                // Decorative dots
                Positioned(
                  top: 60,
                  right: 90,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 80,
                  left: 90,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Content area (50%)
        Expanded(
          flex: 50,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                const Text(
                  'Sẵn sàng trải nghiệm?',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Đăng ký ngay để bắt đầu chăm sóc sức khỏe cho người thân yêu của bạn.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),

                const Spacer(),

                // Register button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _goToRegister,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Đăng ký miễn phí',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Login link
                Center(
                  child: TextButton(
                    onPressed: _goToLogin,
                    child: RichText(
                      text: const TextSpan(
                        style: TextStyle(fontSize: 13, color: AppColors.textHint),
                        children: [
                          TextSpan(text: 'Đã có tài khoản? '),
                          TextSpan(
                            text: 'Đăng nhập',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SlideData {
  final String title;
  final String subtitle;
  final String emoji;
  final List<Color> gradient;
  const _SlideData({
    required this.title,
    required this.subtitle,
    required this.emoji,
    required this.gradient,
  });
}
