import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { withAlpha } from './tiles';

export const REMINDER_MINUTE_OPTIONS = [5, 10, 15, 30, 60];

export function ReminderMinutesTile({
  value,
  onChanged,
}: {
  value: number;
  onChanged: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = REMINDER_MINUTE_OPTIONS.includes(value) ? value : 15;

  return (
    <View style={styles.reminderRow}>
      <Ionicons name="timer-outline" color={Colors.textHint} size={16} />
      <Text style={styles.reminderLabel}>Nhắc trước:</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.reminderDropdown} onPress={() => setOpen(true)}>
        <Text style={styles.reminderDropdownText}>{current} phút</Text>
        <Ionicons name="chevron-down" size={14} color={Colors.primary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.optionSheet}>
            {REMINDER_MINUTE_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.optionRow}
                onPress={() => {
                  onChanged(m);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, m === current && styles.optionTextActive]}>
                  {m} phút
                </Text>
                {m === current && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 70,
    paddingRight: 16,
    paddingBottom: 8,
  },
  reminderLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: 8 },
  reminderDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: withAlpha(Colors.textHint, 0.3),
    borderRadius: 8,
  },
  reminderDropdownText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionText: { fontSize: 14, color: Colors.textPrimary },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
});
