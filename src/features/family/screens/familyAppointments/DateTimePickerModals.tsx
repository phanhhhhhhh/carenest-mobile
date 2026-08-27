import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Colors } from '../../../../core/theme/colors';
import { MONTHS, daysInMonth, withAlpha } from './utils';

function PickerColumn({
  data,
  selected,
  onSelect,
  renderLabel,
}: {
  data: number[];
  selected: number;
  onSelect: (v: number) => void;
  renderLabel: (v: number) => string;
}) {
  return (
    <FlatList
      style={styles.pickerColumn}
      data={data}
      keyExtractor={(v) => String(v)}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.pickerItem, item === selected && styles.pickerItemActive]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.pickerItemText, item === selected && styles.pickerItemTextActive]}>
            {renderLabel(item)}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

export function DatePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (d: Date) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());

  useEffect(() => {
    if (visible) {
      setYear(value.getFullYear());
      setMonth(value.getMonth());
      setDay(value.getDate());
    }
    // Sync only when the modal is (re)opened; `value` may be a fresh Date each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const years = Array.from({ length: 2 }, (_, i) => today.getFullYear() + i);
  const months = MONTHS.map((m, i) => ({ label: m, value: i }));
  const dayCount = daysInMonth(year, month);
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.pickerModalSheet}>
          <Text style={styles.modalTitle}>Chọn ngày</Text>
          <View style={styles.pickerColumns}>
            <PickerColumn
              data={days}
              selected={day}
              onSelect={(d) => setDay(Math.min(d, dayCount))}
              renderLabel={(d) => String(d)}
            />
            <PickerColumn
              data={months.map((m) => m.value)}
              selected={month}
              onSelect={setMonth}
              renderLabel={(m) => MONTHS[m]}
            />
            <PickerColumn
              data={years}
              selected={year}
              onSelect={setYear}
              renderLabel={(y) => String(y)}
            />
          </View>
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={styles.pickerConfirmBtn}
            onPress={() => onConfirm(new Date(year, month, Math.min(day, dayCount)))}
          >
            <Text style={styles.pickerConfirmBtnText}>Xong</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function TimePickerModal({
  visible,
  hour,
  minute,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  hour: number;
  minute: number;
  onClose: () => void;
  onConfirm: (h: number, m: number) => void;
}) {
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);

  useEffect(() => {
    if (visible) {
      setH(hour);
      setM(minute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.pickerModalSheet}>
          <Text style={styles.modalTitle}>Chọn giờ</Text>
          <View style={styles.pickerColumns}>
            <PickerColumn
              data={hours}
              selected={h}
              onSelect={setH}
              renderLabel={(v) => String(v).padStart(2, '0')}
            />
            <PickerColumn
              data={minutes}
              selected={m}
              onSelect={setM}
              renderLabel={(v) => String(v).padStart(2, '0')}
            />
          </View>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.pickerConfirmBtn} onPress={() => onConfirm(h, m)}>
            <Text style={styles.pickerConfirmBtnText}>Xong</Text>
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
    padding: 32,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  pickerModalSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  pickerColumns: { flexDirection: 'row', height: 220 },
  pickerColumn: { flex: 1 },
  pickerItem: { paddingVertical: 10, alignItems: 'center' },
  pickerItemActive: { backgroundColor: withAlpha(Colors.primary, 0.1), borderRadius: 8 },
  pickerItemText: { fontSize: 15, color: Colors.textSecondary },
  pickerItemTextActive: { color: Colors.primary, fontWeight: '700' },
  pickerConfirmBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerConfirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
