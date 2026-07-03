import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class NotificationData {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool read;
  final DateTime createdAt;
  const NotificationData({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.read,
    required this.createdAt,
  });
  factory NotificationData.fromJson(Map<String, dynamic> j) => NotificationData(
        id: j['id'].toString(),
        title: j['title'] as String? ?? '',
        body: j['body'] as String? ?? '',
        type: j['type'] as String? ?? 'GENERAL',
        read: j['read'] as bool? ?? false,
        createdAt:
            DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
      );
}

class NotificationState {
  final bool isLoading;
  final String? error;
  final List<NotificationData> items;
  const NotificationState({
    this.isLoading = false,
    this.error,
    this.items = const [],
  });
  NotificationState copyWith({
    bool? isLoading,
    String? error,
    List<NotificationData>? items,
  }) =>
      NotificationState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        items: items ?? this.items,
      );
  int get unreadCount => items.where((n) => !n.read).length;
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final Dio _dio;
  NotificationNotifier(this._dio) : super(const NotificationState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final userId = await SecureStorage.getUserId();
      if (userId == null) {
        state = state.copyWith(isLoading: false);
        return;
      }
      final resp = await _dio.get('/users/$userId/notifications');
      final items = asListOfMaps(resp.data)
          .map((e) => NotificationData.fromJson(e))
          .toList();
      state = state.copyWith(isLoading: false, items: items);
    } on DioException catch (e) {
      state = state.copyWith(
          isLoading: false, error: 'Lỗi tải thông báo: ${e.message}');
    }
  }
}

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>(
  (ref) => NotificationNotifier(ref.watch(dioProvider)),
);
