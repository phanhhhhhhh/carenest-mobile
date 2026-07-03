import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/auth_repository.dart';
import '../../../../core/network/dio_client.dart';

final dioProvider = Provider<Dio>((ref) => DioClient.create());

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioProvider)),
);



class PhoneState {
  final bool isLoading;
  final String? error;
  final String? verificationId;

  const PhoneState({this.isLoading = false, this.error, this.verificationId});

  PhoneState copyWith({bool? isLoading, String? error, String? verificationId}) =>
      PhoneState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        verificationId: verificationId ?? this.verificationId,
      );
}

class PhoneNotifier extends StateNotifier<PhoneState> {
  final AuthRepository _repo;

  PhoneNotifier(this._repo) : super(const PhoneState());

  Future<void> sendOtp(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    await _repo.sendOtp(
      phoneNumber: phoneNumber,
      onCodeSent: (id) => state = state.copyWith(isLoading: false, verificationId: id),
      onError: (e) => state = state.copyWith(isLoading: false, error: e),
    );
  }

  Future<void> loginDev(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.loginDev(phoneNumber);
      state = state.copyWith(isLoading: false, verificationId: '__dev_done__');
    } on UserNotFoundException {
      state = state.copyWith(
        isLoading: false,
        verificationId: '__dev_register__:$phoneNumber',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Không thể kết nối backend');
    }
  }
}

final phoneProvider = StateNotifierProvider.autoDispose<PhoneNotifier, PhoneState>(
  (ref) => PhoneNotifier(ref.watch(authRepositoryProvider)),
);



sealed class OtpResult {
  const OtpResult();
}

class OtpSuccess extends OtpResult {
  const OtpSuccess();
}

class OtpNeedsRegister extends OtpResult {
  final String firebaseToken;
  const OtpNeedsRegister(this.firebaseToken);
}

class OtpState {
  final bool isLoading;
  final String? error;
  final OtpResult? result;

  const OtpState({this.isLoading = false, this.error, this.result});

  OtpState copyWith({bool? isLoading, String? error, OtpResult? result}) => OtpState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        result: result ?? this.result,
      );
}

class OtpNotifier extends StateNotifier<OtpState> {
  final AuthRepository _repo;
  final String verificationId;

  OtpNotifier(this._repo, this.verificationId) : super(const OtpState());

  Future<void> verifyOtp(String smsCode) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final firebaseToken = await _repo.verifyOtp(
        verificationId: verificationId,
        smsCode: smsCode,
      );
      try {
        await _repo.login(firebaseToken);
        state = state.copyWith(isLoading: false, result: const OtpSuccess());
      } on UserNotFoundException {
        state = state.copyWith(
          isLoading: false,
          result: OtpNeedsRegister(firebaseToken),
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Mã OTP không đúng');
    }
  }
}

final otpProvider =
    StateNotifierProvider.autoDispose.family<OtpNotifier, OtpState, String>(
  (ref, verificationId) =>
      OtpNotifier(ref.watch(authRepositoryProvider), verificationId),
);



class RegisterState {
  final bool isLoading;
  final String? error;
  final bool success;

  const RegisterState({this.isLoading = false, this.error, this.success = false});

  RegisterState copyWith({bool? isLoading, String? error, bool? success}) =>
      RegisterState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
      );
}

class RegisterNotifier extends StateNotifier<RegisterState> {
  final AuthRepository _repo;
  final String firebaseToken;

  RegisterNotifier(this._repo, this.firebaseToken) : super(const RegisterState());

  Future<void> register({
    required String name,
    required String role,
    String? email,
    String? password,
    String? dob,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.register(
        firebaseToken: firebaseToken,
        name: name,
        role: role,
        email: email,
        password: password,
        dob: dob,
      );
      state = state.copyWith(isLoading: false, success: true);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Đăng ký thất bại, thử lại');
    }
  }
}

final registerProvider =
    StateNotifierProvider.autoDispose.family<RegisterNotifier, RegisterState, String>(
  (ref, firebaseToken) =>
      RegisterNotifier(ref.watch(authRepositoryProvider), firebaseToken),
);

// ── Forgot Password providers ──────────────────────────────────────

class ForgotPasswordPhoneState {
  final bool isLoading;
  final String? error;
  final bool success;
  const ForgotPasswordPhoneState({this.isLoading = false, this.error, this.success = false});
  ForgotPasswordPhoneState copyWith({bool? isLoading, String? error, bool? success}) =>
      ForgotPasswordPhoneState(isLoading: isLoading ?? this.isLoading, error: error, success: success ?? this.success);
}

class ForgotPasswordPhoneNotifier extends StateNotifier<ForgotPasswordPhoneState> {
  final AuthRepository _repo;
  ForgotPasswordPhoneNotifier(this._repo) : super(const ForgotPasswordPhoneState());

  Future<void> sendOtp(String phone) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.forgotPassword(phone);
      state = state.copyWith(isLoading: false, success: true);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response?.data['message'] ?? 'Không thể gửi OTP')
          : 'Không thể gửi OTP';
      state = state.copyWith(isLoading: false, error: msg.toString());
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Lỗi kết nối');
    }
  }
}

final forgotPasswordPhoneProvider =
    StateNotifierProvider.autoDispose<ForgotPasswordPhoneNotifier, ForgotPasswordPhoneState>(
  (ref) => ForgotPasswordPhoneNotifier(ref.watch(authRepositoryProvider)),
);

class ForgotPasswordOtpState {
  final bool isLoading;
  final String? error;
  final bool success;
  const ForgotPasswordOtpState({this.isLoading = false, this.error, this.success = false});
  ForgotPasswordOtpState copyWith({bool? isLoading, String? error, bool? success}) =>
      ForgotPasswordOtpState(isLoading: isLoading ?? this.isLoading, error: error, success: success ?? this.success);
}

class ForgotPasswordOtpNotifier extends StateNotifier<ForgotPasswordOtpState> {
  final AuthRepository _repo;
  ForgotPasswordOtpNotifier(this._repo) : super(const ForgotPasswordOtpState());

  Future<void> verifyOtp(String phone, String otp) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.verifyResetOtp(phone, otp);
      state = state.copyWith(isLoading: false, success: true);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response?.data['message'] ?? 'Mã OTP không đúng')
          : 'Mã OTP không đúng';
      state = state.copyWith(isLoading: false, error: msg.toString());
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Lỗi kết nối');
    }
  }
}

final forgotPasswordOtpProvider =
    StateNotifierProvider.autoDispose<ForgotPasswordOtpNotifier, ForgotPasswordOtpState>(
  (ref) => ForgotPasswordOtpNotifier(ref.watch(authRepositoryProvider)),
);

class ResetPasswordState {
  final bool isLoading;
  final String? error;
  final bool success;
  const ResetPasswordState({this.isLoading = false, this.error, this.success = false});
  ResetPasswordState copyWith({bool? isLoading, String? error, bool? success}) =>
      ResetPasswordState(isLoading: isLoading ?? this.isLoading, error: error, success: success ?? this.success);
}

class ResetPasswordNotifier extends StateNotifier<ResetPasswordState> {
  final AuthRepository _repo;
  ResetPasswordNotifier(this._repo) : super(const ResetPasswordState());

  Future<void> reset(String phone, String otp, String newPassword) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.resetPassword(phone, otp, newPassword);
      state = state.copyWith(isLoading: false, success: true);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response?.data['message'] ?? 'Không thể đặt lại mật khẩu')
          : 'Không thể đặt lại mật khẩu';
      state = state.copyWith(isLoading: false, error: msg.toString());
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Lỗi kết nối');
    }
  }
}

final resetPasswordProvider =
    StateNotifierProvider.autoDispose<ResetPasswordNotifier, ResetPasswordState>(
  (ref) => ResetPasswordNotifier(ref.watch(authRepositoryProvider)),
);
