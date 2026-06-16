import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/storage/secure_storage.dart';

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
        await _signInWithCredential(credential);
      },
      verificationFailed: (e) => onError(e.message ?? 'Lỗi xác thực'),
      codeSent: (verificationId, _) => onCodeSent(verificationId),
      codeAutoRetrievalTimeout: (_) {},
    );
  }

  Future<String> verifyOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    return _signInWithCredential(credential);
  }

  Future<String> _signInWithCredential(PhoneAuthCredential credential) async {
    final result = await _firebaseAuth.signInWithCredential(credential);
    final idToken = await result.user!.getIdToken();

    final response = await _dio.post(
      '/auth/firebase',
      data: {'idToken': idToken},
    );

    final jwt = response.data['token'] as String;
    await SecureStorage.saveToken(jwt);
    return jwt;
  }

  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    await SecureStorage.deleteToken();
  }
}
