import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Colors } from '../../../../core/theme/colors';
import { HOURS, MINUTES, pad2 } from './constants';

interface Props {
  visible: boolean;
  hour: number;
  minute: number;
  onChangeHour: (h: number) => void;
  onChangeMinute: (m: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function TimePickerModal({
  visible,
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.timePickerSheet}>
          <Text style={styles.modalTitle}>Chọn giờ</Text>
          <View style={styles.timePickerColumns}>
            <FlatList
              data={HOURS}
              keyExtractor={(h) => `h-${h}`}
              style={styles.timePickerList}
              renderItem={({ item: h }) => (
                <TouchableOpacity
                  style={[styles.timePickerOption, hour === h && styles.timePickerOptionSelected]}
                  onPress={() => onChangeHour(h)}
                >
                  <Text
                    style={[
                      styles.timePickerOptionText,
                      hour === h && styles.timePickerOptionTextSelected,
                    ]}
                  >
                    {pad2(h)}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Text style={styles.timePickerColon}>:</Text>
            <FlatList
              data={MINUTES}
              keyExtractor={(m) => `m-${m}`}
              style={styles.timePickerList}
              renderItem={({ item: m }) => (
                <TouchableOpacity
                  style={[styles.timePickerOption, minute === m && styles.timePickerOptionSelected]}
                  onPress={() => onChangeMinute(m)}
                >
                  <Text
                    style={[
                      styles.timePickerOptionText,
                      minute === m && styles.timePickerOptionTextSelected,
                    ]}
                  >
                    {pad2(m)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
          <TouchableOpacity style={styles.timePickerConfirmBtn} onPress={onConfirm}>
            <Text style={styles.timePickerConfirmBtnText}>Thêm</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  timePickerSheet: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  timePickerColumns: { flexDirection: 'row', height: 200, justifyContent: 'center' },
  timePickerList: { width: 70 },
  timePickerColon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    alignSelf: 'center',
    marginHorizontal: 8,
  },
  timePickerOption: { paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  timePickerOptionSelected: { backgroundColor: 'rgba(46,125,154,0.1)' },
  timePickerOptionText: { fontSize: 15, color: Colors.textSecondary },
  timePickerOptionTextSelected: { color: Colors.primary, fontWeight: '700' },
  timePickerConfirmBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerConfirmBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});
