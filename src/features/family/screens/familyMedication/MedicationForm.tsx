import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { useMedicationStore } from '../../../elderly/store/medicationStore';
import type { MedicationItem } from '../../../../shared/types';
import { searchMedicationCatalog } from '../../../medication/services/medicationCatalogApi';
import { isCancelled } from '../../../../core/api/errors';
import type { MedicationCatalogParsed } from '../../../../shared/schemas';
import { DAY_LABELS, HISTORY_DAY_LABELS, TimeValue, pad2 } from './constants';
import { TimePickerModal } from './TimePickerModal';

function timesFromItem(item: MedicationItem | null): TimeValue[] {
  return (item?.scheduleTimes ?? []).map((t) => {
    const [h, m] = t.split(':');
    return { hour: Number(h) || 0, minute: Number(m) || 0 };
  });
}

interface Props {
  editing: MedicationItem | null;
  currentElderlyId: string | null;
  currentElderlyName: string;
  onClose: () => void;
}

/**
 * Add/edit inline form (wireframe A2: mở rộng ngay trong trang, không phải
 * modal bottom-sheet). Mount lại với `key` mới mỗi lần mở nên state khởi tạo
 * thẳng từ props, không cần đồng bộ bằng effect.
 */
export function MedicationForm({ editing, currentElderlyId, currentElderlyName, onClose }: Props) {
  const addMedication = useMedicationStore((s) => s.addMedication);
  const updateMedication = useMedicationStore((s) => s.updateMedication);

  const [name, setName] = useState(editing?.name ?? '');
  const [dosage, setDosage] = useState(editing?.dosage ?? '');
  const [instructions, setInstructions] = useState(editing?.instructions ?? '');
  const [showNotesField, setShowNotesField] = useState(!!editing?.instructions);
  const [times, setTimes] = useState<TimeValue[]>(() => timesFromItem(editing));
  const [selectedDays, setSelectedDays] = useState<number[]>([...(editing?.daysOfWeek ?? [])]);
  const [catalogSuggestions, setCatalogSuggestions] = useState<MedicationCatalogParsed[]>([]);
  const [catalogPickedName, setCatalogPickedName] = useState<string | null>(editing?.name ?? null);

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);

  // Debounced medication-name autocomplete against the curated reference
  // catalog. Skipped right after a suggestion is picked so selecting doesn't
  // immediately reopen its own dropdown.
  useEffect(() => {
    if (name.trim() === catalogPickedName) {
      setCatalogSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchMedicationCatalog(name, controller.signal)
        .then(setCatalogSuggestions)
        .catch((e) => {
          if (!isCancelled(e)) setCatalogSuggestions([]);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, catalogPickedName]);

  const pickCatalogSuggestion = (item: MedicationCatalogParsed) => {
    setName(item.name);
    setCatalogPickedName(item.name);
    setCatalogSuggestions([]);
    if (!dosage.trim() && item.commonStrengths) {
      setDosage(item.commonStrengths.split(',')[0].trim());
    }
  };

  const toggleDay = (i: number) => {
    setSelectedDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]));
  };

  const removeTime = (index: number) => {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmAddTime = () => {
    setTimes((prev) => [...prev, { hour: pickerHour, minute: pickerMinute }]);
    setTimePickerVisible(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !dosage.trim()) return;
    const timeStrings = times.map((t) => `${pad2(t.hour)}:${pad2(t.minute)}`);
    const dayList = [...selectedDays].sort((a, b) => a - b);

    if (editing) {
      await updateMedication({
        medicationId: editing.id,
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim() ? instructions.trim() : undefined,
        scheduleTimes: timeStrings.length ? timeStrings : undefined,
        daysOfWeek: dayList.length ? dayList : undefined,
      });
    } else {
      await addMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim() ? instructions.trim() : undefined,
        elderlyId: currentElderlyId ?? undefined,
        scheduleTimes: timeStrings.length ? timeStrings : undefined,
        daysOfWeek: dayList.length ? dayList : undefined,
      });
    }
    onClose();
  };

  const primaryTime = times[0];
  const canSubmit = name.trim().length > 0 && dosage.trim().length > 0;

  return (
    <View style={styles.addFormCard}>
      <Text style={styles.addFormTitle}>
        {editing ? `Sửa thuốc — ${currentElderlyName}` : `Thêm thuốc mới — ${currentElderlyName}`}
      </Text>

      <TextInput
        style={styles.plainInput}
        placeholder="Tên thuốc"
        placeholderTextColor={Colors.textHint}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setCatalogPickedName(null);
        }}
      />
      {catalogSuggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {catalogSuggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionRow}
              onPress={() => pickCatalogSuggestion(item)}
            >
              <Text style={styles.suggestionName}>{item.name}</Text>
              {!!item.brandNames && (
                <Text style={styles.suggestionMeta} numberOfLines={1}>
                  {item.brandNames}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <TextInput
          style={[styles.plainInput, { flex: 1, marginTop: 0 }]}
          placeholder="Liều lượng"
          placeholderTextColor={Colors.textHint}
          value={dosage}
          onChangeText={setDosage}
        />
        <TouchableOpacity
          style={[styles.plainInput, styles.timeFieldBtn]}
          onPress={() => {
            setPickerHour(primaryTime?.hour ?? 8);
            setPickerMinute(primaryTime?.minute ?? 0);
            setTimePickerVisible(true);
          }}
        >
          <Text style={primaryTime ? styles.timeFieldValue : styles.timeFieldPlaceholder}>
            {primaryTime ? `${pad2(primaryTime.hour)}:${pad2(primaryTime.minute)}` : 'Giờ uống'}
          </Text>
          <Text style={{ fontSize: 14 }}>⏰</Text>
        </TouchableOpacity>
      </View>

      {times.length > 1 && (
        <View style={[styles.chipsWrap, { marginTop: 10 }]}>
          {times.slice(1).map((t, i) => (
            <View key={`${t.hour}-${t.minute}-${i}`} style={styles.timeChip}>
              <Text style={styles.timeChipText}>
                {pad2(t.hour)}:{pad2(t.minute)}
              </Text>
              <TouchableOpacity onPress={() => removeTime(i + 1)}>
                <Ionicons name="close" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={{ marginTop: 8 }}
        onPress={() => {
          setPickerHour(8);
          setPickerMinute(0);
          setTimePickerVisible(true);
          // confirmAddTime (below) luôn append — nếu times rỗng thì trở
          // thành giờ chính, nếu đã có thì thành liều phụ trong ngày.
        }}
      >
        <Text style={styles.addTimeBtnText}>+ Thêm giờ khác (nếu uống nhiều lần/ngày)</Text>
      </TouchableOpacity>

      <View style={styles.daysRow}>
        {DAY_LABELS.map((label, i) => {
          const selected = selectedDays.includes(i);
          return (
            <TouchableOpacity
              key={label}
              style={[styles.dayBox, selected && styles.dayBoxSelected]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayBoxText, selected && styles.dayBoxTextSelected]}>
                {HISTORY_DAY_LABELS[i]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', marginTop: 14 }}>
        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => setShowNotesField((v) => !v)}
        >
          <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.secondaryActionText}>Ghi chú</Text>
        </TouchableOpacity>
      </View>

      {showNotesField && (
        <TextInput
          style={[styles.plainInput, { marginTop: 10 }]}
          placeholder="Ghi chú (VD: sau ăn, trước ăn 30 phút...)"
          placeholderTextColor={Colors.textHint}
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />
      )}

      <TouchableOpacity
        style={[styles.saveBlackBtn, !canSubmit && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        <Text style={styles.saveBlackBtnText}>
          {editing ? 'Cập nhật & Bật nhắc nhở' : 'Lưu & Bật nhắc nhở'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ alignItems: 'center', marginTop: 10 }} onPress={onClose}>
        <Text style={{ color: Colors.textHint, fontSize: 13 }}>Hủy</Text>
      </TouchableOpacity>

      <TimePickerModal
        visible={timePickerVisible}
        hour={pickerHour}
        minute={pickerMinute}
        onChangeHour={setPickerHour}
        onChangeMinute={setPickerMinute}
        onConfirm={confirmAddTime}
        onClose={() => setTimePickerVisible(false)}
      />
    </View>
  );
}

/** Collapsed "add medication" trigger row shown when the form is closed. */
export function AddMedicationTrigger({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addTriggerRow} onPress={onPress}>
      <Ionicons name="add" size={18} color={Colors.textSecondary} />
      <Text style={styles.addTriggerText}>Thêm thuốc mới</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  addTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(173,181,189,0.5)',
  },
  addTriggerText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  addFormCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(173,181,189,0.5)',
    backgroundColor: Colors.surface,
  },
  addFormTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  plainInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  suggestionBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  suggestionMeta: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  timeFieldBtn: {
    flex: 1,
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeFieldValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  timeFieldPlaceholder: { fontSize: 14, color: Colors.textHint },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(173,181,189,0.12)',
  },
  secondaryActionText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  saveBlackBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  saveBlackBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  addTimeBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(46,125,154,0.08)',
  },
  timeChipText: { fontSize: 13, color: Colors.primary },
  daysRow: { flexDirection: 'row', marginTop: 14 },
  dayBox: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.3)',
  },
  dayBoxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayBoxText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  dayBoxTextSelected: { color: '#FFFFFF' },
  submitBtnDisabled: { opacity: 0.5 },
});
