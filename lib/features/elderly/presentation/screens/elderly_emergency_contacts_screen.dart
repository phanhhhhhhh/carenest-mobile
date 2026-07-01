import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ElderlyEmergencyContactsScreen extends ConsumerStatefulWidget {
  const ElderlyEmergencyContactsScreen({super.key});

  @override
  ConsumerState<ElderlyEmergencyContactsScreen> createState() =>
      _ElderlyEmergencyContactsScreenState();
}

class _ElderlyEmergencyContactsScreenState
    extends ConsumerState<ElderlyEmergencyContactsScreen> {
  List<_Contact> _contacts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    setState(() => _isLoading = true);
    try {
      final dio = ref.read(dioProvider);
      final userId = await SecureStorage.getUserId();
      if (userId == null) return;

      final resp = await dio.get('/elderly-profiles/$userId');
      final data = resp.data as Map<String, dynamic>;
      final emergencyContacts = data['emergencyContacts'] as List<dynamic>? ?? [];
      _contacts = emergencyContacts
          .map((c) => _Contact(
                id: c['id']?.toString(),
                name: c['name'] as String? ?? '',
                phone: c['phone'] as String? ?? '',
                relationship: c['relationship'] as String? ?? '',
              ))
          .toList();
    } catch (_) {
      // If API fails, use empty list
    }
    if (mounted) setState(() => _isLoading = false);
  }

  void _showAddDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final relationshipCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Thêm liên hệ khẩn cấp',
            style: TextStyle(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                labelText: 'Họ và tên',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.person, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Số điện thoại',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.phone, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: relationshipCtrl,
              decoration: InputDecoration(
                labelText: 'Quan hệ (VD: Con trai, Bác sĩ...)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.people, color: AppColors.primary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              if (nameCtrl.text.trim().isNotEmpty &&
                  phoneCtrl.text.trim().isNotEmpty) {
                try {
                  final dio = ref.read(dioProvider);
                  final userId = await SecureStorage.getUserId();
                  await dio.put('/elderly-profiles/$userId', data: {
                    'emergencyContacts': [
                      ..._contacts.map((c) => {
                            if (c.id != null) 'id': c.id,
                            'name': c.name,
                            'phone': c.phone,
                            'relationship': c.relationship,
                          }),
                      {
                        'name': nameCtrl.text.trim(),
                        'phone': phoneCtrl.text.trim(),
                        'relationship': relationshipCtrl.text.trim(),
                      },
                    ],
                  });
                  Navigator.pop(ctx);
                  _loadContacts();
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text('Lỗi: $e'),
                          backgroundColor: AppColors.error),
                    );
                  }
                }
              }
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  Future<void> _removeContact(int index) async {
    final contact = _contacts[index];
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa liên hệ?'),
        content: Text('Bạn muốn xóa ${contact.name} khỏi danh sách khẩn cấp?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xóa', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final dio = ref.read(dioProvider);
        final userId = await SecureStorage.getUserId();
        final remaining = _contacts
            .where((c) => c.id != contact.id || c.name != contact.name)
            .map((c) => {
                  if (c.id != null) 'id': c.id,
                  'name': c.name,
                  'phone': c.phone,
                  'relationship': c.relationship,
                })
            .toList();
        await dio.put('/elderly-profiles/$userId', data: {
          'emergencyContacts': remaining,
        });
        _loadContacts();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Liên hệ khẩn cấp',
            style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _contacts.isEmpty
              ? _buildEmptyState()
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: AppColors.sosLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.sosPrimary.withOpacity(0.2)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: AppColors.sosPrimary, size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Những người này sẽ được thông báo khi bạn nhấn nút SOS.',
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                    ..._contacts.asMap().entries.map((entry) =>
                        _ContactCard(
                          contact: entry.value,
                          index: entry.key,
                          onDelete: () => _removeContact(entry.key),
                        )),
                  ],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Thêm liên hệ'),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.contact_emergency,
                  color: AppColors.primary, size: 40),
            ),
            const SizedBox(height: 20),
            const Text('Chưa có liên hệ khẩn cấp',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            const Text(
              'Thêm ít nhất một người để nhận\nthông báo khi bạn cần giúp đỡ.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showAddDialog,
              icon: const Icon(Icons.add),
              label: const Text('Thêm liên hệ'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Contact {
  final String? id;
  final String name;
  final String phone;
  final String relationship;
  const _Contact({
    this.id,
    required this.name,
    required this.phone,
    required this.relationship,
  });
}

class _ContactCard extends StatelessWidget {
  final _Contact contact;
  final int index;
  final VoidCallback onDelete;

  const _ContactCard({
    required this.contact,
    required this.index,
    required this.onDelete,
  });

  IconData _relationIcon() {
    switch (contact.relationship.toLowerCase()) {
      case 'con trai':
      case 'con gái':
      case 'con':
        return Icons.child_care;
      case 'vợ':
      case 'chồng':
        return Icons.favorite;
      case 'bác sĩ':
        return Icons.medical_services;
      default:
        return Icons.person;
    }
  }

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
              blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: (index == 0)
                  ? AppColors.primary.withOpacity(0.1)
                  : AppColors.secondary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              _relationIcon(),
              color: index == 0 ? AppColors.primary : AppColors.secondary,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(contact.name,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 2),
                Text(contact.phone,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                if (contact.relationship.isNotEmpty)
                  Text(contact.relationship,
                      style: const TextStyle(color: AppColors.textHint, fontSize: 12)),
              ],
            ),
          ),
          if (index == 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('Ưu tiên',
                  style: TextStyle(color: AppColors.primary, fontSize: 11,
                      fontWeight: FontWeight.w600)),
            ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: onDelete,
            icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
          ),
        ],
      ),
    );
  }
}
