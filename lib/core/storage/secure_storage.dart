import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';
  static const _roleKey = 'user_role';
  static const _nameKey = 'user_name';
  static const _phoneKey = 'user_phone';

  static Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  static Future<String?> getToken() => _storage.read(key: _tokenKey);

  static Future<void> saveRole(String role) =>
      _storage.write(key: _roleKey, value: role);

  static Future<String?> getRole() => _storage.read(key: _roleKey);

  static Future<void> saveName(String name) =>
      _storage.write(key: _nameKey, value: name);

  static Future<String?> getName() => _storage.read(key: _nameKey);

  static Future<void> savePhone(String phone) =>
      _storage.write(key: _phoneKey, value: phone);

  static Future<String?> getPhone() => _storage.read(key: _phoneKey);

  static Future<void> clearAll() => _storage.deleteAll();
}
