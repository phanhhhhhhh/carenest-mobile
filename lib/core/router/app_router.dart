import 'package:go_router/go_router.dart';
import '../auth/token_notifier.dart';
import '../navigation/elderly_shell.dart';
import '../navigation/family_shell.dart';
import '../storage/secure_storage.dart';
import '../../features/auth/presentation/screens/welcome_screen.dart';
import '../../features/auth/presentation/screens/phone_screen.dart';
import '../../features/auth/presentation/screens/otp_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_phone_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_otp_screen.dart';
import '../../features/auth/presentation/screens/new_password_screen.dart';
import '../../features/auth/presentation/screens/password_reset_success_screen.dart';
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

final appRouter = GoRouter(
  initialLocation: '/welcome',
  refreshListenable: TokenNotifier.instance,
  redirect: (context, state) async {
    final token = await SecureStorage.getToken();
    final isAuth = token != null;
    final loc = state.matchedLocation;

    final isOnAuth = loc == '/welcome' ||
        loc == '/phone' ||
        loc.startsWith('/otp') ||
        loc == '/register' ||
        loc.startsWith('/forgot-password') ||
        loc == '/new-password' ||
        loc == '/password-reset-success';

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

    // Auth
    GoRoute(
      path: '/phone',
      builder: (context, state) => const PhoneScreen(),
    ),
    GoRoute(
      path: '/otp',
      builder: (context, state) => OtpScreen(
        verificationId: state.extra as String,
      ),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => RegisterScreen(
        firebaseToken: state.extra as String,
      ),
    ),

    // Forgot Password flow
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordPhoneScreen(),
    ),
    GoRoute(
      path: '/forgot-password/otp',
      builder: (context, state) => ForgotPasswordOtpScreen(
        phone: state.extra as String,
      ),
    ),
    GoRoute(
      path: '/new-password',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>;
        return NewPasswordScreen(
          phone: extra['phone'] as String,
          otp: extra['otp'] as String,
        );
      },
    ),
    GoRoute(
      path: '/password-reset-success',
      builder: (context, state) => const PasswordResetSuccessScreen(),
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
