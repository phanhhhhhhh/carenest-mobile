import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────────

class CameraDeviceData {
  final int id;
  final String label;
  final String deviceSn;
  final String status; // ONLINE, OFFLINE
  final bool privacyMode;
  final bool motionDetectionEnabled;
  final String snapshotSchedule;

  const CameraDeviceData({
    required this.id,
    required this.label,
    required this.deviceSn,
    this.status = 'ONLINE',
    this.privacyMode = false,
    this.motionDetectionEnabled = false,
    this.snapshotSchedule = '',
  });

  factory CameraDeviceData.fromJson(Map<String, dynamic> j) =>
      CameraDeviceData(
        id: (j['id'] as num).toInt(),
        label: j['label'] as String? ?? 'Camera',
        deviceSn: j['deviceSn'] as String? ?? '',
        status: j['status'] as String? ?? 'ONLINE',
        privacyMode: j['privacyMode'] as bool? ?? false,
        motionDetectionEnabled:
            j['motionDetectionEnabled'] as bool? ?? false,
        snapshotSchedule: j['snapshotSchedule'] as String? ?? '',
      );

  bool get isOnline => status == 'ONLINE';
}

class CameraStatusData {
  final bool hasCamera;
  final int cameraCount;
  final bool allOnline;
  final String indicatorColor; // GREEN, RED, GRAY
  final String statusText;

  const CameraStatusData({
    this.hasCamera = false,
    this.cameraCount = 0,
    this.allOnline = false,
    this.indicatorColor = 'GRAY',
    this.statusText = '',
  });

  factory CameraStatusData.fromJson(Map<String, dynamic> j) =>
      CameraStatusData(
        hasCamera: j['hasCamera'] as bool? ?? false,
        cameraCount: (j['cameraCount'] as num?)?.toInt() ?? 0,
        allOnline: j['allOnline'] as bool? ?? false,
        indicatorColor: j['indicatorColor'] as String? ?? 'GRAY',
        statusText: j['statusText'] as String? ?? '',
      );
}

class CameraSnapshotData {
  final int id;
  final String imageUrl;
  final String trigger; // SOS, CHECK_IN, MOTION
  final bool success;
  final DateTime createdAt;

  const CameraSnapshotData({
    required this.id,
    required this.imageUrl,
    this.trigger = 'CHECK_IN',
    this.success = true,
    required this.createdAt,
  });

  factory CameraSnapshotData.fromJson(Map<String, dynamic> j) =>
      CameraSnapshotData(
        id: (j['id'] as num).toInt(),
        imageUrl: j['imageUrl'] as String? ?? '',
        trigger: j['trigger'] as String? ?? 'CHECK_IN',
        success: j['success'] as bool? ?? true,
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );
}

// ── State ──────────────────────────────────────────────────────────────

class CameraState {
  final bool isLoading;
  final String? error;
  final bool isProcessing;
  final CameraStatusData status;
  final List<CameraDeviceData> cameras;
  final List<CameraSnapshotData> timeline;
  final String? liveStreamUrl;
  final bool voiceActive;

  const CameraState({
    this.isLoading = false,
    this.error,
    this.isProcessing = false,
    this.status = const CameraStatusData(),
    this.cameras = const [],
    this.timeline = const [],
    this.liveStreamUrl,
    this.voiceActive = false,
  });

  CameraState copyWith({
    bool? isLoading,
    String? error,
    bool? isProcessing,
    CameraStatusData? status,
    List<CameraDeviceData>? cameras,
    List<CameraSnapshotData>? timeline,
    String? liveStreamUrl,
    bool? voiceActive,
  }) =>
      CameraState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        isProcessing: isProcessing ?? this.isProcessing,
        status: status ?? this.status,
        cameras: cameras ?? this.cameras,
        timeline: timeline ?? this.timeline,
        liveStreamUrl: liveStreamUrl,
        voiceActive: voiceActive ?? this.voiceActive,
      );

  int get timelinePage => 0;
}

// ── Notifier ───────────────────────────────────────────────────────────

class CameraNotifier extends StateNotifier<CameraState> {
  final Dio _dio;
  final String elderlyId;

  CameraNotifier(this._dio, this.elderlyId)
      : super(const CameraState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final results = await Future.wait([
        _dio.get('/elderly/$elderlyId/camera-status'),
        _dio.get('/elderly/$elderlyId/cameras'),
        _dio.get('/elderly/$elderlyId/camera-timeline',
            queryParameters: {'page': 0, 'size': 20}),
      ]);

      final statusData =
          CameraStatusData.fromJson(results[0].data as Map<String, dynamic>);

      final camerasRaw = results[1].data is List
          ? results[1].data as List<dynamic>
          : <dynamic>[];
      final cameras = camerasRaw
          .map((e) => CameraDeviceData.fromJson(e as Map<String, dynamic>))
          .toList();

      final timelineRaw =
          (results[2].data as Map<String, dynamic>)['snapshots'] as List<dynamic>? ??
              [];
      final timeline = timelineRaw
          .map((e) => CameraSnapshotData.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        isLoading: false,
        status: statusData,
        cameras: cameras,
        timeline: timeline,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        state = state.copyWith(isLoading: false);
        return;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not load cameras: ${e.message}',
      );
    }
  }

  // UC-26: Bind camera
  Future<bool> bindCamera(String deviceSn, String label) async {
    state = state.copyWith(isProcessing: true);
    try {
      await _dio.post('/elderly/$elderlyId/cameras', data: {
        'deviceSn': deviceSn,
        'label': label,
      });
      await load();
      state = state.copyWith(isProcessing: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Could not bind camera: ${e.message}',
      );
      return false;
    }
  }

  // UC-26: Unbind camera
  Future<bool> unbindCamera(int deviceId) async {
    state = state.copyWith(isProcessing: true);
    try {
      await _dio.delete('/cameras/$deviceId');
      await load();
      state = state.copyWith(isProcessing: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Could not remove camera: ${e.message}',
      );
      return false;
    }
  }

  // UC-27: Get live stream
  Future<String?> getLiveStream(int deviceId) async {
    state = state.copyWith(isProcessing: true);
    try {
      final resp = await _dio.get('/cameras/$deviceId/live');
      final data = resp.data as Map<String, dynamic>;
      final url = data['streamUrl'] as String? ??
          data['rtspUrl'] as String? ??
          data['hlsUrl'] as String? ??
          '';
      state = state.copyWith(isProcessing: false, liveStreamUrl: url);
      return url.isNotEmpty ? url : null;
    } on DioException catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Could not get stream: ${e.message}',
      );
      return null;
    }
  }

  // UC-28: SOS Snapshot
  Future<String?> captureSosSnapshot({int? emergencyEventId}) async {
    state = state.copyWith(isProcessing: true);
    try {
      final resp =
          await _dio.post('/elderly/$elderlyId/cameras/snapshot', data: {
        if (emergencyEventId != null) 'emergencyEventId': emergencyEventId,
      });
      final data = resp.data as Map<String, dynamic>;
      final url = data['imageUrl'] as String? ?? '';
      await load();
      state = state.copyWith(isProcessing: false);
      return url.isNotEmpty ? url : null;
    } on DioException catch (_) {
      state = state.copyWith(isProcessing: false);
      return null;
    }
  }

  // UC-31: Two-way voice
  Future<bool> startVoiceCall(int deviceId) async {
    try {
      await _dio.post('/cameras/$deviceId/voice/start');
      state = state.copyWith(voiceActive: true);
      return true;
    } on DioException {
      return false;
    }
  }

  Future<bool> stopVoiceCall(int deviceId) async {
    try {
      await _dio.post('/cameras/$deviceId/voice/stop');
      state = state.copyWith(voiceActive: false);
      return true;
    } on DioException {
      return false;
    }
  }

  // UC-32: Privacy toggle
  Future<bool> setPrivacyMode(int deviceId, bool enabled) async {
    try {
      await _dio.post('/cameras/$deviceId/privacy', data: {'enabled': enabled});
      await load();
      return true;
    } on DioException {
      return false;
    }
  }

  // UC-30: Motion detection toggle
  Future<bool> toggleMotionDetection(int deviceId, bool enabled) async {
    try {
      await _dio.put('/cameras/$deviceId/motion-detection',
          data: {'enabled': enabled});
      await load();
      return true;
    } on DioException {
      return false;
    }
  }

  void clearLiveStream() => state = state.copyWith(liveStreamUrl: null);
  void refresh() => load();
}

final cameraProvider = StateNotifierProvider.family<CameraNotifier, CameraState, String>(
  (ref, elderlyId) => CameraNotifier(ref.watch(dioProvider), elderlyId),
);
