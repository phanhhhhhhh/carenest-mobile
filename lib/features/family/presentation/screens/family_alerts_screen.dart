import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class FamilyAlertsScreen extends StatelessWidget {
  const FamilyAlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final alerts = [
      _AlertData(
        type: _AlertType.missedDose,
        title: 'Bỏ lỡ liều thuốc',
        body: 'Nguyễn Văn An chưa uống Metformin 500mg lúc 12:00',
        time: '12:32 hôm nay',
        isNew: true,
      ),
      _AlertData(
        type: _AlertType.healthWarning,
        title: 'Chỉ số bất thường',
        body: 'Huyết áp tăng cao: 155/95 mmHg (ngưỡng bình thường: <140/90)',
        time: 'Hôm qua, 09:15',
        isNew: false,
      ),
      _AlertData(
        type: _AlertType.sos,
        title: 'SOS đã được gửi',
        body: 'Nguyễn Văn An đã bấm nút SOS. Đã xác nhận lúc 15:05.',
        time: '3 ngày trước',
        isNew: false,
        resolved: true,
      ),
      _AlertData(
        type: _AlertType.info,
        title: 'Nhắc lịch khám',
        body: 'Lịch khám tim mạch tại BV Bình Dân vào ngày 25/06 lúc 08:30',
        time: '4 ngày trước',
        isNew: false,
      ),
    ];

    final newCount = alerts.where((a) => a.isNew).length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Cảnh báo'),
            if (newCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$newCount mới',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ],
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Đánh dấu đã đọc',
                style: TextStyle(color: AppColors.primary, fontSize: 12)),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: alerts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (ctx, i) => _AlertCard(data: alerts[i]),
      ),
    );
  }
}

enum _AlertType { missedDose, healthWarning, sos, info }

class _AlertData {
  final _AlertType type;
  final String title;
  final String body;
  final String time;
  final bool isNew;
  final bool resolved;

  _AlertData({
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    this.isNew = false,
    this.resolved = false,
  });
}

class _AlertCard extends StatelessWidget {
  final _AlertData data;

  const _AlertCard({required this.data});

  Color get _iconColor {
    switch (data.type) {
      case _AlertType.missedDose:
        return AppColors.warning;
      case _AlertType.healthWarning:
        return AppColors.error;
      case _AlertType.sos:
        return AppColors.sosPrimary;
      case _AlertType.info:
        return AppColors.primary;
    }
  }

  IconData get _icon {
    switch (data.type) {
      case _AlertType.missedDose:
        return Icons.medication_liquid;
      case _AlertType.healthWarning:
        return Icons.warning_amber;
      case _AlertType.sos:
        return Icons.sos;
      case _AlertType.info:
        return Icons.calendar_today;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: data.isNew
            ? _iconColor.withOpacity(0.05)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: data.isNew
            ? Border.all(color: _iconColor.withOpacity(0.3))
            : null,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_icon, color: _iconColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        data.title,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: data.resolved
                              ? AppColors.textSecondary
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (data.isNew)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                            color: AppColors.error, shape: BoxShape.circle),
                      ),
                    if (data.resolved)
                      const Icon(Icons.check_circle_outline,
                          color: AppColors.success, size: 16),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  data.body,
                  style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.4),
                ),
                const SizedBox(height: 6),
                Text(
                  data.time,
                  style: const TextStyle(
                      color: AppColors.textHint, fontSize: 11),
                ),
                if (data.type == _AlertType.missedDose && data.isNew) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Gọi điện', style: TextStyle(fontSize: 12)),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () {},
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.textSecondary,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Bỏ qua', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
