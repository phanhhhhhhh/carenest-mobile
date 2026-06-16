import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/phone_screen.dart';
import '../../features/auth/presentation/screens/otp_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../storage/secure_storage.dart';

final appRouter = GoRouter(
  initialLocation: '/phone',
  redirect: (context, state) async {
    final token = await SecureStorage.getToken();
    final isAuth = token != null;
    final isOnAuth =
        state.matchedLocation == '/phone' || state.matchedLocation == '/otp';

    if (isAuth && isOnAuth) return '/home';
    if (!isAuth && !isOnAuth) return '/phone';
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
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
  ],
);
