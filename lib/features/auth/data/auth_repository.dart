import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/storage/secure_storage.dart';

class UserNotFoundException implements Exception {}

class AuthRepository {
  final Dio _dio;
  final FirebaseAuth _firebaseAuth;

  AuthRepository(this._dio) : _firebaseAuth = FirebaseAuth.instance;

  Future<void> sendOtp({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(String error) onError,
  }) async {
    await _firebaseAuth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (credential) async {
        await signInWithCredential(credential);
      },
      verificationFailed: (e) => onError(e.message ?? 'Lỗi xác thực'),
      codeSent: (verificationId, _) => onCodeSent(verificationId),
      codeAutoRetrievalTimeout: (_) {},
    );
  }

  /// Returns firebase ID token after OTP verified (caller decides login vs register)
  Future<String> verifyOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    return signInWithCredential(credential);
  }

  Future<String> signInWithCredential(PhoneAuthCredential credential) async {
    final result = await _firebaseAuth.signInWithCredential(credential);
    return await result.user!.getIdToken() ?? '';
  }

  /// Returns true nếu login thành công, throws UserNotFoundException nếu chưa đăng ký
  Future<bool> login(String firebaseToken) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {'firebaseToken': firebaseToken},
      );
      await SecureStorage.saveToken(response.data['accessToken'] as String);
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw UserNotFoundException();
      }
      rethrow;
    }
  }

  Future<void> register({
    required String firebaseToken,
    required String name,
    required String role,
    String? dob,
  }) async {
    final body = <String, dynamic>{
      'firebaseToken': firebaseToken,
      'name': name,
      'role': role,
    };
    if (dob != null) body['dob'] = dob;

    final response = await _dio.post('/auth/register', data: body);
    await SecureStorage.saveToken(response.data['accessToken'] as String);
  }

  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    await SecureStorage.deleteToken();
  }
}
