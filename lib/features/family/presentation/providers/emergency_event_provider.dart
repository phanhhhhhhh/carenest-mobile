import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class EmergencyEventData {
  final String id;
  final String type;
  final String description;
  final String status;
  final DateTime createdAt;
  const EmergencyEventData({
    required this.id, required this.type, required this.description,
    required this.status, required this.createdAt,
  });
  factory EmergencyEventData.fromJson(Map<String, dynamic> j) => EmergencyEventData(
    id: j['id'].toString(),
    type: j['type'] as String? ?? 'SOS',
    description: j['description'] as String? ?? '',
    status: j['status'] as String? ?? 'ACTIVE',
    createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
  );
}

class EmergencyEventState {
  final bool isLoading;
  final String? error;
  final List<EmergencyEventData> events;
  const EmergencyEventState({this.isLoading = false, this.error, this.events = const []});
  EmergencyEventState copyWith({bool? isLoading, String? error, List<EmergencyEventData>? events}) =>
    EmergencyEventState(isLoading: isLoading ?? this.isLoading, error: error, events: events ?? this.events);
  int get activeCount => events.where((e) => e.status == 'ACTIVE').length;
}

class EmergencyEventNotifier extends StateNotifier<EmergencyEventState> {
  final Dio _dio;
  final String elderlyId;
  EmergencyEventNotifier(this._dio, this.elderlyId) : super(const EmergencyEventState()) { load(); }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final resp = await _dio.get('/elderly/$elderlyId/emergency-events');
      final list = asListOfMaps(resp.data).map((e) => EmergencyEventData.fromJson(e)).toList();
      state = state.copyWith(isLoading: false, events: list);
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: 'Error: ${e.message}');
    }
  }

  /// POST /api/elderly/{elderlyId}/emergency-events — create SOS event.
  /// Returns true on success (201), false otherwise.
  Future<bool> createSosEvent() async {
    try {
      final resp = await _dio.post('/elderly/$elderlyId/emergency-events', data: {
        'type': 'SOS',
        'description': 'User pressed emergency SOS button',
      });
      if (resp.statusCode == 201 || resp.statusCode == 200) {
        await load(); // refresh list after creating
        return true;
      }
      return false;
    } on DioException {
      return false;
    }
  }

  /// PATCH /api/users/{userId}/emergency-events/read-all — mark all alerts as read.
  Future<bool> markAllRead(String userId) async {
    try {
      await _dio.patch('/users/$userId/emergency-events/read-all');
      await load();
      return true;
    } on DioException {
      return false;
    }
  }

  void refresh() => load();
}

final emergencyEventProvider = StateNotifierProvider.family<EmergencyEventNotifier, EmergencyEventState, String>(
  (ref, elderlyId) => EmergencyEventNotifier(ref.watch(dioProvider), elderlyId),
);
