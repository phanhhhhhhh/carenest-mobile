import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../storage/secure_storage.dart';
import '../auth/token_notifier.dart';

class DioClient {
  static String get _baseUrl => kIsWeb
      ? 'http://localhost:8080/api'
      : 'http://10.0.2.2:8080/api';

  // Marks a request as already retried once after a token refresh.
  // Prevents the error interceptor from entering the refresh loop again.
  static const _retryHeader = 'x-retry-after-refresh';

  static Dio create() {
    final dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
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
            final refreshToken = await SecureStorage.getRefreshToken();
            if (refreshToken == null) {
              await _logout();
              return handler.next(error);
            }

            // Use a fresh Dio without interceptors to avoid re-entering this handler.
            final refreshDio = Dio(BaseOptions(baseUrl: _baseUrl));
            final refreshRes = await refreshDio.post(
              '/auth/refresh',
              data: {'refreshToken': refreshToken},
            );

            final newAccess = refreshRes.data['accessToken'] as String;
            final newRefresh = refreshRes.data['refreshToken'] as String;
            await SecureStorage.saveToken(newAccess);
            await SecureStorage.saveRefreshToken(newRefresh);

            // Retry the original request. The onRequest interceptor will inject
            // the new token. _retryHeader prevents a second refresh attempt.
            request.headers[_retryHeader] = 'true';
            final retryResponse = await dio.fetch(request);
            return handler.resolve(retryResponse);
          } catch (_) {
            await _logout();
            return handler.next(error);
          }
        }

        handler.next(error);
      },
    ));

    return dio;
  }

  static Future<void> _logout() async {
    await SecureStorage.clearAll();
    TokenNotifier.instance.onSessionExpired();
  }
}
