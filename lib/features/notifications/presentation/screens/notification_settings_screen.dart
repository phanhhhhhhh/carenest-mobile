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
        title: const Text('Notification Settings',
            style: TextStyle(
                fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: settings.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildSection(title: 'Alert Types', children: [
                  _ToggleTile(
                    icon: Icons.medication,
                    iconColor: AppColors.primary,
                    title: 'Medication Reminders',
                    subtitle: 'Get notified when it\'s time to take medication',
                    value: settings.medicationReminder,
                    onChanged: (v) => ref
                        .read(notificationSettingsProvider.notifier)
                        .setMedicationReminder(v),
                  ),
                  if (settings.medicationReminder)
                    _ReminderMinutesTile(
                      value: settings.reminderMinutesBefore,
                      onChanged: (v) => ref
                          .read(notificationSettingsProvider.notifier)
                          .setReminderMinutes(v),
                    ),
                  _ToggleTile(
                    icon: Icons.health_and_safety,
                    iconColor: AppColors.error,
                    title: 'Health Alerts',
                    subtitle: 'Get notified when health metrics are abnormal',
                    value: settings.healthAlert,
                    onChanged: (v) => ref
                        .read(notificationSettingsProvider.notifier)
                        .setHealthAlert(v),
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
                    icon: Icons.people,
                    iconColor: AppColors.secondary,
                    title: 'Family Updates',
                    subtitle:
                        'Get notified about family link requests and status changes',
                    value: settings.familyUpdate,
                    onChanged: (v) => ref
                        .read(notificationSettingsProvider.notifier)
                        .setFamilyUpdate(v),
                  ),
                ]),
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
                          ? '${settings.quietHoursStart} – ${settings.quietHoursEnd}'
                          : 'All notifications delivered normally',
                      value: settings.quietHoursEnabled,
                      onChanged: (v) {
                        if (v) {
                          // enable with defaults
                          ref
                              .read(notificationSettingsProvider.notifier)
                              .setQuietHoursStart('22:00');
                          ref
                              .read(notificationSettingsProvider.notifier)
                              .setQuietHoursEnd('07:00');
                        } else {
                          // disable by clearing
                          ref
                              .read(notificationSettingsProvider.notifier)
                              .setQuietHoursStart('');
                          ref
                              .read(notificationSettingsProvider.notifier)
                              .setQuietHoursEnd('');
                        }
                      },
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
                                time: settings.quietHoursStart,
                                onTap: () => _pickTime(
                                  settings.quietHoursStart,
                                  (t) => ref
                                      .read(notificationSettingsProvider
                                          .notifier)
                                      .setQuietHoursStart(t),
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
                                time: settings.quietHoursEnd,
                                onTap: () => _pickTime(
                                  settings.quietHoursEnd,
                                  (t) => ref
                                      .read(notificationSettingsProvider
                                          .notifier)
                                      .setQuietHoursEnd(t),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
    );
  }

  Future<void> _pickTime(String current, Function(String) onSet) async {
    final parts = current.split(':');
    final initial = TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 22,
      minute: int.tryParse(parts[1]) ?? 0,
    );
    final picked =
        await showTimePicker(context: context, initialTime: initial);
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
          child: Text(title,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5)),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(subtitle,
                style:
                    const TextStyle(fontSize: 12, color: AppColors.textHint)),
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
                Text(title,
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: enabled
                            ? AppColors.textPrimary
                            : AppColors.textSecondary)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: const TextStyle(
                        color: AppColors.textHint, fontSize: 12)),
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

class _ReminderMinutesTile extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;

  const _ReminderMinutesTile({
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final options = [5, 10, 15, 30, 60];
    return Padding(
      padding: const EdgeInsets.only(left: 70, right: 16, bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.timer, color: AppColors.textHint, size: 16),
          const SizedBox(width: 8),
          const Text('Remind before:',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.textHint.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                value: options.contains(value) ? value : 15,
                isDense: true,
                style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600),
                items: options
                    .map((m) => DropdownMenuItem(
                        value: m,
                        child: Text('$m min',
                            style: const TextStyle(fontSize: 13))))
                    .toList(),
                onChanged: (v) {
                  if (v != null) onChanged(v);
                },
              ),
            ),
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
