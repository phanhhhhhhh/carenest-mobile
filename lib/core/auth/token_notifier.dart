import 'package:flutter/foundation.dart';

/// Notifies GoRouter of session expiry so it can redirect to /welcome.
///
/// ## Why a singleton instead of Riverpod?
///
/// This class is used as [GoRouter.refreshListenable] — the router needs a
/// [Listenable] that is available **before** Riverpod's [ProviderScope] is
/// initialized in `main()`. At that point, the widget tree (and therefore
/// `ref`) does not exist yet, so a Riverpod-based notifier cannot be used.
///
/// The singleton pattern ensures:
/// 1. A single source of truth for session-state change notifications.
/// 2. Availability at app startup, before the Riverpod container is ready.
/// 3. Zero dependencies — no risk of circular imports with providers.
///
/// If this ever needs to be testable or mockable, wrap it behind an
/// abstract interface and use a service locator instead.
class TokenNotifier extends ChangeNotifier {
  static final TokenNotifier instance = TokenNotifier._();
  TokenNotifier._();

  /// Call when the session expires (logout, token refresh failure, etc.).
  /// GoRouter's redirect guard will pick this up and navigate to /welcome.
  void onSessionExpired() {
    notifyListeners();
  }
}
