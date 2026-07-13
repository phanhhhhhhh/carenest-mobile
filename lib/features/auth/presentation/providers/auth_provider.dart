import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/auth_repository.dart';
import '../../../../core/network/dio_client.dart';

/// Dio instance for the entire app lifecycle.
///
/// Uses a plain [Provider] (keepAlive by default) — NOT autoDispose —
/// because [DioClient.create] sets up interceptors with refresh-token
/// mutex state that must survive widget rebuilds. Recreating the Dio
/// would reset the mutex and lose in-flight request deduplication.
final dioProvider = Provider<Dio>((ref) => DioClient.create());

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// Login (email + password)
// ═══════════════════════════════════════════════════════════════════

class LoginState {
  final bool isLoading;
  final String? error;
  final bool success;
  final bool needsVerification;
  final String? unverifiedEmail;

  const LoginState({
    this.isLoading = false,
    this.error,
    this.success = false,
    this.needsVerification = false,
    this.unverifiedEmail,
  });

  LoginState copyWith({
    bool? isLoading,
    String? error,
    bool? success,
    bool? needsVerification,
    String? unverifiedEmail,
  }) =>
      LoginState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
        needsVerification: needsVerification ?? this.needsVerification,
        unverifiedEmail: unverifiedEmail,
      );
}

class LoginNotifier extends StateNotifier<LoginState> {
  final AuthRepository _repo;

  LoginNotifier(this._repo) : super(const LoginState());

  /// Login with email+password or phone+password.
  Future<void> login({
    String? email,
    String? phone,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.login(email: email, phone: phone, password: password);
      state = state.copyWith(isLoading: false, success: true);
    } on UserNotFoundException {
      state = state.copyWith(
        isLoading: false,
        error: 'No account found. Please register first.',
      );
    } on EmailNotVerifiedException catch (e) {
      state = state.copyWith(
        isLoading: false,
        needsVerification: true,
        unverifiedEmail: e.email,
      );
    } on DioException catch (e) {
      final msg = _extractError(e, 'Invalid credentials');
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Connection error');
    }
  }

  /// Dev mode: bypass real auth (kept for development).
  Future<void> loginDev(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.loginDev(phoneNumber);
      state = state.copyWith(isLoading: false, success: true);
    } on UserNotFoundException {
      state = state.copyWith(
        isLoading: false,
        error: 'DEV_NEEDS_REGISTER:$phoneNumber',
      );
    } catch (e) {
      state = state.copyWith(
          isLoading: false, error: 'Cannot connect to backend');
    }
  }
}

final loginProvider =
    StateNotifierProvider.autoDispose<LoginNotifier, LoginState>(
  (ref) => LoginNotifier(ref.watch(authRepositoryProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// Register
// ═══════════════════════════════════════════════════════════════════

class RegisterState {
  final bool isLoading;
  final String? error;
  final bool success;
  final bool needsEmailVerification;
  final String? verificationContact;

  const RegisterState({
    this.isLoading = false,
    this.error,
    this.success = false,
    this.needsEmailVerification = false,
    this.verificationContact,
  });

  RegisterState copyWith({
    bool? isLoading,
    String? error,
    bool? success,
    bool? needsEmailVerification,
    String? verificationContact,
  }) =>
      RegisterState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
        needsEmailVerification:
            needsEmailVerification ?? this.needsEmailVerification,
        verificationContact: verificationContact,
      );
}

class RegisterNotifier extends StateNotifier<RegisterState> {
  final AuthRepository _repo;

  RegisterNotifier(this._repo) : super(const RegisterState());

  Future<void> register({
    String? email,
    required String password,
    required String confirmPassword,
    required String name,
    required String role,
    String? phone,
    String? dob,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.register(
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        name: name,
        role: role,
        phone: phone,
        dob: dob,
      );

      if (result is RegisterAutoLoggedIn) {
        state = state.copyWith(isLoading: false, success: true);
      } else if (result is RegisterNeedsVerification) {
        state = state.copyWith(
          isLoading: false,
          needsEmailVerification: true,
          verificationContact: result.contact,
        );
      }
    } on DioException catch (e) {
      final msg = _extractError(e, 'Registration failed');
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Registration failed, try again');
    }
  }

}

final registerProvider =
    StateNotifierProvider.autoDispose<RegisterNotifier, RegisterState>(
  (ref) => RegisterNotifier(ref.watch(authRepositoryProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// Email Verification
// ═══════════════════════════════════════════════════════════════════

class VerifyEmailState {
  final bool isLoading;
  final String? error;
  final bool success;
  final String? message;

  const VerifyEmailState({
    this.isLoading = false,
    this.error,
    this.success = false,
    this.message,
  });

  VerifyEmailState copyWith({
    bool? isLoading,
    String? error,
    bool? success,
    String? message,
  }) =>
      VerifyEmailState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
        message: message,
      );
}

class VerifyEmailNotifier extends StateNotifier<VerifyEmailState> {
  final AuthRepository _repo;

  VerifyEmailNotifier(this._repo) : super(const VerifyEmailState());

  Future<void> verify(String token) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.verifyEmail(token);
      state = state.copyWith(
        isLoading: false,
        success: true,
        message: 'Email verified successfully! You can now log in.',
      );
    } on DioException catch (e) {
      final msg = _extractError(e, 'Invalid or expired token');
      state = state.copyWith(isLoading: false, error: msg);
    }
  }

  Future<void> resend(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.resendVerification(email);
      state = state.copyWith(
        isLoading: false,
        success: true,
        message: 'Verification email sent. Check your inbox.',
      );
    } on DioException catch (e) {
      final msg = _extractError(e, 'Could not resend verification email');
      state = state.copyWith(isLoading: false, error: msg);
    }
  }
}

final verifyEmailProvider =
    StateNotifierProvider.autoDispose<VerifyEmailNotifier, VerifyEmailState>(
  (ref) => VerifyEmailNotifier(ref.watch(authRepositoryProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// Forgot Password (email-based)
// ═══════════════════════════════════════════════════════════════════

class ForgotPasswordState {
  final bool isLoading;
  final String? error;
  final bool emailSent;

  const ForgotPasswordState({
    this.isLoading = false,
    this.error,
    this.emailSent = false,
  });

  ForgotPasswordState copyWith({
    bool? isLoading,
    String? error,
    bool? emailSent,
  }) =>
      ForgotPasswordState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        emailSent: emailSent ?? this.emailSent,
      );
}

class ForgotPasswordNotifier extends StateNotifier<ForgotPasswordState> {
  final AuthRepository _repo;

  ForgotPasswordNotifier(this._repo) : super(const ForgotPasswordState());

  Future<void> sendResetEmail(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.forgotPassword(email);
      state = state.copyWith(
        isLoading: false,
        emailSent: true,
        error: null,
      );
    } on DioException catch (e) {
      final msg = _extractError(e, 'Could not send reset email');
      state = state.copyWith(isLoading: false, error: msg);
    }
  }
}

final forgotPasswordProvider =
    StateNotifierProvider.autoDispose<ForgotPasswordNotifier, ForgotPasswordState>(
  (ref) => ForgotPasswordNotifier(ref.watch(authRepositoryProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// Reset Password (token-based)
// ═══════════════════════════════════════════════════════════════════

class ResetPasswordState {
  final bool isLoading;
  final String? error;
  final bool success;

  const ResetPasswordState({
    this.isLoading = false,
    this.error,
    this.success = false,
  });

  ResetPasswordState copyWith({bool? isLoading, String? error, bool? success}) =>
      ResetPasswordState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
      );
}

class ResetPasswordNotifier extends StateNotifier<ResetPasswordState> {
  final AuthRepository _repo;

  ResetPasswordNotifier(this._repo) : super(const ResetPasswordState());

  Future<void> reset({
    required String token,
    required String newPassword,
    required String confirmPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.resetPassword(
        token: token,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      state = state.copyWith(isLoading: false, success: true);
    } on DioException catch (e) {
      final msg = _extractError(e, 'Cannot reset password');
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Connection error');
    }
  }
}

final resetPasswordProvider =
    StateNotifierProvider.autoDispose<ResetPasswordNotifier, ResetPasswordState>(
  (ref) => ResetPasswordNotifier(ref.watch(authRepositoryProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// Change Password (authenticated)
// ═══════════════════════════════════════════════════════════════════

class ChangePasswordState {
  final bool isLoading;
  final String? error;
  final bool success;

  const ChangePasswordState({
    this.isLoading = false,
    this.error,
    this.success = false,
  });

  ChangePasswordState copyWith({
    bool? isLoading,
    String? error,
    bool? success,
  }) =>
      ChangePasswordState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
      );
}

class ChangePasswordNotifier extends StateNotifier<ChangePasswordState> {
  final AuthRepository _repo;

  ChangePasswordNotifier(this._repo) : super(const ChangePasswordState());

  Future<void> change({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      state = state.copyWith(isLoading: false, success: true);
    } on DioException catch (e) {
      final msg = _extractError(e, 'Cannot change password');
      state = state.copyWith(isLoading: false, error: msg);
    }
  }
}

final changePasswordProvider =
    StateNotifierProvider.autoDispose<ChangePasswordNotifier, ChangePasswordState>(
  (ref) => ChangePasswordNotifier(ref.watch(authRepositoryProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// PIN Setup & Verify
// ═══════════════════════════════════════════════════════════════════

class PinState {
  final bool isLoading;
  final String? error;
  final bool success;
  final bool verified;

  const PinState({
    this.isLoading = false,
    this.error,
    this.success = false,
    this.verified = false,
  });

  PinState copyWith({
    bool? isLoading,
    String? error,
    bool? success,
    bool? verified,
  }) =>
      PinState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
        verified: verified ?? this.verified,
      );
}

class PinNotifier extends StateNotifier<PinState> {
  final AuthRepository _repo;

  PinNotifier(this._repo) : super(const PinState());

  Future<void> setupPin(String pin, String confirmPin) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.setupPin(pin, confirmPin);
      state = state.copyWith(isLoading: false, success: true);
    } on DioException catch (e) {
      final msg = _extractError(e, 'Cannot set up PIN');
      state = state.copyWith(isLoading: false, error: msg);
    }
  }

  Future<void> verifyPin(String pin) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final valid = await _repo.verifyPin(pin);
      state = state.copyWith(isLoading: false, verified: valid);
      if (!valid) {
        state = state.copyWith(error: 'Incorrect PIN');
      }
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Cannot verify PIN');
    }
  }
}

final pinProvider =
    StateNotifierProvider.autoDispose<PinNotifier, PinState>(
  (ref) => PinNotifier(ref.watch(authRepositoryProvider)),
);

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/// Extract error text from a DioException response body.
///
/// Backend returns `{"error": "...", "status": N}` on validation/auth failures
/// and `{"message": "...", "status": N}` on success/redirect responses.
/// We check both so we never fall back to a generic message.
String _extractError(DioException e, String fallback) {
  final data = e.response?.data;
  if (data is Map) {
    return (data['error'] ?? data['message'] ?? fallback).toString();
  }
  if (data is String) return data;
  return fallback;
}
