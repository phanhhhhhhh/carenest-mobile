import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/elderly_provider.dart';
import '../providers/medication_provider.dart';
import '../providers/health_metric_provider.dart';
import '../../../family/presentation/providers/emergency_event_provider.dart';
import '../../../notifications/presentation/providers/notification_provider.dart';
import 'package:go_router/go_router.dart';

class ElderlyHomeScreen extends ConsumerStatefulWidget {
  const ElderlyHomeScreen({super.key});

  @override
  ConsumerState<ElderlyHomeScreen> createState() => _ElderlyHomeScreenState();
}

class _ElderlyHomeScreenState extends ConsumerState<ElderlyHomeScreen> {
  String _name = '';
  String? _elderlyId;
  bool _sosCountdown = false;
  int _countdown = 3;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final name = await SecureStorage.getName();
    final id = await SecureStorage.getUserId();
    if (mounted) {
      setState(() {
        _name = name ?? 'bạn';
        _elderlyId = id;
      });
    }
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  void _onSosPressed() {
    setState(() {
      _sosCountdown = true;
      _countdown = 3;
    });
    _runCountdown();
  }

  void _runCountdown() async {
    for (int i = 3; i > 0; i--) {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted || !_sosCountdown) return;
      setState(() => _countdown = i - 1);
    }
    if (!mounted || !_sosCountdown) return;
    setState(() => _sosCountdown = false);
    await _sendSos();
  }

  Future<void> _sendSos() async {
    try {
      final elderlyId = _elderlyId;
      if (elderlyId == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Không thể gửi SOS: chưa xác định được tài khoản'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }
      final notifier = ref.read(emergencyEventProvider(elderlyId).notifier);
      final ok = await notifier.createSosEvent();
      if (!mounted) return;
      if (ok) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            icon: const Icon(Icons.check_circle, color: AppColors.success, size: 56),
            title: const Text('Đã gửi SOS',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.bold)),
            content: const Text(
              'Tín hiệu khẩn cấp đã được gửi. Tất cả thành viên gia đình đã được thông báo.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
            ),
            actions: [
              Center(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Đã hiểu'),
                ),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không thể gửi SOS. Hãy gọi trực tiếp cho gia đình trong trường hợp khẩn cấp!'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không thể gửi SOS. Hãy gọi trực tiếp cho gia đình trong trường hợp khẩn cấp!'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      }
    }
  }

  void _cancelSos() => setState(() => _sosCountdown = false);

  @override
  Widget build(BuildContext context) {
    final profileName = ref.watch(elderlyProfileProvider).profile?.name;
    final displayName =
        (profileName != null && profileName.isNotEmpty) ? profileName : _name;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(displayName),
              const SizedBox(height: 28),
              _buildSosButton(),
              const SizedBox(height: 28),
              _buildHealthSummary(),
              const SizedBox(height: 28),
              _buildTodayMedications(),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String displayName) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$_greeting, $displayName!',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _formatDate(),
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
        Builder(builder: (context) {
          final notifState = ref.watch(notificationProvider);
          final unread = notifState.unreadCount;
          return Stack(
            children: [
              IconButton(
                onPressed: () => context.push('/notifications'),
                icon: const Icon(Icons.notifications_outlined,
                    color: AppColors.textPrimary, size: 26),
              ),
              if (unread > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$unread',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
            ],
          );
        }),
      ],
    );
  }

  Widget _buildSosButton() {
    return Center(
      child: Column(
        children: [
          if (_sosCountdown) ...[
            const Text(
              'Đang gửi tín hiệu khẩn cấp...',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.sosPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 160,
                  height: 160,
                  child: CircularProgressIndicator(
                    value: _countdown / 3,
                    strokeWidth: 6,
                    color: AppColors.sosPrimary,
                    backgroundColor: AppColors.sosLight,
                  ),
                ),
                Text(
                  '$_countdown',
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: AppColors.sosPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: _cancelSos,
              icon: const Icon(Icons.close, color: AppColors.textSecondary),
              label: const Text(
                'Hủy',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ] else ...[
            GestureDetector(
              onTap: _onSosPressed,
              child: Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.sosPrimary,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.sosPrimary.withOpacity(0.4),
                      blurRadius: 24,
                      spreadRadius: 6,
                    ),
                  ],
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'SOS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 4,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Emergency Alert',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Nhấn và giữ 3 giây để gửi tín hiệu khẩn cấp',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHealthSummary() {
    if (_elderlyId == null) return const SizedBox.shrink();

    final healthState = ref.watch(healthMetricProvider(_elderlyId!));
    final latest = healthState.latestByType;

    String? bloodPressure;
    String? bloodSugar;
    String? heartRate;

    final bp = latest['BLOOD_PRESSURE'];
    if (bp != null) {
      bloodPressure = '${bp.value}';
      if (bp.valueSecondary != null) {
        bloodPressure = '$bloodPressure/${bp.valueSecondary}';
      }
      if (bp.unit != null) bloodPressure = '$bloodPressure ${bp.unit}';
    }

    final bs = latest['BLOOD_GLUCOSE'];
    if (bs != null) {
      bloodSugar = '${bs.value}';
      if (bs.unit != null) bloodSugar = '$bloodSugar ${bs.unit}';
    }

    final hr = latest['HEART_RATE'];
    if (hr != null) {
      heartRate = '${hr.value}';
      if (hr.unit != null) heartRate = '$heartRate ${hr.unit}';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Chỉ số hôm nay',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            _HealthCard(
              icon: Icons.favorite,
              iconBgColor: const Color(0xFFFFEBEE),
              iconColor: AppColors.error,
              label: 'Nhịp tim',
              value: heartRate ?? '--',
              unit: '',
            ),
            const SizedBox(width: 10),
            _HealthCard(
              icon: Icons.water_drop,
              iconBgColor: const Color(0xFFE3F2FD),
              iconColor: const Color(0xFF1565C0),
              label: 'Huyết áp',
              value: bloodPressure ?? '--',
              unit: '',
            ),
            const SizedBox(width: 10),
            _HealthCard(
              icon: Icons.opacity,
              iconBgColor: const Color(0xFFFFF3E0),
              iconColor: AppColors.warning,
              label: 'Đường huyết',
              value: bloodSugar ?? '--',
              unit: '',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTodayMedications() {
    final medsState = ref.watch(medicationsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Thuốc hôm nay',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            if (medsState.items.isNotEmpty)
              GestureDetector(
                onTap: () => context.go('/elderly/medication'),
                child: const Text(
                  'Xem tất cả',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        if (medsState.isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          )
        else if (medsState.items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Column(
              children: [
                Icon(Icons.medication_outlined,
                    color: AppColors.textHint, size: 36),
                SizedBox(height: 8),
                Text(
                  'Chưa có thuốc nào',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          )
        else
          ...medsState.items
              .take(3)
              .map((med) => _MedicationTile(medication: med)),
      ],
    );
  }

  String _formatDate() {
    final now = DateTime.now();
    const days = [
      'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm',
      'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật',
    ];
    return '${days[now.weekday - 1]}, ${now.day}/${now.month}/${now.year}';
  }
}

class _HealthCard extends StatelessWidget {
  final IconData icon;
  final Color iconBgColor;
  final Color iconColor;
  final String label;
  final String value;
  final String unit;

  const _HealthCard({
    required this.icon,
    required this.iconBgColor,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.unit,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconBgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _MedicationTile extends StatelessWidget {
  final MedicationItem medication;

  const _MedicationTile({required this.medication});

  String _formatNextDose() {
    final dt = medication.nextDoseTime;
    if (dt == null) return '';
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    final timeLabel = _formatNextDose();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppColors.textHint.withOpacity(0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.medication,
              color: AppColors.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  medication.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  medication.dosage,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          if (timeLabel.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                timeLabel,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          const SizedBox(width: 10),
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: medication.taken
                    ? AppColors.success
                    : AppColors.textHint.withOpacity(0.5),
                width: 2,
              ),
              color: medication.taken
                  ? AppColors.success.withOpacity(0.1)
                  : Colors.transparent,
            ),
            child: medication.taken
                ? const Icon(Icons.check, color: AppColors.success, size: 14)
                : null,
          ),
        ],
      ),
    );
  }
}
