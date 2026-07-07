import 'package:dio/dio.dart';
import '../../../core/storage/secure_storage.dart';

class UserNotFoundException implements Exception {}

class EmailNotVerifiedException implements Exception {
  final String email;
  const EmailNotVerifiedException(this.email);
}

sealed class RegisterResult {
  const RegisterResult();
}

class RegisterAutoLoggedIn extends RegisterResult {
  const RegisterAutoLoggedIn();
}

class RegisterNeedsVerification extends RegisterResult {
  final String contact;
  final String? message;
  const RegisterNeedsVerification(this.contact, this.message);
}

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  // ═══════════════════════════════════════════════════════════════
  // Register & Login
  // ═══════════════════════════════════════════════════════════════

  /// POST /api/auth/register.
  ///
  /// - With email: backend returns `{message: "check your email"}` — NO JWT.
  ///   User must verify email before login. Returns [RegisterResult.needsVerification].
  /// - Without email (phone only): auto-verified, backend returns JWT.
  ///   Returns [RegisterResult.autoLoggedIn].
  Future<RegisterResult> register({
    String? email,
    required String password,
    required String confirmPassword,
    required String name,
    required String role,
    String? phone,
    String? dob,
  }) async {
    final body = <String, dynamic>{
      'password': password,
      'confirmPassword': confirmPassword,
      'name': name,
      'role': role,
    };
    if (email != null && email.isNotEmpty) body['email'] = email;
    if (phone != null && phone.isNotEmpty) body['phone'] = phone;
    if (dob != null) body['dob'] = dob;

    final response = await _dio.post('/auth/register', data: body);
    final data = response.data as Map<String, dynamic>;

    // If response has accessToken → phone-only registration, auto-logged-in
    if (data.containsKey('accessToken')) {
      await persistAuth(data);
      return const RegisterAutoLoggedIn();
    }

    // Email-based registration → must verify email
    return RegisterNeedsVerification(
      email ?? phone ?? '',
      data['message'] as String?,
    );
  }

  /// POST /api/auth/login.
  ///
  /// Supports 3 methods (priority: phone > email > firebaseToken):
  /// 1. Phone + password (no email required)
  /// 2. Email + password
  /// 3. Firebase OTP token (legacy)
  Future<bool> login({
    String? email,
    String? phone,
    String? password,
    String? firebaseToken,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (phone != null && phone.isNotEmpty) body['phone'] = phone;
      if (email != null && email.isNotEmpty) body['email'] = email;
      if (password != null) body['password'] = password;
      if (firebaseToken != null) body['firebaseToken'] = firebaseToken;

      final response = await _dio.post('/auth/login', data: body);
      await persistAuth(response.data as Map<String, dynamic>);
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw UserNotFoundException();
      }
      if (e.response?.statusCode == 403) {
        final msg = e.response?.data['message'] as String? ?? '';
        if (msg.contains('verify')) {
          final emailAddr = e.response?.data['email'] as String? ?? email ?? '';
          throw EmailNotVerifiedException(emailAddr);
        }
      }
      rethrow;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Email Verification
  // ═══════════════════════════════════════════════════════════════

  /// POST /api/auth/verify-email
  Future<void> verifyEmail(String token) async {
    await _dio.post('/auth/verify-email', data: {'token': token});
  }

  /// POST /api/auth/resend-verification
  Future<void> resendVerification(String email) async {
    await _dio.post('/auth/resend-verification', data: {'email': email});
  }

  // ═══════════════════════════════════════════════════════════════
  // Password Management
  // ═══════════════════════════════════════════════════════════════

  /// POST /api/auth/change-password (authenticated)
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    await _dio.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
      'confirmPassword': confirmPassword,
    });
  }

  /// POST /api/auth/forgot-password — email-based.
  Future<void> forgotPassword(String email) async {
    await _dio.post('/auth/forgot-password', data: {'email': email});
  }

  /// POST /api/auth/reset-password — token-based.
  Future<void> resetPassword({
    required String token,
    required String newPassword,
    required String confirmPassword,
  }) async {
    await _dio.post('/auth/reset-password', data: {
      'token': token,
      'newPassword': newPassword,
      'confirmPassword': confirmPassword,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PIN Management
  // ═══════════════════════════════════════════════════════════════

  /// POST /api/auth/setup-pin
  Future<void> setupPin(String pin, String confirmPin) async {
    await _dio.post('/auth/setup-pin', data: {
      'pin': pin,
      'confirmPin': confirmPin,
    });
  }

  /// POST /api/auth/verify-pin
  Future<bool> verifyPin(String pin) async {
    final response = await _dio.post('/auth/verify-pin', data: {'pin': pin});
    return response.data['valid'] == true;
  }

  // ═══════════════════════════════════════════════════════════════
  // Session
  // ═══════════════════════════════════════════════════════════════

  /// POST /api/auth/refresh
  Future<void> refreshToken(String refreshToken) async {
    final response = await _dio.post('/auth/refresh', data: {
      'refreshToken': refreshToken,
    });
    await SecureStorage.saveToken(
        response.data['accessToken'] as String);
    final newRefresh = response.data['refreshToken'] as String?;
    if (newRefresh != null) {
      await SecureStorage.saveRefreshToken(newRefresh);
    }
  }

  /// POST /api/auth/logout
  Future<void> signOut() async {
    try {
      await _dio.post('/auth/logout');
    } on DioException {
      // ignore — still clear local storage
    }
    await SecureStorage.clearAll();
  }

  // ═══════════════════════════════════════════════════════════════
  // Legacy: Firebase Phone OTP (kept for backward compatibility)
  // ═══════════════════════════════════════════════════════════════

  /// Dev mode login: bypass OTP, POST /api/auth/login with firebaseToken.
  Future<bool> loginDev(String phoneNumber) async {
    return login(firebaseToken: 'DEV_PHONE:$phoneNumber');
  }

  // ═══════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════

  Future<void> persistAuth(Map<String, dynamic> data) async {
    await SecureStorage.saveToken(data['accessToken'] as String);
    final refreshToken = data['refreshToken'] as String?;
    if (refreshToken != null) {
      await SecureStorage.saveRefreshToken(refreshToken);
    }
    final user = data['user'] as Map<String, dynamic>?;
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
  }
}
