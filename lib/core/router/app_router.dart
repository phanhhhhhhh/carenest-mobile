import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../auth/token_notifier.dart';
import '../navigation/elderly_shell.dart';
import '../navigation/family_shell.dart';
import '../storage/secure_storage.dart';
import '../network/dio_client.dart';
import '../../features/auth/presentation/screens/welcome_screen.dart';
import '../../features/auth/presentation/screens/phone_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_phone_screen.dart';
import '../../features/auth/presentation/screens/new_password_screen.dart';
import '../../features/auth/presentation/screens/password_reset_success_screen.dart';
import '../../features/auth/presentation/screens/verify_email_prompt_screen.dart';
import '../../features/auth/presentation/screens/pin_setup_screen.dart';
import '../../features/auth/presentation/screens/pin_verify_screen.dart';
import '../../features/elderly/presentation/screens/health_report_screen.dart';
import '../../features/elderly/presentation/screens/elderly_home_screen.dart';
import '../../features/elderly/presentation/screens/elderly_medication_screen.dart';
import '../../features/elderly/presentation/screens/elderly_health_screen.dart';
import '../../features/elderly/presentation/screens/elderly_chat_screen.dart';
import '../../features/elderly/presentation/screens/elderly_profile_screen.dart';
import '../../features/family/presentation/screens/family_dashboard_screen.dart';
import '../../features/family/presentation/screens/family_medication_screen.dart';
import '../../features/family/presentation/screens/family_health_screen.dart';
import '../../features/family/presentation/screens/family_alerts_screen.dart';
import '../../features/family/presentation/screens/family_profile_screen.dart';
import '../../features/family/presentation/screens/family_appointments_screen.dart';
import '../../features/elderly/presentation/screens/elderly_edit_profile_screen.dart';
import '../../features/elderly/presentation/screens/elderly_emergency_contacts_screen.dart';
import '../../features/elderly/presentation/screens/elderly_medication_history_screen.dart';
import '../../features/elderly/presentation/screens/elderly_appointments_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/notifications/presentation/screens/notification_settings_screen.dart';
import '../../features/family/presentation/screens/premium_plans_screen.dart';
import '../../features/family/presentation/screens/weekly_summary_screen.dart';
import '../../features/family/presentation/screens/camera_screen.dart';
import '../../features/family/presentation/screens/health_threshold_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/welcome',
  refreshListenable: TokenNotifier.instance,
  redirect: (context, state) async {
    final token = await SecureStorage.getToken();
    final isAuth = token != null;
    final loc = state.matchedLocation;

    final isOnAuth = loc == '/welcome' ||
        loc == '/phone' ||
        loc == '/register' ||
        loc == '/register-dev' ||
        loc == '/forgot-password' ||
        loc == '/new-password' ||
        loc == '/password-reset-success' ||
        loc.startsWith('/verify-email-prompt');

    if (!isAuth && !isOnAuth) return '/welcome';

    if (isAuth && (isOnAuth || loc == '/home')) {
      final role = await SecureStorage.getRole();
      return role == 'ELDERLY' ? '/elderly/home' : '/family/dashboard';
    }

    return null;
  },
  routes: [
    // Welcome / Onboarding
    GoRoute(
      path: '/welcome',
      builder: (context, state) => const WelcomeScreen(),
    ),

    // Auth — Login (email+password)
    GoRoute(
      path: '/phone',
      builder: (context, state) => const PhoneScreen(),
    ),

    // Auth — Register
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),

    // Auth — Register (dev mode with firebaseToken)
    GoRoute(
      path: '/register-dev',
      builder: (context, state) {
        // TODO: Create a dev-specific register screen or reuse
        return const RegisterScreen();
      },
    ),

    // Email verification prompt (after registration)
    GoRoute(
      path: '/verify-email-prompt',
      builder: (context, state) {
        final email = state.extra as String? ?? '';
        return VerifyEmailPromptScreen(email: email);
      },
    ),

    // Email verification deep link (from email link)
    GoRoute(
      path: '/verify-email',
      builder: (context, state) {
        final token = state.uri.queryParameters['token'] ?? '';
        return _VerifyEmailScreen(token: token);
      },
    ),

    // Forgot Password (email-based)
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordPhoneScreen(),
    ),

    // Reset Password (token from email link)
    GoRoute(
      path: '/new-password',
      builder: (context, state) {
        final token = state.extra as String? ?? '';
        return NewPasswordScreen(token: token);
      },
    ),

    // Password reset success
    GoRoute(
      path: '/password-reset-success',
      builder: (context, state) => const PasswordResetSuccessScreen(),
    ),

    // PIN Setup
    GoRoute(
      path: '/pin-setup',
      builder: (context, state) => const PinSetupScreen(),
    ),

    // PIN Verify (app unlock)
    GoRoute(
      path: '/pin-verify',
      builder: (context, state) => const PinVerifyScreen(),
    ),

    // Health Report (30-day summary)
    GoRoute(
      path: '/health-report',
      builder: (context, state) => const HealthReportScreen(),
    ),

    GoRoute(path: '/home', redirect: (_, __) async {
      final role = await SecureStorage.getRole();
      return role == 'ELDERLY' ? '/elderly/home' : '/family/dashboard';
    }),

    // Profile & Settings (auth required)
    GoRoute(
      path: '/elderly/edit-profile',
      builder: (context, state) => const ElderlyEditProfileScreen(),
    ),
    GoRoute(
      path: '/elderly/emergency-contacts',
      builder: (context, state) => const ElderlyEmergencyContactsScreen(),
    ),

    // Medication history
    GoRoute(
      path: '/elderly/medication-history',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>;
        return ElderlyMedicationHistoryScreen(
          medicationId: extra['medicationId'] as String,
          medicationName: extra['medicationName'] as String,
        );
      },
    ),

    // Appointments
    GoRoute(
      path: '/elderly/appointments',
      builder: (context, state) => const ElderlyAppointmentsScreen(),
    ),
    GoRoute(
      path: '/family/appointments',
      builder: (context, state) => const FamilyAppointmentsScreen(),
    ),

    // Notifications (auth required)
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/notification-settings',
      builder: (context, state) => const NotificationSettingsScreen(),
    ),
    GoRoute(
      path: '/premium-plans',
      builder: (context, state) => const PremiumPlansScreen(),
    ),
    GoRoute(
      path: '/weekly-summary',
      builder: (context, state) => const WeeklySummaryScreen(),
    ),
    GoRoute(
      path: '/camera',
      builder: (context, state) => const CameraScreen(),
    ),
    GoRoute(
      path: '/health-thresholds',
      builder: (context, state) => const HealthThresholdScreen(),
    ),

    // Elderly shell
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => ElderlyShell(shell: shell),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/elderly/home',
            builder: (context, state) => const ElderlyHomeScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/elderly/medication',
            builder: (context, state) => const ElderlyMedicationScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/elderly/health',
            builder: (context, state) => const ElderlyHealthScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/elderly/chat',
            builder: (context, state) => const ElderlyChatScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/elderly/profile',
            builder: (context, state) => const ElderlyProfileScreen(),
          ),
        ]),
      ],
    ),

    // Family shell
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => FamilyShell(shell: shell),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/family/dashboard',
            builder: (context, state) => const FamilyDashboardScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/family/medication',
            builder: (context, state) => const FamilyMedicationScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/family/health',
            builder: (context, state) => const FamilyHealthScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/family/alerts',
            builder: (context, state) => const FamilyAlertsScreen(),
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/family/profile',
            builder: (context, state) => const FamilyProfileScreen(),
          ),
        ]),
      ],
    ),
  ],
);

// ────────────────────────────────────────────────────────────────────────────
// Auto-verification screen for email deep link
// ────────────────────────────────────────────────────────────────────────────

class _VerifyEmailScreen extends StatefulWidget {
  final String token;
  const _VerifyEmailScreen({required this.token});

  @override
  State<_VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<_VerifyEmailScreen> {
  bool _loading = true;
  String? _error;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    _verify();
  }

  Future<void> _verify() async {
    try {
      final dio = DioClient.create();
      await dio.post('/auth/verify-email', data: {'token': widget.token});
      setState(() {
        _loading = false;
        _success = true;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e is DioException
            ? ((e.response?.data is Map
                    ? ((e.response!.data['error'] ?? e.response!.data['message'])?.toString())
                    : null) ??
                'Invalid or expired verification link')
            : 'Verification failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_loading) ...[
                  const CircularProgressIndicator(),
                  const SizedBox(height: 24),
                  const Text('Verifying your email...',
                      style: TextStyle(fontSize: 16, color: Color(0xFF666666))),
                ] else if (_success) ...[
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFF4CAF50).withAlpha(25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle,
                        color: Color(0xFF4CAF50), size: 48),
                  ),
                  const SizedBox(height: 24),
                  const Text('Email Verified!',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold,
                          color: Color(0xFF333333))),
                  const SizedBox(height: 12),
                  const Text('Your account is now active.',
                      style: TextStyle(fontSize: 14, color: Color(0xFF666666))),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity, height: 52,
                    child: ElevatedButton(
                      onPressed: () => context.go('/phone'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4CAF50),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Go to Sign In',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ] else ...[
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE53935).withAlpha(25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.error_outline,
                        color: Color(0xFFE53935), size: 48),
                  ),
                  const SizedBox(height: 24),
                  Text(_error ?? 'Verification failed',
                      style: const TextStyle(fontSize: 14, color: Color(0xFFE53935)),
                      textAlign: TextAlign.center),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity, height: 52,
                    child: ElevatedButton(
                      onPressed: () => context.go('/phone'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4CAF50),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Go to Sign In',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
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
