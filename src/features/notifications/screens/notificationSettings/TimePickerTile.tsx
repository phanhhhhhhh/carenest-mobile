import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { withAlpha } from './tiles';

export function TimePickerTile({
  label,
  time,
  onSet,
}: {
  label: string;
  time: string;
  onSet: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parts = time.split(':');
  const initialHour = parseInt(parts[0], 10) || 22;
  const initialMinute = parseInt(parts[1], 10) || 0;
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const openPicker = () => {
    setHour(initialHour);
    setMinute(initialMinute);
    setOpen(true);
  };

  const confirm = () => {
    onSet(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    setOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <>
      <TouchableOpacity style={styles.timeTile} onPress={openPicker}>
        <Ionicons name="time-outline" color={Colors.primary} size={18} />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.timeTileLabel}>{label}</Text>
          <Text style={styles.timeTileValue}>{time}</Text>
        </View>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.timePickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.timePickerTitle}>Chọn giờ {label}</Text>
            <View style={styles.timePickerColumns}>
              <ScrollView style={styles.timePickerColumn}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={styles.timePickerOption}
                    onPress={() => setHour(h)}
                  >
                    <Text
                      style={[styles.timePickerOptionText, h === hour && styles.optionTextActive]}
                    >
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.timePickerColon}>:</Text>
              <ScrollView style={styles.timePickerColumn}>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.timePickerOption}
                    onPress={() => setMinute(m)}
                  >
                    <Text
                      style={[styles.timePickerOptionText, m === minute && styles.optionTextActive]}
                    >
                      {String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.timePickerConfirm} onPress={confirm}>
              <Text style={styles.timePickerConfirmText}>Đồng ý</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  timeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: withAlpha(Colors.textHint, 0.3),
    borderRadius: 12,
  },
  timeTileLabel: { color: Colors.textHint, fontSize: 10 },
  timeTileValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  timePickerSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: 260,
  },
  timePickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  timePickerColumns: { flexDirection: 'row', height: 180, alignItems: 'center' },
  timePickerColumn: { flex: 1 },
  timePickerColon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 8,
  },
  timePickerOption: { paddingVertical: 8, alignItems: 'center' },
  timePickerOptionText: { fontSize: 16, color: Colors.textPrimary },
  timePickerConfirm: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timePickerConfirmText: { color: Colors.surface, fontWeight: '700', fontSize: 14 },
});
