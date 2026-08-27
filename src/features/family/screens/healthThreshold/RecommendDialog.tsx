import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function RecommendDialog({
  visible,
  onCancel,
  onApply,
}: {
  visible: boolean;
  onCancel: () => void;
  onApply: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialog}>
          <View style={styles.dialogTitleRow}>
            <Ionicons name="sparkles" size={24} color={Colors.primary} />
            <View style={{ width: 8 }} />
            <Text style={styles.dialogTitle}>Đề xuất từ AI</Text>
          </View>
          <View style={{ height: 12 }} />
          <Text style={styles.dialogBody}>
            Gemini AI đã phân tích hồ sơ sức khỏe và đề xuất các ngưỡng sau. Áp dụng chúng?
          </Text>
          <View style={{ height: 20 }} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Hủy</Text>
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity style={styles.dialogApplyBtn} onPress={onApply}>
              <Text style={styles.dialogApplyText}>Áp dụng tất cả</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  dialogTitleRow: { flexDirection: 'row', alignItems: 'center' },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  dialogBody: { color: Colors.textSecondary, fontSize: 14 },
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
});
