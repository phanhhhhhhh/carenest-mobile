import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/elderly_provider.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ElderlyEditProfileScreen extends ConsumerStatefulWidget {
  const ElderlyEditProfileScreen({super.key});

  @override
  ConsumerState<ElderlyEditProfileScreen> createState() =>
      _ElderlyEditProfileScreenState();
}

class _ElderlyEditProfileScreenState
    extends ConsumerState<ElderlyEditProfileScreen> {
  final _nameCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _conditionCtrl = TextEditingController();
  final List<String> _conditions = [];
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final name = await SecureStorage.getName();
    _nameCtrl.text = name ?? '';

    final profile = ref.read(elderlyProfileProvider).profile;
    if (profile != null) {
      _notesCtrl.text = profile.notes ?? '';
      _conditions.addAll(profile.healthConditions);
    }
    if (mounted) setState(() {});
  }

  void _addCondition() {
    final text = _conditionCtrl.text.trim();
    if (text.isNotEmpty && !_conditions.contains(text)) {
      setState(() {
        _conditions.add(text);
        _conditionCtrl.clear();
      });
    }
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      final userId = await SecureStorage.getUserId();
      if (userId == null) return;

      final dio = ref.read(dioProvider);
      await dio.put('/elderly-profiles/$userId', data: {
        'userName': _nameCtrl.text.trim(),
        'healthConditions': _conditions,
        'notes': _notesCtrl.text.trim(),
      });

      // Save name locally
      if (_nameCtrl.text.trim().isNotEmpty) {
        await SecureStorage.saveName(_nameCtrl.text.trim());
      }

      // Reload profile
      ref.read(elderlyProfileProvider.notifier).load();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã cập nhật hồ sơ'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.message}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _notesCtrl.dispose();
    _conditionCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Chỉnh sửa hồ sơ',
            style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Lưu',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600,
                        color: AppColors.primary)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildAvatarSection(),
            const SizedBox(height: 28),
            _buildFormSection(),
            const SizedBox(height: 20),
            _buildConditionsSection(),
            const SizedBox(height: 20),
            _buildNotesSection(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarSection() {
    return Center(
      child: Stack(
        children: [
          CircleAvatar(
            radius: 55,
            backgroundColor: AppColors.primary.withOpacity(0.1),
            child: const Icon(Icons.person, size: 64, color: AppColors.primary),
          ),
          Positioned(
            right: 0, bottom: 0,
            child: Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.surface, width: 3),
              ),
              child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormSection() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Thông tin cá nhân',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          TextField(
            controller: _nameCtrl,
            decoration: InputDecoration(
              labelText: 'Họ và tên',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              prefixIcon: const Icon(Icons.person, color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            enabled: false,
            decoration: InputDecoration(
              labelText: 'Số điện thoại',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              prefixIcon: const Icon(Icons.phone, color: AppColors.textHint),
              hintText: 'Liên kết qua Firebase',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConditionsSection() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tình trạng sức khỏe',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _conditionCtrl,
                  onSubmitted: (_) => _addCondition(),
                  decoration: InputDecoration(
                    labelText: 'Thêm bệnh lý',
                    hintText: 'VD: Tiểu đường, Cao huyết áp...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _addCondition,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Thêm'),
              ),
            ],
          ),
          if (_conditions.isNotEmpty) ...[
            const SizedBox(height: 14),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: _conditions.map((c) => Chip(
                    label: Text(c, style: const TextStyle(fontSize: 13)),
                    deleteIcon: const Icon(Icons.close, size: 16),
                    onDeleted: () => setState(() => _conditions.remove(c)),
                    backgroundColor: AppColors.primary.withOpacity(0.08),
                    deleteIconColor: AppColors.textSecondary,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20)),
                  )).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildNotesSection() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Ghi chú y tế',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          TextField(
            controller: _notesCtrl,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'Ghi chú thêm',
              hintText: 'VD: Dị ứng thuốc, lưu ý đặc biệt...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              alignLabelWithHint: true,
            ),
          ),
        ],
      ),
    );
  }
}
