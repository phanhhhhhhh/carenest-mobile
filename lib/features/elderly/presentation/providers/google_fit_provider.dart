import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// Google Fit sync state for a specific elderly user.
class GoogleFitState {
  final bool isLoading;
  final String? error;
  final bool isConnected;
  final bool isConfigured;
  final bool isSyncing;
  final String? lastSyncResult;
  final String? authUrl;

  const GoogleFitState({
    this.isLoading = false,
    this.error,
    this.isConnected = false,
    this.isConfigured = false,
    this.isSyncing = false,
    this.lastSyncResult,
    this.authUrl,
  });

  GoogleFitState copyWith({
    bool? isLoading,
    String? error,
    bool? isConnected,
    bool? isConfigured,
    bool? isSyncing,
    String? lastSyncResult,
    String? authUrl,
  }) =>
      GoogleFitState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        isConnected: isConnected ?? this.isConnected,
        isConfigured: isConfigured ?? this.isConfigured,
        isSyncing: isSyncing ?? this.isSyncing,
        lastSyncResult: lastSyncResult,
        authUrl: authUrl,
      );
}

class GoogleFitNotifier extends StateNotifier<GoogleFitState> {
  final Dio _dio;
  final String elderlyId;

  GoogleFitNotifier(this._dio, this.elderlyId)
      : super(const GoogleFitState()) {
    loadStatus();
  }

  /// GET /api/google-fit/status/{userId}
  Future<void> loadStatus() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final resp = await _dio.get('/google-fit/status/$elderlyId');
      final data = resp.data as Map<String, dynamic>;
      state = state.copyWith(
        isLoading: false,
        isConnected: data['connected'] == true,
        isConfigured: data['configured'] == true,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 503) {
        state = state.copyWith(
            isLoading: false, isConfigured: false,
            error: 'Google Fit is not configured on this server');
        return;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not check status: ${e.message}',
      );
    }
  }

  /// GET /api/google-fit/connect/{userId} → returns auth URL
  Future<String?> connect() async {
    state = state.copyWith(isLoading: true, error: null, authUrl: null);
    try {
      final resp = await _dio.get('/google-fit/connect/$elderlyId');
      final data = resp.data as Map<String, dynamic>;
      final url = data['authUrl'] as String?;
      state = state.copyWith(isLoading: false, authUrl: url);
      return url;
    } on DioException catch (e) {
      if (e.response?.statusCode == 503) {
        state = state.copyWith(
          isLoading: false,
          error: 'Google Fit is not configured. Contact admin.',
        );
        return null;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not connect: ${e.message}',
      );
      return null;
    }
  }

  /// POST /api/google-fit/sync/{userId}
  Future<Map<String, dynamic>?> syncNow() async {
    state = state.copyWith(isSyncing: true, error: null);
    try {
      final resp = await _dio.post('/google-fit/sync/$elderlyId');
      final data = resp.data as Map<String, dynamic>;
      state = state.copyWith(
        isSyncing: false,
        lastSyncResult: 'Sync completed successfully',
      );
      return data;
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response?.data['message'] ?? 'Sync failed')
          : 'Sync failed';
      state = state.copyWith(
        isSyncing: false,
        error: msg.toString(),
      );
      return null;
    }
  }

  /// POST /api/google-fit/disconnect/{userId}
  Future<bool> disconnect() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _dio.post('/google-fit/disconnect/$elderlyId');
      state = state.copyWith(isLoading: false, isConnected: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Could not disconnect: ${e.message}',
      );
      return false;
    }
  }

  void clearAuthUrl() => state = state.copyWith(authUrl: null);
  void refresh() => loadStatus();
}

final googleFitProvider =
    StateNotifierProvider.family<GoogleFitNotifier, GoogleFitState, String>(
  (ref, elderlyId) => GoogleFitNotifier(ref.watch(dioProvider), elderlyId),
);
