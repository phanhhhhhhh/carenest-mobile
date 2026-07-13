import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../family/presentation/providers/camera_provider.dart';

/// Wireframe B3 — "Camera trong nhà": người cao tuổi có thể xem trạng thái
/// camera đang bật/tắt theo từng phòng và tự tắt tạm thời để có sự riêng tư
/// (gia đình sẽ được báo khi bật lại — UC-32, UC-33).
class ElderlyCameraScreen extends ConsumerStatefulWidget {
  const ElderlyCameraScreen({super.key});

  @override
  ConsumerState<ElderlyCameraScreen> createState() =>
      _ElderlyCameraScreenState();
}

class _ElderlyCameraScreenState extends ConsumerState<ElderlyCameraScreen> {
  String? _elderlyId;

  @override
  void initState() {
    super.initState();
    _loadId();
  }

  Future<void> _loadId() async {
    final id = await SecureStorage.getUserId();
    if (mounted) setState(() => _elderlyId = id);
  }

  Future<void> _togglePrivacyForAll(bool turnOff) async {
    final elderlyId = _elderlyId;
    if (elderlyId == null) return;
    final notifier = ref.read(cameraProvider(elderlyId).notifier);
    final cams = ref.read(cameraProvider(elderlyId)).cameras;
    for (final cam in cams) {
      await notifier.setPrivacyMode(cam.id, turnOff);
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(turnOff
            ? 'Đã tắt camera tạm thời. Con sẽ được báo cần riêng tư.'
            : 'Đã bật lại camera.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final elderlyId = _elderlyId;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Camera trong nhà',
          style: TextStyle(
              fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: elderlyId == null
          ? const Center(child: CircularProgressIndicator())
          : _buildBody(elderlyId),
    );
  }

  Widget _buildBody(String elderlyId) {
    final state = ref.watch(cameraProvider(elderlyId));

    if (state.isLoading && state.cameras.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.cameras.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset('assets/images/mascot/mascot_confused.jpg',
                  width: 140, fit: BoxFit.contain),
              const SizedBox(height: 8),
              const Text('Chưa có camera nào được liên kết',
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 15)),
              const SizedBox(height: 6),
              const Text('Con của bạn có thể liên kết camera trong phần Gia đình.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textHint, fontSize: 13)),
            ],
          ),
        ),
      );
    }

    // Wireframe B3: coi là "đang bật" khi có ít nhất 1 camera online và
    // không ở chế độ riêng tư.
    final anyActive =
        state.cameras.any((c) => c.isOnline && !c.privacyMode);
    final allPrivate = state.cameras.every((c) => c.privacyMode);

    return RefreshIndicator(
      onRefresh: () async =>
          ref.read(cameraProvider(elderlyId).notifier).load(),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Trạng thái tổng quan
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: anyActive ? AppColors.success : AppColors.textHint,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        anyActive ? 'Camera đang bật' : 'Camera đang tắt',
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary),
                      ),
                      Text(
                        anyActive
                            ? 'Con của bố/mẹ đang có thể nhìn thấy'
                            : 'Không ai có thể xem lúc này',
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Nút tắt/bật camera tạm thời (privacy toggle chính)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _togglePrivacyForAll(!allPrivate),
              icon: Icon(allPrivate ? Icons.videocam : Icons.power_settings_new,
                  size: 22),
              label: Text(
                allPrivate ? 'BẬT LẠI CAMERA' : 'TẮT CAMERA TẠM THỜI',
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    allPrivate ? AppColors.success : AppColors.sosPrimary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Khi tắt, con sẽ được báo là bạn cần sự riêng tư. Bấm lại để bật.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 24),

          const Text(
            'Từng phòng',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),
          ...state.cameras.map((cam) => _RoomTile(
                cam: cam,
                onToggle: (value) => ref
                    .read(cameraProvider(elderlyId).notifier)
                    .setPrivacyMode(cam.id, !value),
              )),
        ],
      ),
    );
  }
}

/// Một dòng trạng thái theo phòng, khớp với wireframe B3
/// ("Phòng khách — Đang bật", "Phòng ngủ — Đã tắt").
class _RoomTile extends StatelessWidget {
  final CameraDeviceData cam;
  final ValueChanged<bool> onToggle;

  const _RoomTile({required this.cam, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final isActive = cam.isOnline && !cam.privacyMode;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(Icons.videocam,
              color: isActive ? AppColors.success : AppColors.textHint,
              size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(cam.label,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
          ),
          Text(
            isActive ? 'Đang bật' : 'Đã tắt',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isActive ? AppColors.success : AppColors.textHint,
            ),
          ),
          Switch(
            value: isActive,
            onChanged: cam.isOnline ? onToggle : null,
            activeColor: AppColors.success,
          ),
        ],
      ),
    );
  }
}