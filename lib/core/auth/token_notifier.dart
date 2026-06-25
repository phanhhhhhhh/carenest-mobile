import 'package:flutter/foundation.dart';

class TokenNotifier extends ChangeNotifier {
  static final TokenNotifier instance = TokenNotifier._();
  TokenNotifier._();

  void onSessionExpired() {
    notifyListeners();
  }
}
