import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/appointment_provider.dart';

class FamilyAppointmentsScreen extends ConsumerStatefulWidget {
  const FamilyAppointmentsScreen({super.key});

  @override
  ConsumerState<FamilyAppointmentsScreen> createState() =>
      _FamilyAppointmentsScreenState();
}

class _FamilyAppointmentsScreenState
    extends ConsumerState<FamilyAppointmentsScreen>
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

  static const _statusLabels = {
    'SCHEDULED': 'Upcoming',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
    'RESCHEDULED': 'Rescheduled',
  };

  static const _statusColors = {
    'SCHEDULED': AppColors.primary,
    'COMPLETED': AppColors.success,
    'CANCELLED': AppColors.error,
    'RESCHEDULED': AppColors.warning,
  };

  Color _statusColor(String status) =>
      _statusColors[status] ?? AppColors.textHint;

  String _statusLabel(String status) =>
      _statusLabels[status] ?? status;

  String _formatDate(DateTime dt) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${weekDays[dt.weekday - 1]}, ${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  void _showAppointmentSheet({AppointmentItem? existing}) {
    final isEdit = existing != null;
    final doctorCtrl = TextEditingController(text: existing?.doctor ?? '');
    final specialtyCtrl =
        TextEditingController(text: existing?.specialty ?? '');
    final locationCtrl = TextEditingController(text: existing?.location ?? '');
    final notesCtrl = TextEditingController(text: existing?.notes ?? '');
    DateTime selectedDate =
        existing?.appointmentDate ?? DateTime.now().add(const Duration(days: 1));
    TimeOfDay selectedTime = TimeOfDay.fromDateTime(selectedDate);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Center(
                  child: SizedBox(
                    width: 40,
                    child: Divider(thickness: 3, color: AppColors.textHint),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  isEdit ? 'Edit appointment' : 'Add new appointment',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 20),
                // Doctor name
                TextField(
                  controller: doctorCtrl,
                  decoration: InputDecoration(
                    labelText: 'Doctor name',
                    hintText: 'e.g., Dr. Smith',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.person,
                        color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 14),
                // Specialty
                TextField(
                  controller: specialtyCtrl,
                  decoration: InputDecoration(
                    labelText: 'Specialty',
                    hintText: 'e.g., Cardiology',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.local_hospital,
                        color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 14),
                // Location
                TextField(
                  controller: locationCtrl,
                  decoration: InputDecoration(
                    labelText: 'Location (optional)',
                    hintText: 'e.g., City Hospital',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.location_on,
                        color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 14),
                // Date picker
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: ctx,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now()
                          .add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setSheetState(() => selectedDate = picked);
                    }
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.textHint.withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today,
                            color: AppColors.primary, size: 20),
                        const SizedBox(width: 12),
                        Text(
                          _formatDate(selectedDate),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        const Icon(Icons.chevron_right,
                            color: AppColors.textHint),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                // Time picker
                InkWell(
                  onTap: () async {
                    final picked = await showTimePicker(
                      context: ctx,
                      initialTime: selectedTime,
                    );
                    if (picked != null) {
                      setSheetState(() => selectedTime = picked);
                    }
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.textHint.withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.access_time,
                            color: AppColors.primary, size: 20),
                        const SizedBox(width: 12),
                        Text(
                          _formatTime(
                            DateTime(2024, 1, 1, selectedTime.hour, selectedTime.minute),
                          ),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        const Icon(Icons.chevron_right,
                            color: AppColors.textHint),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                // Notes
                TextField(
                  controller: notesCtrl,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: 'Notes (optional)',
                    hintText: 'e.g., Fast before test',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.notes,
                        color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 20),
                // Submit button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () async {
                      if (doctorCtrl.text.trim().isEmpty ||
                          specialtyCtrl.text.trim().isEmpty) {
                        return;
                      }
                      final notifier =
                          ref.read(appointmentProvider.notifier);
                      final combined = DateTime(
                        selectedDate.year,
                        selectedDate.month,
                        selectedDate.day,
                        selectedTime.hour,
                        selectedTime.minute,
                      );
                      bool ok;
                      if (isEdit) {
                        ok = await notifier.update(
                          appointmentId: existing.id,
                          doctor: doctorCtrl.text.trim(),
                          specialty: specialtyCtrl.text.trim(),
                          location: locationCtrl.text.trim().isNotEmpty
                              ? locationCtrl.text.trim()
                              : null,
                          appointmentDate: combined,
                          notes: notesCtrl.text.trim().isNotEmpty
                              ? notesCtrl.text.trim()
                              : null,
                        );
                      } else {
                        ok = await notifier.create(
                          doctor: doctorCtrl.text.trim(),
                          specialty: specialtyCtrl.text.trim(),
                          location: locationCtrl.text.trim().isNotEmpty
                              ? locationCtrl.text.trim()
                              : null,
                          appointmentDate: combined,
                          notes: notesCtrl.text.trim().isNotEmpty
                              ? notesCtrl.text.trim()
                              : null,
                        );
                      }
                      if (ok && ctx.mounted) Navigator.pop(ctx);
                    },
                    child: Text(
                      isEdit ? 'Update' : 'Add appointment',
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmDelete(AppointmentItem item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete appointment'),
        content: Text(
            'Are you sure you want to delete the appointment with "${item.doctor}"?'),
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
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(appointmentProvider.notifier).delete(item.id);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _updateStatus(AppointmentItem item, String newStatus) {
    ref.read(appointmentProvider.notifier).updateStatus(item.id, newStatus);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appointmentProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Appointments',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textHint,
          labelStyle:
              const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          tabs: [
            Tab(
              text:
                  'Upcoming (${state.upcoming.length})',
            ),
            Tab(
              text: 'Past (${state.past.length})',
            ),
          ],
        ),
      ),
      body: state.isLoading && state.appointments.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.appointments.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.textHint, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        state.error!,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () =>
                            ref.read(appointmentProvider.notifier).load(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildList(state.upcoming, showActions: true),
                    _buildList(state.past, showActions: false),
                  ],
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAppointmentSheet(),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildList(List<AppointmentItem> items, {required bool showActions}) {
    if (items.isEmpty) {
      return ListView(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 60),
            child: const Column(
              children: [
                Icon(Icons.event_note, color: AppColors.textHint, size: 56),
                SizedBox(height: 12),
                Text(
                  'No appointments yet',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 15,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Tap + to add appointment',
                  style: TextStyle(
                    color: AppColors.textHint,
                    fontSize: 13,
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
          ref.read(appointmentProvider.notifier).load(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (_, i) => _AppointmentCard(
          item: items[i],
          showActions: showActions,
          statusColor: _statusColor(items[i].status),
          statusLabel: _statusLabel(items[i].status),
          formatDate: _formatDate,
          formatTime: _formatTime,
          onEdit: () => _showAppointmentSheet(existing: items[i]),
          onDelete: () => _confirmDelete(items[i]),
          onComplete: () => _updateStatus(items[i], 'COMPLETED'),
          onCancel: () => _updateStatus(items[i], 'CANCELLED'),
          onReschedule: () => _showAppointmentSheet(existing: items[i]),
        ),
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final AppointmentItem item;
  final bool showActions;
  final Color statusColor;
  final String statusLabel;
  final String Function(DateTime) formatDate;
  final String Function(DateTime) formatTime;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onComplete;
  final VoidCallback onCancel;
  final VoidCallback onReschedule;

  const _AppointmentCard({
    required this.item,
    required this.showActions,
    required this.statusColor,
    required this.statusLabel,
    required this.formatDate,
    required this.formatTime,
    required this.onEdit,
    required this.onDelete,
    required this.onComplete,
    required this.onCancel,
    required this.onReschedule,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: statusColor.withValues(alpha: 0.2),
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
          // Header: doctor + status badge
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.event, color: statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.doctor,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (item.specialty.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        item.specialty,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Details
          _DetailRow(
              icon: Icons.calendar_today,
              text: formatDate(item.appointmentDate)),
          const SizedBox(height: 6),
          _DetailRow(
              icon: Icons.access_time,
              text: formatTime(item.appointmentDate)),
          if (item.location != null && item.location!.isNotEmpty) ...[
            const SizedBox(height: 6),
            _DetailRow(icon: Icons.location_on, text: item.location!),
          ],
          if (item.notes != null && item.notes!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                item.notes!,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
          // Action buttons
          if (showActions) ...[
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Left: edit + delete
                Row(
                  children: [
                    _ActionChip(
                      icon: Icons.edit,
                      label: 'Edit',
                      color: AppColors.primary,
                      onTap: onEdit,
                    ),
                    const SizedBox(width: 8),
                    _ActionChip(
                      icon: Icons.delete_outline,
                      label: 'Delete',
                      color: AppColors.error,
                      onTap: onDelete,
                    ),
                  ],
                ),
                // Right: status actions
                Row(
                  children: [
                    _ActionChip(
                      icon: Icons.check_circle_outline,
                      label: 'Completed',
                      color: AppColors.success,
                      onTap: onComplete,
                    ),
                    const SizedBox(width: 8),
                    _ActionChip(
                      icon: Icons.cancel_outlined,
                      label: 'Cancel',
                      color: AppColors.warning,
                      onTap: onCancel,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _DetailRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.textHint, size: 15),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 14),
            const SizedBox(width: 4),
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

