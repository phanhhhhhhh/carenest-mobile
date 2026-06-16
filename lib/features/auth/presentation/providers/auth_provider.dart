import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/auth_repository.dart';
import '../../../../core/network/dio_client.dart';

final dioProvider = Provider<Dio>((ref) => DioClient.create());

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioProvider)),
);

// --- Phone step ---

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
}

final phoneProvider = StateNotifierProvider.autoDispose<PhoneNotifier, PhoneState>(
  (ref) => PhoneNotifier(ref.watch(authRepositoryProvider)),
);

// --- OTP step ---

class OtpState {
  final bool isLoading;
  final String? error;
  final bool success;

  const OtpState({this.isLoading = false, this.error, this.success = false});

  OtpState copyWith({bool? isLoading, String? error, bool? success}) => OtpState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        success: success ?? this.success,
      );
}

class OtpNotifier extends StateNotifier<OtpState> {
  final AuthRepository _repo;
  final String verificationId;

  OtpNotifier(this._repo, this.verificationId) : super(const OtpState());

  Future<void> verifyOtp(String smsCode) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.verifyOtp(verificationId: verificationId, smsCode: smsCode);
      state = state.copyWith(isLoading: false, success: true);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Mã OTP không đúng');
    }
  }
}

final otpProvider = StateNotifierProvider.autoDispose.family<OtpNotifier, OtpState, String>(
  (ref, verificationId) => OtpNotifier(ref.watch(authRepositoryProvider), verificationId),
);
