import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function BindCameraModal({
  visible,
  sn,
  label,
  onChangeSn,
  onChangeLabel,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  sn: string;
  label: string;
  onChangeSn: (v: string) => void;
  onChangeLabel: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Liên kết camera</Text>
          <View style={{ height: 12 }} />
          <Text style={styles.dialogBody}>Nhập số seri camera (SN thiết bị) và một nhãn.</Text>
          <View style={{ height: 16 }} />
          <View style={styles.inputWrap}>
            <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="Số seri thiết bị (VD: 5L0A1B2C3D4E5F6G)"
              placeholderTextColor={Colors.textHint}
              value={sn}
              onChangeText={onChangeSn}
            />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.inputWrap}>
            <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="Nhãn (tùy chọn) (VD: Phòng khách)"
              placeholderTextColor={Colors.textHint}
              value={label}
              onChangeText={onChangeLabel}
            />
          </View>
          <View style={{ height: 20 }} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Hủy</Text>
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity style={styles.dialogApplyBtn} onPress={onConfirm}>
              <Text style={styles.dialogApplyText}>Liên kết</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmUnbindModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Xóa camera?</Text>
          <View style={{ height: 12 }} />
          <Text style={styles.dialogBody}>Thao tác này sẽ ngắt kết nối camera khỏi tài khoản.</Text>
          <View style={{ height: 20 }} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Hủy</Text>
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity
              style={[styles.dialogApplyBtn, { backgroundColor: Colors.error }]}
              onPress={onConfirm}
            >
              <Text style={styles.dialogApplyText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function CameraMenuModal({
  visible,
  onClose,
  onTogglePrivacy,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onTogglePrivacy: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={onTogglePrivacy}>
            <Ionicons name="eye-off-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.menuItemText}>Bật/tắt chế độ riêng tư</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
            <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
            <Text style={[styles.menuItemText, { color: Colors.error }]}>Xóa camera</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function PtzControlModal({
  visible,
  onClose,
  onMove,
}: {
  visible: boolean;
  onClose: () => void;
  onMove: (direction: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.ptzSheet}>
          <Text style={styles.ptzTitle}>Xoay camera</Text>
          <View style={{ height: 20 }} />
          <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => onMove('UP')}>
            <Ionicons name="chevron-up" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.ptzMiddleRow}>
            <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => onMove('LEFT')}>
              <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ width: 40 }} />
            <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => onMove('RIGHT')}>
              <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.ptzArrowBtn} onPress={() => onMove('DOWN')}>
            <Ionicons name="chevron-down" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ height: 12 }} />
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.ptzCloseText}>Đóng</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  dialogBody: { color: Colors.textSecondary, fontSize: 13 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  dialogCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  dialogCancelText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  dialogApplyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dialogApplyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'flex-end',
    padding: 24,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 190,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: { fontSize: 14, color: Colors.textPrimary },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  ptzSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ptzTitle: { fontWeight: '700', fontSize: 16, color: Colors.textPrimary },
  ptzMiddleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ptzArrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(46,125,154,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  ptzCloseText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
});
