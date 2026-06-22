import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class ElderlyMedicationScreen extends StatefulWidget {
  const ElderlyMedicationScreen({super.key});

  @override
  State<ElderlyMedicationScreen> createState() =>
      _ElderlyMedicationScreenState();
}

class _ElderlyMedicationScreenState extends State<ElderlyMedicationScreen> {
  final _meds = [
    _MedData('Amlodipine', '5mg', ['07:00', '19:00'], 'Cao huyết áp',
        Icons.favorite, AppColors.error),
    _MedData('Metformin', '500mg', ['08:00', '12:00', '18:00'], 'Tiểu đường',
        Icons.water_drop, const Color(0xFF1565C0)),
    _MedData('Atorvastatin', '20mg', ['21:00'], 'Mỡ máu', Icons.biotech,
        AppColors.warning),
  ];

  // key: "MedName|HH:mm" → taken
  final Set<String> _taken = {};

  int get _totalDoses =>
      _meds.fold(0, (sum, m) => sum + m.times.length);

  int get _takenDoses => _taken.length;

  void _toggle(String key) {
    setState(() {
      if (_taken.contains(key)) {
        _taken.remove(key);
      } else {
        _taken.add(key);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Thuốc của tôi'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildTodayProgress(),
          const SizedBox(height: 16),
          const Text(
            'Danh sách thuốc',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ..._meds.map((m) => _MedCard(
                data: m,
                taken: _taken,
                onToggle: _toggle,
              )),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Thêm thuốc'),
      ),
    );
  }

  Widget _buildTodayProgress() {
    final progress =
        _totalDoses == 0 ? 0.0 : _takenDoses / _totalDoses;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Hôm nay',
              style: TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 4),
          Text(
            'Đã uống $_takenDoses/$_totalDoses liều',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation(Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class _MedData {
  final String name;
  final String dose;
  final List<String> times;
  final String purpose;
  final IconData icon;
  final Color color;

  _MedData(this.name, this.dose, this.times, this.purpose, this.icon,
      this.color);

  String get schedule => times.join(' & ');
}

class _MedCard extends StatelessWidget {
  final _MedData data;
  final Set<String> taken;
  final void Function(String key) onToggle;

  const _MedCard({
    required this.data,
    required this.taken,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
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
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: data.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(data.icon, color: data.color, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${data.name} ${data.dose}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(data.purpose,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.access_time,
                            size: 12, color: AppColors.textHint),
                        const SizedBox(width: 4),
                        Text(data.schedule,
                            style: const TextStyle(
                                color: AppColors.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 8),
          Row(
            children: data.times
                .map((time) => _DoseChip(
                      time: time,
                      taken: taken.contains('${data.name}|$time'),
                      onTap: () => onToggle('${data.name}|$time'),
                    ))
                .expand((w) => [w, const SizedBox(width: 8)])
                .toList()
              ..removeLast(),
          ),
        ],
      ),
    );
  }
}

class _DoseChip extends StatelessWidget {
  final String time;
  final bool taken;
  final VoidCallback onTap;

  const _DoseChip({
    required this.time,
    required this.taken,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color:
              taken ? AppColors.success.withOpacity(0.1) : AppColors.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: taken ? AppColors.success : AppColors.textHint,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              taken ? Icons.check_circle : Icons.circle_outlined,
              size: 14,
              color: taken ? AppColors.success : AppColors.textHint,
            ),
            const SizedBox(width: 4),
            Text(
              time,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: taken ? AppColors.success : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
