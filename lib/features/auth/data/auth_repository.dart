import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../../../core/storage/secure_storage.dart';

class UserNotFoundException implements Exception {}

class AuthRepository {
  final Dio _dio;
  FirebaseAuth? get _firebaseAuth => kIsWeb ? null : FirebaseAuth.instance;

  AuthRepository(this._dio);

  Future<void> sendOtp({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(String error) onError,
  }) async {
    if (kIsWeb) {
      onError('Firebase Phone Auth không hỗ trợ trên web. Dùng DEV mode.');
      return;
    }
    await _firebaseAuth!.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (credential) async {
        await signInWithCredential(credential);
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
    return signInWithCredential(credential);
  }

  Future<String> signInWithCredential(PhoneAuthCredential credential) async {
    final auth = _firebaseAuth;
    if (auth == null) {
      throw UnsupportedError('Firebase Auth không khả dụng trên platform này');
    }
    final result = await auth.signInWithCredential(credential);
    return await result.user!.getIdToken() ?? '';
  }

  Future<bool> login(String firebaseToken) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {'firebaseToken': firebaseToken},
      );
      await SecureStorage.saveToken(response.data['accessToken'] as String);
      final refreshToken = response.data['refreshToken'] as String?;
      if (refreshToken != null) await SecureStorage.saveRefreshToken(refreshToken);
      final user = response.data['user'] as Map<String, dynamic>?;
      if (user != null) {
        final role = user['role'] as String?;
        if (role != null) await SecureStorage.saveRole(role);
        final name = user['name'] as String?;
        if (name != null) await SecureStorage.saveName(name);
        final id = user['id'];
        if (id != null) await SecureStorage.saveUserId(id.toString());
      }
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
    final refreshToken = response.data['refreshToken'] as String?;
    if (refreshToken != null) await SecureStorage.saveRefreshToken(refreshToken);
    await SecureStorage.saveRole(role);
    await SecureStorage.saveName(name);
    final user = response.data['user'] as Map<String, dynamic>?;
    final id = user?['id'];
    if (id != null) await SecureStorage.saveUserId(id.toString());
  }

  Future<bool> loginDev(String phoneNumber) async {
    return login('DEV_PHONE:$phoneNumber');
  }

  Future<void> signOut() async {
    await _firebaseAuth?.signOut();
    await SecureStorage.clearAll();
  }
}
