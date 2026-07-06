import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/notification_settings_provider.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends ConsumerState<NotificationSettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(notificationSettingsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Notification Settings',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: settings.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildSection(
                  title: 'Alert Types',
                  children: [
                    _ToggleTile(
                      icon: Icons.medication,
                      iconColor: AppColors.primary,
                      title: 'Medication Reminders',
                      subtitle:
                          'Get notified when it\'s time to take medication',
                      value: settings.medicationReminders,
                      onChanged: (v) => ref
                          .read(notificationSettingsProvider.notifier)
                          .setMedicationReminders(v),
                    ),
                    _ToggleTile(
                      icon: Icons.health_and_safety,
                      iconColor: AppColors.error,
                      title: 'Health Alerts',
                      subtitle:
                          'Get notified when health metrics are abnormal',
                      value: settings.healthAlerts,
                      onChanged: (v) => ref
                          .read(notificationSettingsProvider.notifier)
                          .setHealthAlerts(v),
                    ),
                    _ToggleTile(
                      icon: Icons.sos,
                      iconColor: AppColors.sosPrimary,
                      title: 'SOS Emergency Alerts',
                      subtitle:
                          'Always enabled — SOS alerts cannot be turned off',
                      value: true,
                      enabled: false,
                      onChanged: (_) {},
                    ),
                    _ToggleTile(
                      icon: Icons.auto_awesome,
                      iconColor: AppColors.secondary,
                      title: 'Weekly Health Report',
                      subtitle:
                          'Receive a weekly summary every Sunday evening',
                      value: settings.weeklyReport,
                      onChanged: (v) => ref
                          .read(notificationSettingsProvider.notifier)
                          .setWeeklyReport(v),
                    ),
                    _ToggleTile(
                      icon: Icons.event,
                      iconColor: AppColors.warning,
                      title: 'Appointment Reminders',
                      subtitle:
                          'Get reminded 1 day and 2 hours before appointments',
                      value: settings.appointmentReminders,
                      onChanged: (v) => ref
                          .read(notificationSettingsProvider.notifier)
                          .setAppointmentReminders(v),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _buildSection(
                  title: 'Quiet Hours',
                  subtitle:
                      'During quiet hours, only SOS alerts will be delivered',
                  children: [
                    _ToggleTile(
                      icon: Icons.nightlight_round,
                      iconColor: const Color(0xFF7B1FA2),
                      title: 'Do Not Disturb',
                      subtitle: settings.quietHoursEnabled
                          ? '${settings.quietStart} – ${settings.quietEnd}'
                          : 'All notifications delivered normally',
                      value: settings.quietHoursEnabled,
                      onChanged: (v) => ref
                          .read(notificationSettingsProvider.notifier)
                          .setQuietHoursEnabled(v),
                    ),
                    if (settings.quietHoursEnabled) ...[
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Expanded(
                              child: _TimePickerTile(
                                label: 'Start',
                                time: settings.quietStart,
                                onTap: () => _pickTime(
                                  context,
                                  settings.quietStart,
                                  (t) => ref
                                      .read(notificationSettingsProvider
                                          .notifier)
                                      .setQuietStart(t),
                                ),
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 12),
                              child: Text('to',
                                  style: TextStyle(
                                      color: AppColors.textSecondary)),
                            ),
                            Expanded(
                              child: _TimePickerTile(
                                label: 'End',
                                time: settings.quietEnd,
                                onTap: () => _pickTime(
                                  context,
                                  settings.quietEnd,
                                  (t) => ref
                                      .read(notificationSettingsProvider
                                          .notifier)
                                      .setQuietEnd(t),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 20),
                _buildSection(
                  title: 'Channels',
                  subtitle: 'Choose how you want to receive notifications',
                  children: [
                    _ToggleTile(
                      icon: Icons.notifications_active,
                      iconColor: AppColors.primary,
                      title: 'Push Notifications',
                      subtitle: 'Receive alerts directly on your phone',
                      value: settings.pushEnabled,
                      onChanged: (v) => ref
                          .read(notificationSettingsProvider.notifier)
                          .setPushEnabled(v),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
    );
  }

  Future<void> _pickTime(
      BuildContext context, String current, Function(String) onSet) async {
    final parts = current.split(':');
    final initial = TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 22,
      minute: int.tryParse(parts[1]) ?? 0,
    );
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked != null && context.mounted) {
      onSet(
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}');
    }
  }

  Widget _buildSection({
    required String title,
    String? subtitle,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 4),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textHint,
              ),
            ),
          ),
        ],
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool value;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  const _ToggleTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(enabled ? 0.1 : 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon,
                color: enabled ? iconColor : AppColors.textHint, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: enabled
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppColors.textHint,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Switch(
            value: value,
            onChanged: enabled ? onChanged : null,
            activeThumbColor: AppColors.primary,
          ),
        ],
      ),
    );
  }
}

class _TimePickerTile extends StatelessWidget {
  final String label;
  final String time;
  final VoidCallback onTap;

  const _TimePickerTile({
    required this.label,
    required this.time,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.textHint.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.access_time, color: AppColors.primary, size: 18),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: AppColors.textHint, fontSize: 10)),
                Text(time,
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
