import 'package:go_router/go_router.dart';
import '../auth/token_notifier.dart';
import '../navigation/elderly_shell.dart';
import '../navigation/family_shell.dart';
import '../storage/secure_storage.dart';
import '../../features/auth/presentation/screens/phone_screen.dart';
import '../../features/auth/presentation/screens/otp_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
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

final appRouter = GoRouter(
  initialLocation: '/phone',
  refreshListenable: TokenNotifier.instance,
  redirect: (context, state) async {
    final token = await SecureStorage.getToken();
    final isAuth = token != null;
    final loc = state.matchedLocation;

    final isOnAuth = loc == '/phone' ||
        loc.startsWith('/otp') ||
        loc == '/register';

    if (!isAuth && !isOnAuth) return '/phone';

    if (isAuth && (isOnAuth || loc == '/home')) {
      final role = await SecureStorage.getRole();
      return role == 'ELDERLY' ? '/elderly/home' : '/family/dashboard';
    }

    return null;
  },
  routes: [
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
    GoRoute(path: '/home', redirect: (_, __) async {
      final role = await SecureStorage.getRole();
      return role == 'ELDERLY' ? '/elderly/home' : '/family/dashboard';
    }),

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
