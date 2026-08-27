import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { METRIC_CONFIGS, METRIC_KEYS } from './metricConfig';

export function AddMetricSheet({
  visible,
  onClose,
  onPickMetric,
}: {
  visible: boolean;
  onClose: () => void;
  onPickMetric: (type: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlayBottom} activeOpacity={1} onPress={onClose}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Thêm chỉ số sức khỏe</Text>
          <View style={{ height: 12 }} />
          {METRIC_KEYS.map((key) => {
            const config = METRIC_CONFIGS[key];
            return (
              <TouchableOpacity
                key={key}
                style={styles.sheetItem}
                onPress={() => onPickMetric(key)}
              >
                <View style={[styles.sheetItemIcon, { backgroundColor: config.bgColor }]}>
                  <Ionicons name={config.icon} size={22} color={config.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.sheetItemLabel}>{config.label}</Text>
                  <Text style={styles.sheetItemUnit}>Đơn vị: {config.unit}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function ValueDialog({
  target,
  value,
  onChangeValue,
  onCancel,
  onSave,
}: {
  target: { type: string; label: string; unit: string } | null;
  value: string;
  onChangeValue: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={target != null} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlayCenter}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>Nhập {target?.label}</Text>
          <View style={{ height: 12 }} />
          <TextInput
            style={styles.dialogInput}
            placeholder={`Giá trị (${target?.unit})`}
            placeholderTextColor={Colors.textHint}
            keyboardType="numeric"
            autoFocus
            value={value}
            onChangeText={onChangeValue}
          />
          <View style={{ height: 16 }} />
          <View style={styles.dialogActions}>
            <TouchableOpacity onPress={onCancel} style={styles.dialogCancelBtn}>
              <Text style={styles.dialogCancelText}>Hủy</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity onPress={onSave} style={styles.dialogSaveBtn}>
              <Text style={styles.dialogSaveText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function GoogleFitSheet({
  visible,
  onClose,
  onSync,
  onDisconnect,
}: {
  visible: boolean;
  onClose: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlayBottom} activeOpacity={1} onPress={onClose}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <TouchableOpacity style={styles.sheetItem} onPress={onSync}>
            <Ionicons name="sync" size={22} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.sheetItemLabel}>Đồng bộ ngay</Text>
              <Text style={styles.sheetItemUnit}>Lấy dữ liệu mới nhất từ Google Fit</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetItem} onPress={onDisconnect}>
            <Ionicons name="link" size={22} color={Colors.error} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.sheetItemLabel}>Ngắt kết nối</Text>
              <Text style={styles.sheetItemUnit}>Dừng đồng bộ với Google Fit</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textHint,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sheetItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetItemLabel: { fontWeight: '600', color: Colors.textPrimary, fontSize: 15 },
  sheetItemUnit: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dialogCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  dialogInput: {
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  dialogCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  dialogCancelText: { color: Colors.textSecondary, fontWeight: '600' },
  dialogSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dialogSaveText: { color: '#FFFFFF', fontWeight: '600' },
});
