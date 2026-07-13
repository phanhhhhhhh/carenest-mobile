import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../storage/secure_storage.dart';
import '../auth/token_notifier.dart';

class DioClient {
  static String get _baseUrl {
    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) return envUrl;
    return kIsWeb
        ? 'http://localhost:8080/api'
        : 'http://10.0.2.2:8080/api';
  }

  static const _retryHeader = 'x-retry-after-refresh';
  static const _proactiveRefreshWindowSeconds = 60;

  /// Mutex to prevent concurrent refresh attempts.
  static Future<String?>? _pendingRefresh;

  static Dio create() {
    final dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final isRefreshPath = options.path.contains('/auth/refresh');

        // Skip proactive refresh for auth endpoints (no token yet / refresh itself)
        if (!isRefreshPath) {
          final currentToken = await SecureStorage.getToken();
          if (currentToken != null && _jwtExpiresSoon(currentToken)) {
            // Proactively refresh before this request goes out
            _pendingRefresh ??= _doRefresh();
            final newAccess = await _pendingRefresh;
            _pendingRefresh = null;
            if (newAccess != null) {
              options.headers['Authorization'] = 'Bearer $newAccess';
              return handler.next(options);
            }
            // Refresh failed — let the request go with the old token;
            // the 401 interceptor will handle the fallback.
          }
        }

        // Attach current access token (may have just been refreshed above)
        final token = await SecureStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final response = error.response;
        final request = error.requestOptions;

        final is401 = response?.statusCode == 401;
        final isRefreshPath = request.path.contains('/auth/refresh');
        final isRetry = request.headers.containsKey(_retryHeader);

        if (is401 && !isRefreshPath && !isRetry) {
          try {
            // Deduplicate concurrent refresh attempts
            _pendingRefresh ??= _doRefresh();
            final newAccess = await _pendingRefresh;
            _pendingRefresh = null;

            if (newAccess == null) {
              await _logout();
              return handler.next(error);
            }

            request.headers[_retryHeader] = 'true';
            final retryResponse = await dio.fetch(request);
            return handler.resolve(retryResponse);
          } catch (_) {
            _pendingRefresh = null;
            await _logout();
            return handler.next(error);
          }
        }

        handler.next(error);
      },
    ));

    return dio;
  }

  /// Decode the JWT payload and check if [exp] is within
  /// [_proactiveRefreshWindowSeconds] of now.
  static bool _jwtExpiresSoon(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return false;

      // Pad base64url to standard base64, then decode
      final payload = parts[1];
      final normalized = base64.normalize(payload);
      final decoded = utf8.decode(base64.decode(normalized));
      final json = jsonDecode(decoded) as Map<String, dynamic>;

      final exp = json['exp'];
      if (exp is! int) return false;

      final expiresAt = DateTime.fromMillisecondsSinceEpoch(exp * 1000, isUtc: true);
      final remaining = expiresAt.difference(DateTime.now().toUtc());
      return remaining.inSeconds < _proactiveRefreshWindowSeconds;
    } catch (_) {
      // Malformed token — let it through, the 401 interceptor will handle it
      return false;
    }
  }

  /// Refresh the access token. Returns the new access token or null on failure.
  static Future<String?> _doRefresh() async {
    final refreshToken = await SecureStorage.getRefreshToken();
    if (refreshToken == null) return null;

    final refreshDio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));
    final refreshRes = await refreshDio.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );

    final newAccess = refreshRes.data['accessToken'] as String;
    final newRefresh = refreshRes.data['refreshToken'] as String;
    await SecureStorage.saveToken(newAccess);
    await SecureStorage.saveRefreshToken(newRefresh);

    // Also refresh user data on token refresh
    final user = refreshRes.data['user'] as Map<String, dynamic>?;
    if (user != null) {
      final role = user['role'] as String?;
      if (role != null) await SecureStorage.saveRole(role);
      final name = user['name'] as String?;
      if (name != null) await SecureStorage.saveName(name);
      final id = user['id'];
      if (id != null) await SecureStorage.saveUserId(id.toString());
      final phone = user['phone'] as String?;
      if (phone != null) await SecureStorage.savePhone(phone);
      final email = user['email'] as String?;
      if (email != null) await SecureStorage.saveEmail(email);
    }

    return newAccess;
  }

  static Future<void> _logout() async {
    await SecureStorage.clearAll();
    TokenNotifier.instance.onSessionExpired();
  }
}
