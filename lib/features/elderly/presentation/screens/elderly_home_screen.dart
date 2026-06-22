import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import 'package:go_router/go_router.dart';

class ElderlyHomeScreen extends ConsumerStatefulWidget {
  const ElderlyHomeScreen({super.key});

  @override
  ConsumerState<ElderlyHomeScreen> createState() => _ElderlyHomeScreenState();
}

class _ElderlyHomeScreenState extends ConsumerState<ElderlyHomeScreen> {
  String _name = '';
  bool _sosCountdown = false;
  int _countdown = 3;

  @override
  void initState() {
    super.initState();
    _loadName();
  }

  Future<void> _loadName() async {
    final name = await SecureStorage.getName();
    if (mounted) setState(() => _name = name ?? 'bạn');
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
    _sendSos();
  }

  void _sendSos() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đã gửi tín hiệu SOS đến gia đình!'),
        backgroundColor: AppColors.sosPrimary,
        duration: Duration(seconds: 3),
      ),
    );
  }

  void _cancelSos() => setState(() => _sosCountdown = false);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildSosButton(),
              const SizedBox(height: 24),
              _buildHealthSummary(),
              const SizedBox(height: 24),
              _buildTodayMedications(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$_greeting, $_name!',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _formatDate(),
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () async {
            await ref.read(authRepositoryProvider).signOut();
            if (context.mounted) context.go('/phone');
          },
          icon: const Icon(Icons.logout, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildSosButton() {
    return Center(
      child: Column(
        children: [
          if (_sosCountdown) ...[
            const Text(
              'Đang gửi SOS...',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.sosPrimary,
              ),
            ),
            const SizedBox(height: 12),
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
            TextButton(
              onPressed: _cancelSos,
              child: const Text(
                'Hủy',
                style: TextStyle(fontSize: 18, color: AppColors.textSecondary),
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
                      spreadRadius: 8,
                    ),
                  ],
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.sos, color: Colors.white, size: 48),
                    SizedBox(height: 4),
                    Text(
                      'SOS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Nhấn khi cần giúp đỡ khẩn cấp',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHealthSummary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Chỉ số hôm nay',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _HealthCard(
              icon: Icons.favorite,
              iconColor: AppColors.error,
              label: 'Huyết áp',
              value: '120/80',
              unit: 'mmHg',
            ),
            const SizedBox(width: 10),
            _HealthCard(
              icon: Icons.water_drop,
              iconColor: const Color(0xFF1565C0),
              label: 'Đường huyết',
              value: '5.5',
              unit: 'mmol/L',
            ),
            const SizedBox(width: 10),
            _HealthCard(
              icon: Icons.monitor_heart,
              iconColor: AppColors.secondary,
              label: 'Nhịp tim',
              value: '72',
              unit: 'bpm',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTodayMedications() {
    final meds = [
      _MedItem('Amlodipine 5mg', '07:00', true),
      _MedItem('Metformin 500mg', '12:00', false),
      _MedItem('Atorvastatin 20mg', '21:00', false),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Thuốc hôm nay',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        ...meds.map((m) => _MedicationTile(item: m)),
      ],
    );
  }

  String _formatDate() {
    final now = DateTime.now();
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    return '${days[now.weekday - 1]}, ${now.day}/${now.month}/${now.year}';
  }
}

class _HealthCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final String unit;

  const _HealthCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.unit,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
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
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            Text(unit,
                style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _MedItem {
  final String name;
  final String time;
  final bool taken;
  _MedItem(this.name, this.time, this.taken);
}

class _MedicationTile extends StatelessWidget {
  final _MedItem item;

  const _MedicationTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: item.taken ? AppColors.success.withOpacity(0.3) : AppColors.textHint.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.medication,
            color: item.taken ? AppColors.success : AppColors.textHint,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              item.name,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: item.taken ? AppColors.textSecondary : AppColors.textPrimary,
                decoration: item.taken ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
          Text(
            item.time,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          const SizedBox(width: 8),
          if (item.taken)
            const Icon(Icons.check_circle, color: AppColors.success, size: 20)
          else
            const Icon(Icons.circle_outlined, color: AppColors.textHint, size: 20),
        ],
      ),
    );
  }
}
