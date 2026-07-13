import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/family_provider.dart';
import '../providers/camera_provider.dart';

class CameraScreen extends ConsumerStatefulWidget {
  const CameraScreen({super.key});

  @override
  ConsumerState<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends ConsumerState<CameraScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showBindDialog() {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    final snCtrl = TextEditingController();
    final labelCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Link Camera'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Enter the camera serial number (device SN) and a label.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: snCtrl,
              decoration: InputDecoration(
                labelText: 'Device SN',
                hintText: 'e.g., 5L0A1B2C3D4E5F6G',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.qr_code, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: labelCtrl,
              decoration: InputDecoration(
                labelText: 'Label (optional)',
                hintText: 'e.g., Living Room',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.label, color: AppColors.primary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              if (snCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              await ref
                  .read(cameraProvider(elderlyId).notifier)
                  .bindCamera(
                    snCtrl.text.trim(),
                    labelCtrl.text.trim().isNotEmpty
                        ? labelCtrl.text.trim()
                        : 'Camera',
                  );
            },
            child: const Text('Link'),
          ),
        ],
      ),
    );
  }

  void _confirmUnbind(int deviceId) {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remove Camera?'),
        content: const Text(
          'This will disconnect the camera from the account.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ref
                  .read(cameraProvider(elderlyId).notifier)
                  .unbindCamera(deviceId);
            },
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  void _handleLiveView(int deviceId) async {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    final url = await ref
        .read(cameraProvider(elderlyId).notifier)
        .getLiveStream(deviceId);
    if (url != null && mounted) {
      final uri = Uri.tryParse(url);
      if (uri != null && await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Stream URL: $url'),
            duration: const Duration(seconds: 10),
          ),
        );
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Live stream not available')),
      );
    }
    if (mounted) {
      ref.read(cameraProvider(elderlyId).notifier).clearLiveStream();
    }
  }

  void _handleSnapshot() async {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    final url = await ref
        .read(cameraProvider(elderlyId).notifier)
        .captureSosSnapshot();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            url != null
                ? 'Snapshot captured successfully!'
                : 'No camera available for snapshot',
          ),
          backgroundColor: url != null ? AppColors.success : AppColors.warning,
        ),
      );
    }
  }

  void _handleVoiceToggle(int deviceId, bool currentlyActive) async {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    final ok = currentlyActive
        ? await ref
              .read(cameraProvider(elderlyId).notifier)
              .stopVoiceCall(deviceId)
        : await ref
              .read(cameraProvider(elderlyId).notifier)
              .startVoiceCall(deviceId);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ok
                ? (currentlyActive ? 'Voice call ended' : 'Voice call started')
                : 'Could not change voice state',
          ),
          backgroundColor: ok ? AppColors.success : AppColors.error,
        ),
      );
    }
  }

  void _handlePrivacyToggle(int deviceId, bool currentlyEnabled) async {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    final ok = await ref
        .read(cameraProvider(elderlyId).notifier)
        .setPrivacyMode(deviceId, !currentlyEnabled);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ok
                ? 'Privacy mode ${!currentlyEnabled ? "ON" : "OFF"}'
                : 'Could not change privacy mode',
          ),
          backgroundColor: ok ? AppColors.success : AppColors.error,
        ),
      );
    }
  }

  void _handleMotionToggle(int deviceId, bool enabled) async {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    final ok = await ref
        .read(cameraProvider(elderlyId).notifier)
        .toggleMotionDetection(deviceId, enabled);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ok
                ? 'Motion detection ${enabled ? "ON" : "OFF"}'
                : 'Could not update motion detection',
          ),
          backgroundColor: ok ? AppColors.success : AppColors.error,
        ),
      );
    }
  }

  void _handlePtz(int deviceId) {
    final dash = ref.read(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    if (elderlyId == null) return;

    Future<void> send(String direction) async {
      final ok = await ref
          .read(cameraProvider(elderlyId).notifier)
          .controlPtz(deviceId, direction);
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không thể xoay camera lúc này'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Xoay camera',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 20),
            IconButton.filledTonal(
              onPressed: () => send('UP'),
              icon: const Icon(Icons.keyboard_arrow_up),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.filledTonal(
                  onPressed: () => send('LEFT'),
                  icon: const Icon(Icons.keyboard_arrow_left),
                ),
                const SizedBox(width: 40),
                IconButton.filledTonal(
                  onPressed: () => send('RIGHT'),
                  icon: const Icon(Icons.keyboard_arrow_right),
                ),
              ],
            ),
            IconButton.filledTonal(
              onPressed: () => send('DOWN'),
              icon: const Icon(Icons.keyboard_arrow_down),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () {
                send('STOP');
                Navigator.pop(ctx);
              },
              child: const Text('Đóng'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dash = ref.watch(familyDashboardProvider);
    final elderlyId = dash.data?.elderlyId;
    final elderlyName = dash.data?.elderlyName ?? 'Loved one';

    if (elderlyId == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: _appBar(elderlyName),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.people_outline, size: 56, color: AppColors.textHint),
              SizedBox(height: 16),
              Text(
                'No elderly person linked yet',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
              ),
            ],
          ),
        ),
      );
    }

    final state = ref.watch(cameraProvider(elderlyId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _appBar(elderlyName),
      body: state.isLoading && state.cameras.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.cameras.isEmpty
          ? _buildError(state.error!, elderlyId)
          : Column(
              children: [
                _buildStatusBar(state, elderlyId),
                if (state.cameras.isNotEmpty)
                  _buildLiveHero(state, state.cameras.first),
                TabBar(
                  controller: _tabController,
                  indicatorColor: AppColors.primary,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textHint,
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                  tabs: [
                    Tab(text: 'Check-in (${state.timeline.length})'),
                    Tab(text: 'Thiết bị (${state.cameras.length})'),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildTimeline(state),
                      _buildCameraList(state, elderlyId),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildLiveHero(CameraState state, CameraDeviceData cam) {
    final voiceActive = state.voiceActive;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1A2E),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Icon(
                      cam.privacyMode
                          ? Icons.visibility_off
                          : cam.isOnline
                          ? Icons.play_circle_fill
                          : Icons.videocam_off,
                      color: Colors.white54,
                      size: 44,
                    ),
                  ),
                ),
                if (cam.isOnline && !cam.privacyMode)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'LIVE · HD',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  cam.label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _ActionBtn(
                  icon: Icons.camera_alt,
                  label: 'Snapshot',
                  color: AppColors.secondary,
                  onTap: _handleSnapshot,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionBtn(
                  icon: voiceActive ? Icons.mic_off : Icons.mic,
                  label: voiceActive ? 'Kết thúc' : 'Gọi thoại',
                  color: voiceActive ? AppColors.error : AppColors.warning,
                  onTap: () => _handleVoiceToggle(cam.id, voiceActive),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionBtn(
                  icon: Icons.rotate_right,
                  label: 'Xoay',
                  color: AppColors.textSecondary,
                  onTap: () => _handlePtz(cam.id),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _appBar(String name) {
    return AppBar(
      title: Text(
        'Camera — $name',
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
      ),
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
    );
  }

  Widget _buildStatusBar(CameraState state, String elderlyId) {
    final s = state.status;
    Color indicatorColor;
    switch (s.indicatorColor) {
      case 'GREEN':
        indicatorColor = AppColors.success;
        break;
      case 'RED':
        indicatorColor = AppColors.error;
        break;
      default:
        indicatorColor = AppColors.textHint;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: AppColors.surface,
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: indicatorColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              s.hasCamera ? s.statusText : 'No cameras linked',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (s.hasCamera)
            Text(
              '${s.cameraCount} camera${s.cameraCount > 1 ? 's' : ''}',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildError(String error, String elderlyId) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 48),
            const SizedBox(height: 16),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => ref.invalidate(cameraProvider(elderlyId)),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCameraList(CameraState state, String elderlyId) {
    if (state.cameras.isEmpty) {
      return ListView(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 60),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.videocam_outlined,
                    color: AppColors.primary,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'No cameras linked',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Link an Imou camera to start monitoring',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _showBindDialog,
                  icon: const Icon(Icons.add_link, size: 18),
                  label: const Text('Link Camera'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return RefreshIndicator(
      onRefresh: () async =>
          ref.read(cameraProvider(elderlyId).notifier).load(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.cameras.length + 1,
        itemBuilder: (_, i) {
          if (i == state.cameras.length) {
            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: OutlinedButton.icon(
                onPressed: _showBindDialog,
                icon: const Icon(Icons.add_link, size: 18),
                label: const Text('Link Another Camera'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            );
          }
          return _buildCameraCard(state.cameras[i], state);
        },
      ),
    );
  }

  Widget _buildCameraCard(CameraDeviceData cam, CameraState state) {
    final isOnline = cam.isOnline;
    final isPrivacyMode = cam.privacyMode;
    final voiceActive = state.voiceActive;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isPrivacyMode
              ? AppColors.textHint.withValues(alpha: 0.2)
              : isOnline
              ? AppColors.success.withValues(alpha: 0.2)
              : AppColors.error.withValues(alpha: 0.15),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isPrivacyMode
                      ? AppColors.textHint.withValues(alpha: 0.1)
                      : isOnline
                      ? AppColors.success.withValues(alpha: 0.1)
                      : AppColors.error.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isPrivacyMode ? Icons.visibility_off : Icons.videocam,
                  color: isPrivacyMode
                      ? AppColors.textHint
                      : isOnline
                      ? AppColors.success
                      : AppColors.error,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cam.label,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      isPrivacyMode
                          ? 'Privacy mode'
                          : isOnline
                          ? 'Online'
                          : 'Offline',
                      style: TextStyle(
                        color: isPrivacyMode
                            ? AppColors.textSecondary
                            : isOnline
                            ? AppColors.success
                            : AppColors.error,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (action) {
                  switch (action) {
                    case 'unbind':
                      _confirmUnbind(cam.id);
                      break;
                    case 'privacy':
                      _handlePrivacyToggle(cam.id, cam.privacyMode);
                      break;
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'privacy',
                    child: Row(
                      children: [
                        Icon(
                          Icons.visibility_off,
                          size: 18,
                          color: AppColors.textSecondary,
                        ),
                        SizedBox(width: 8),
                        Text('Toggle Privacy'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'unbind',
                    child: Row(
                      children: [
                        Icon(Icons.link_off, size: 18, color: AppColors.error),
                        SizedBox(width: 8),
                        Text(
                          'Remove Camera',
                          style: TextStyle(color: AppColors.error),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Icon(
                Icons.motion_photos_on,
                size: 18,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Motion Detection',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Switch(
                value: cam.motionDetectionEnabled,
                onChanged: (v) => _handleMotionToggle(cam.id, v),
                activeColor: AppColors.primary,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ActionBtn(
                icon: Icons.live_tv,
                label: 'Live View',
                color: AppColors.primary,
                onTap: () => _handleLiveView(cam.id),
              ),
              _ActionBtn(
                icon: Icons.camera_alt,
                label: 'Snapshot',
                color: AppColors.secondary,
                onTap: _handleSnapshot,
              ),
              _ActionBtn(
                icon: voiceActive ? Icons.mic_off : Icons.mic,
                label: voiceActive ? 'End Call' : 'Talk',
                color: voiceActive ? AppColors.error : AppColors.warning,
                onTap: () => _handleVoiceToggle(cam.id, voiceActive),
              ),
              _ActionBtn(
                icon: isPrivacyMode ? Icons.visibility : Icons.visibility_off,
                label: isPrivacyMode ? 'Show' : 'Privacy',
                color: AppColors.textSecondary,
                onTap: () => _handlePrivacyToggle(cam.id, cam.privacyMode),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(CameraState state) {
    if (state.timeline.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.photo_library_outlined,
              color: AppColors.textHint,
              size: 56,
            ),
            SizedBox(height: 12),
            Text(
              'No check-in history yet',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.timeline.length,
      itemBuilder: (_, i) {
        final snap = state.timeline[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _triggerColor(snap.trigger).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _triggerIcon(snap.trigger),
                  color: _triggerColor(snap.trigger),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _triggerLabel(snap.trigger),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatTime(snap.createdAt),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (snap.imageUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    snap.imageUrl,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.broken_image,
                        color: AppColors.textHint,
                        size: 20,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  String _triggerLabel(String trigger) {
    switch (trigger) {
      case 'SOS':
        return 'SOS Emergency Snapshot';
      case 'CHECK_IN':
        return 'Scheduled Check-in';
      case 'MOTION':
        return 'Motion Detected';
      default:
        return 'Snapshot';
    }
  }

  IconData _triggerIcon(String trigger) {
    switch (trigger) {
      case 'SOS':
        return Icons.sos;
      case 'CHECK_IN':
        return Icons.schedule;
      case 'MOTION':
        return Icons.directions_run;
      default:
        return Icons.camera_alt;
    }
  }

  Color _triggerColor(String trigger) {
    switch (trigger) {
      case 'SOS':
        return AppColors.sosPrimary;
      case 'CHECK_IN':
        return AppColors.primary;
      case 'MOTION':
        return AppColors.warning;
      default:
        return AppColors.textSecondary;
    }
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays == 0) {
      return 'Today ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    }
    if (diff.inDays == 1) {
      return 'Yesterday ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    }
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
