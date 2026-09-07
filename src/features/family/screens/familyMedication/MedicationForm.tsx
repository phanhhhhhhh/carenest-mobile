import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { useMedicationStore } from '../../../elderly/store/medicationStore';
import type { MedicationItem } from '../../../../shared/types';
import { searchMedicationCatalog } from '../../../medication/services/medicationCatalogApi';
import { isCancelled } from '../../../../core/api/errors';
import type { MedicationCatalogParsed } from '../../../../shared/schemas';
import { useMedicationVoiceInput } from '../../../medication/hooks/useMedicationVoiceInput';
import { useReminderVoiceRecorder } from '../../../medication/hooks/useReminderVoiceRecorder';
import {
  draftToMedicationPrefill,
  voiceReviewHint,
} from '../../../medication/services/medicationVoiceDraft';
import { isCloudinaryConfigured } from '../../../medication/services/cloudinaryUpload';
import { usePaymentStore } from '../../store/paymentStore';
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

  const voice = useMedicationVoiceInput();
  const [voiceHint, setVoiceHint] = useState<string | null>(null);

  // Custom reminder voice (UC B2) — recorded by family, hosted on Cloudinary,
  // stored as `medication.voiceUrl`. Backend only plays it on Family Plus.
  const reminderVoice = useReminderVoiceRecorder();
  const [voiceUrl, setVoiceUrl] = useState<string | undefined>(editing?.voiceUrl ?? undefined);
  const originalVoiceUrl = editing?.voiceUrl ?? undefined;
  const subscription = usePaymentStore((s) => s.subscription);
  const loadSubscription = usePaymentStore((s) => s.load);
  const isPremium = subscription?.isPremium ?? false;
  const showReminderVoice = isCloudinaryConfigured();

  useEffect(() => {
    if (showReminderVoice && !subscription) loadSubscription();
  }, [showReminderVoice, subscription, loadSubscription]);

  const handleReminderVoiceStop = async () => {
    const url = await reminderVoice.stopAndUpload();
    if (url) setVoiceUrl(url);
  };

  const handleVoiceStop = async () => {
    const draft = await voice.stopAndParse();
    if (!draft) return;
    const prefill = draftToMedicationPrefill(draft);
    if (prefill.name) {
      setName(prefill.name);
      setCatalogPickedName(prefill.name); // suppress the autocomplete dropdown on this programmatic change
    }
    if (prefill.dosage) setDosage(prefill.dosage);
    if (prefill.instructions) {
      setInstructions(prefill.instructions);
      setShowNotesField(true);
    }
    if (prefill.times.length > 0) setTimes(prefill.times);
    if (prefill.selectedDays.length > 0) setSelectedDays(prefill.selectedDays);
    setVoiceHint(voiceReviewHint(draft) || null);
  };

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
        // Send only when it changed; '' tells the backend to clear a removed clip.
        voiceUrl: voiceUrl !== originalVoiceUrl ? (voiceUrl ?? '') : undefined,
      });
    } else {
      await addMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim() ? instructions.trim() : undefined,
        elderlyId: currentElderlyId ?? undefined,
        scheduleTimes: timeStrings.length ? timeStrings : undefined,
        daysOfWeek: dayList.length ? dayList : undefined,
        voiceUrl,
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

      <VoiceCaptureRow
        status={voice.status}
        durationMillis={voice.durationMillis}
        onStart={async () => {
          setVoiceHint(null);
          await voice.start();
        }}
        onStop={handleVoiceStop}
        onCancel={voice.cancel}
      />
      {!!voiceHint && <Text style={styles.voiceHint}>{voiceHint}</Text>}
      {!!voice.error && <Text style={styles.voiceError}>{voice.error}</Text>}

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

      {showReminderVoice && (
        <ReminderVoiceSection
          isPremium={isPremium}
          voiceUrl={voiceUrl}
          status={reminderVoice.status}
          durationMillis={reminderVoice.durationMillis}
          error={reminderVoice.error}
          onStart={reminderVoice.start}
          onStop={handleReminderVoiceStop}
          onCancel={reminderVoice.cancel}
          onRemove={() => setVoiceUrl(undefined)}
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

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/**
 * Voice entry for the add/edit form (UC B1). Records a spoken description, sends
 * it to `POST /medications/parse-voice`, and the parent pre-fills every field
 * from the returned draft — nothing is saved until the family confirms.
 */
function VoiceCaptureRow({
  status,
  durationMillis,
  onStart,
  onStop,
  onCancel,
}: {
  status: 'idle' | 'recording' | 'processing';
  durationMillis: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}) {
  if (status === 'processing') {
    return (
      <View style={styles.voiceRow}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.voiceProcessingText}>Đang nhận diện giọng nói…</Text>
      </View>
    );
  }

  if (status === 'recording') {
    return (
      <View style={styles.voiceRow}>
        <View style={styles.voiceRecDot} />
        <Text style={styles.voiceRecTimer}>{formatDuration(durationMillis)}</Text>
        <TouchableOpacity style={styles.voiceStopBtn} onPress={onStop}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.voiceStopBtnText}>Dừng & điền</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.voiceCancelText}>Huỷ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.voiceStartBtn} onPress={onStart} activeOpacity={0.8}>
      <Ionicons name="mic-outline" size={18} color={Colors.primary} />
      <Text style={styles.voiceStartBtnText}>Đọc để điền nhanh</Text>
    </TouchableOpacity>
  );
}

/**
 * Custom medication-reminder voice (UC B2). Family records a short prompt; it is
 * uploaded to Cloudinary and stored as `medication.voiceUrl`. Family Plus only —
 * the backend simply won't attach the clip to reminders otherwise.
 */
function ReminderVoiceSection({
  isPremium,
  voiceUrl,
  status,
  durationMillis,
  error,
  onStart,
  onStop,
  onCancel,
  onRemove,
}: {
  isPremium: boolean;
  voiceUrl?: string;
  status: 'idle' | 'recording' | 'uploading';
  durationMillis: number;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.reminderVoiceCard}>
      <View style={styles.reminderVoiceHead}>
        <Ionicons name="mic-circle-outline" size={17} color={Colors.textSecondary} />
        <Text style={styles.reminderVoiceTitle}>Giọng nhắc của người thân</Text>
        {!isPremium && <Text style={styles.reminderVoiceBadge}>Family Plus</Text>}
      </View>

      {!isPremium ? (
        <Text style={styles.reminderVoiceLocked}>
          Ghi âm lời nhắc bằng giọng của bạn để phát khi tới giờ uống thuốc. Cần gói Family Plus để
          bật tính năng này.
        </Text>
      ) : status === 'uploading' ? (
        <View style={styles.voiceRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.voiceProcessingText}>Đang tải giọng nhắc lên…</Text>
        </View>
      ) : status === 'recording' ? (
        <View style={styles.voiceRow}>
          <View style={styles.voiceRecDot} />
          <Text style={styles.voiceRecTimer}>{formatDuration(durationMillis)}</Text>
          <TouchableOpacity style={styles.voiceStopBtn} onPress={onStop}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.voiceStopBtnText}>Xong</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.voiceCancelText}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      ) : voiceUrl ? (
        <View style={styles.voiceRow}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
          <Text style={styles.reminderVoiceDone}>Đã có giọng nhắc</Text>
          <TouchableOpacity style={styles.reminderVoiceRerecord} onPress={onStart}>
            <Text style={styles.reminderVoiceRerecordText}>Ghi lại</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.voiceCancelText}>Xoá</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.voiceStartBtn} onPress={onStart} activeOpacity={0.8}>
          <Ionicons name="mic-outline" size={18} color={Colors.primary} />
          <Text style={styles.voiceStartBtnText}>Ghi âm lời nhắc</Text>
        </TouchableOpacity>
      )}

      {!!error && <Text style={styles.voiceError}>{error}</Text>}
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
  voiceStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46,125,154,0.35)',
    backgroundColor: 'rgba(46,125,154,0.06)',
  },
  voiceStartBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(46,125,154,0.06)',
  },
  voiceRecDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
  voiceRecTimer: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  voiceStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Colors.primary,
  },
  voiceStopBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  voiceCancelText: { color: Colors.textHint, fontSize: 13, fontWeight: '600' },
  voiceProcessingText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  voiceHint: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  voiceError: { marginTop: 8, fontSize: 12.5, color: Colors.error, fontWeight: '600' },
  reminderVoiceCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  reminderVoiceHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  reminderVoiceTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  reminderVoiceBadge: {
    marginLeft: 'auto',
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: 'rgba(46,125,154,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  reminderVoiceLocked: { fontSize: 12.5, lineHeight: 18, color: Colors.textHint },
  reminderVoiceDone: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  reminderVoiceRerecord: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(46,125,154,0.35)',
  },
  reminderVoiceRerecordText: { color: Colors.primary, fontSize: 12.5, fontWeight: '700' },
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
