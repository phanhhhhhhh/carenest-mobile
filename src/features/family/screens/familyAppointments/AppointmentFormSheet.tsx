import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { showErrorToast } from '../../../../shared/components/toastStore';
import { useAppointmentStore } from '../../store/appointmentStore';
import type { AppointmentItem } from '../../../../shared/types';
import { formatDate, formatTime } from './utils';
import { DatePickerModal, TimePickerModal } from './DateTimePickerModals';

function FormField({
  icon,
  placeholder,
  hint,
  value,
  onChangeText,
  multiline,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  hint: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.fieldWrap, multiline && styles.fieldWrapMultiline]}>
      <Ionicons name={icon} size={18} color={Colors.primary} style={styles.fieldIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{placeholder}</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder={hint}
          placeholderTextColor={Colors.textHint}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 2 : 1}
        />
      </View>
    </View>
  );
}

function defaultDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

interface Props {
  visible: boolean;
  editing: AppointmentItem | null;
  currentElderlyId: string | null;
  onClose: () => void;
}

/**
 * Add/edit appointment bottom-sheet. Parent remounts it (via a changing `key`)
 * on every open, so form state initializes straight from `editing`.
 */
export function AppointmentFormSheet({ visible, editing, currentElderlyId, onClose }: Props) {
  const isSaving = useAppointmentStore((s) => s.isSaving);
  const create = useAppointmentStore((s) => s.create);
  const update = useAppointmentStore((s) => s.update);

  const initialDate = editing ? new Date(editing.appointmentDate) : defaultDate();

  const [doctor, setDoctor] = useState(editing?.doctor ?? '');
  const [specialty, setSpecialty] = useState(editing?.specialty ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes());

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const canSubmit = doctor.trim().length > 0 && specialty.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    const combined = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedHour,
      selectedMinute,
    );
    const trimmedLocation = location.trim();
    const trimmedNotes = notes.trim();

    let ok: boolean;
    if (editing) {
      ok = await update({
        appointmentId: editing.id,
        doctor: doctor.trim(),
        specialty: specialty.trim(),
        location: trimmedLocation.length > 0 ? trimmedLocation : undefined,
        appointmentDate: combined,
        notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
      });
    } else {
      ok = await create({
        doctor: doctor.trim(),
        specialty: specialty.trim(),
        location: trimmedLocation.length > 0 ? trimmedLocation : undefined,
        appointmentDate: combined,
        notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
        elderlyId: currentElderlyId ?? undefined,
      });
    }
    if (ok) {
      onClose();
    } else {
      showErrorToast(useAppointmentStore.getState().error ?? 'Không thể lưu lịch hẹn');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheetHandle} />
            <View style={{ height: 16 }} />
            <Text style={styles.sheetTitle}>
              {editing ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
            </Text>
            <View style={{ height: 20 }} />

            <FormField
              icon="person"
              placeholder="Tên bác sĩ"
              hint="VD: BS. Smith"
              value={doctor}
              onChangeText={setDoctor}
            />
            <View style={{ height: 14 }} />
            <FormField
              icon="medical"
              placeholder="Chuyên khoa"
              hint="VD: Tim mạch"
              value={specialty}
              onChangeText={setSpecialty}
            />
            <View style={{ height: 14 }} />
            <FormField
              icon="location"
              placeholder="Địa điểm (tùy chọn)"
              hint="VD: Bệnh viện Thành phố"
              value={location}
              onChangeText={setLocation}
            />
            <View style={{ height: 14 }} />

            <TouchableOpacity style={styles.pickerRow} onPress={() => setDatePickerVisible(true)}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.pickerRowText}>{formatDate(selectedDate)}</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
            </TouchableOpacity>
            <View style={{ height: 14 }} />

            <TouchableOpacity style={styles.pickerRow} onPress={() => setTimePickerVisible(true)}>
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={styles.pickerRowText}>
                {formatTime(new Date(2024, 0, 1, selectedHour, selectedMinute))}
              </Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
            </TouchableOpacity>
            <View style={{ height: 14 }} />

            <FormField
              icon="document-text"
              placeholder="Ghi chú (tùy chọn)"
              hint="VD: Nhịn ăn trước khi xét nghiệm"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={{ height: 20 }} />

            <TouchableOpacity
              style={[styles.submitBtn, (!canSubmit || isSaving) && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={isSaving || !canSubmit}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{editing ? 'Cập nhật' : 'Thêm lịch hẹn'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={datePickerVisible}
        value={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(d) => {
          setSelectedDate(d);
          setDatePickerVisible(false);
        }}
      />

      <TimePickerModal
        visible={timePickerVisible}
        hour={selectedHour}
        minute={selectedMinute}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(h, m) => {
          setSelectedHour(h);
          setSelectedMinute(m);
          setTimePickerVisible(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  sheetContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textHint,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fieldWrapMultiline: { alignItems: 'flex-start', paddingTop: 10 },
  fieldIcon: { marginRight: 10, marginTop: 2 },
  fieldLabel: { fontSize: 11, color: Colors.textHint, marginBottom: 2 },
  fieldInput: { fontSize: 14, color: Colors.textPrimary, padding: 0 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerRowText: { marginLeft: 12, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
