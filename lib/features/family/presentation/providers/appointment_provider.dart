import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/dio_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ── Models ──────────────────────────────────────────────────────────

class AppointmentItem {
  final String id;
  final String doctor;
  final String specialty;
  final String? location;
  final DateTime appointmentDate;
  final String status; // SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED
  final String? notes;
  final DateTime? createdAt;

  const AppointmentItem({
    required this.id,
    required this.doctor,
    required this.specialty,
    this.location,
    required this.appointmentDate,
    required this.status,
    this.notes,
    this.createdAt,
  });

  factory AppointmentItem.fromJson(Map<String, dynamic> j) {
    final rawDate = j['appointmentDate'] as String? ?? '';
    return AppointmentItem(
      id: j['id'].toString(),
      doctor: j['doctor'] as String? ?? '',
      specialty: j['specialty'] as String? ?? '',
      location: j['location'] as String?,
      appointmentDate: DateTime.tryParse(rawDate) ?? DateTime.now(),
      status: j['status'] as String? ?? 'SCHEDULED',
      notes: j['notes'] as String?,
      createdAt: j['createdAt'] != null
          ? DateTime.tryParse(j['createdAt'] as String)
          : null,
    );
  }

  AppointmentItem copyWith({
    String? doctor,
    String? specialty,
    String? location,
    DateTime? appointmentDate,
    String? status,
    String? notes,
  }) =>
      AppointmentItem(
        id: id,
        doctor: doctor ?? this.doctor,
        specialty: specialty ?? this.specialty,
        location: location ?? this.location,
        appointmentDate: appointmentDate ?? this.appointmentDate,
        status: status ?? this.status,
        notes: notes ?? this.notes,
        createdAt: createdAt,
      );

  bool get isUpcoming =>
      status == 'SCHEDULED' || status == 'RESCHEDULED';

  bool get isPast =>
      status == 'COMPLETED' || status == 'CANCELLED';
}

// ── State ───────────────────────────────────────────────────────────

class AppointmentListState {
  final bool isLoading;
  final String? error;
  final List<AppointmentItem> appointments;
  final bool isSaving;

  const AppointmentListState({
    this.isLoading = false,
    this.error,
    this.appointments = const [],
    this.isSaving = false,
  });

  AppointmentListState copyWith({
    bool? isLoading,
    String? error,
    List<AppointmentItem>? appointments,
    bool? isSaving,
  }) =>
      AppointmentListState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        appointments: appointments ?? this.appointments,
        isSaving: isSaving ?? this.isSaving,
      );

  List<AppointmentItem> get upcoming =>
      appointments.where((a) => a.isUpcoming).toList()
        ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));

  List<AppointmentItem> get past =>
      appointments.where((a) => a.isPast).toList()
        ..sort((a, b) => b.appointmentDate.compareTo(a.appointmentDate));
}

// ── Notifier ────────────────────────────────────────────────────────

class AppointmentNotifier extends StateNotifier<AppointmentListState> {
  final Dio _dio;

  AppointmentNotifier(this._dio) : super(const AppointmentListState()) {
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
      final resp = await _dio.get('/users/$userId/appointments');
      final items = asListOfMaps(resp.data)
          .map((e) => AppointmentItem.fromJson(e))
          .toList();
      state = state.copyWith(isLoading: false, appointments: items);
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error loading appointments: ${e.message}',
      );
    }
  }

  Future<bool> create({
    required String doctor,
    required String specialty,
    String? location,
    required DateTime appointmentDate,
    String? notes,
    String? elderlyId,
  }) async {
    state = state.copyWith(isSaving: true, error: null);
    try {
      final eId = elderlyId ?? await SecureStorage.getUserId();
      await _dio.post('/appointments', data: {
        if (eId != null) 'elderlyId': int.tryParse(eId),
        'doctor': doctor,
        'specialty': specialty,
        if (location != null && location.isNotEmpty) 'location': location,
        'appointmentDate': appointmentDate.toIso8601String(),
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      });
      await load();
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Error creating appointment: ${e.message}',
      );
      return false;
    }
  }

  Future<bool> update({
    required String appointmentId,
    String? doctor,
    String? specialty,
    String? location,
    DateTime? appointmentDate,
    String? notes,
  }) async {
    state = state.copyWith(isSaving: true, error: null);
    try {
      final data = <String, dynamic>{};
      if (doctor != null) data['doctor'] = doctor;
      if (specialty != null) data['specialty'] = specialty;
      if (location != null) data['location'] = location;
      if (appointmentDate != null) {
        data['appointmentDate'] = appointmentDate.toIso8601String();
      }
      if (notes != null) data['notes'] = notes;
      await _dio.patch('/appointments/$appointmentId', data: data);
      await load();
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Error updating appointment: ${e.message}',
      );
      return false;
    }
  }

  Future<bool> delete(String appointmentId) async {
    try {
      await _dio.delete('/appointments/$appointmentId');
      await load();
      return true;
    } on DioException catch (e) {
      state = state.copyWith(error: 'Error deleting appointment: ${e.message}');
      return false;
    }
  }

  Future<bool> updateStatus(String appointmentId, String newStatus) async {
    try {
      await _dio.patch('/appointments/$appointmentId/status', data: {
        'status': newStatus,
      });
      await load();
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        error: 'Error updating status: ${e.message}',
      );
      return false;
    }
  }

  void refresh() => load();
}

final appointmentProvider = StateNotifierProvider<AppointmentNotifier,
    AppointmentListState>(
  (ref) => AppointmentNotifier(ref.watch(dioProvider)),
);
