import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useMedicationStore } from '../store/medicationStore';
import { snoozeOneOff, cancelSnooze } from '../../medication/services/medicationReminderService';
import type { MedicationItem } from '../../../shared/types';



type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function ElderlyMedicationScreen() {
  const navigation = useNavigation<Nav>();

  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const error = useMedicationStore((s) => s.error);
  const load = useMedicationStore((s) => s.load);
  const addMedication = useMedicationStore((s) => s.addMedication);
  const updateMedication = useMedicationStore((s) => s.updateMedication);
  const deleteMedication = useMedicationStore((s) => s.deleteMedication);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  useEffect(() => {
    load();
  }, []);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<MedicationItem | null>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [days, setDays] = useState<Set<number>>(new Set());

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [pickHour, setPickHour] = useState(8);
  const [pickMinute, setPickMinute] = useState(0);

  const openAddSheet = (existing?: MedicationItem) => {
    setEditing(existing ?? null);
    setName(existing?.name ?? '');
    setDosage(existing?.dosage ?? '');
    setInstructions(existing?.instructions ?? '');
    setTimes(existing?.scheduleTimes ? [...existing.scheduleTimes] : []);
    setDays(new Set(existing?.daysOfWeek ?? []));
    setSheetVisible(true);
  };

  const closeSheet = () => setSheetVisible(false);

  const toggleDay = (i: number) => {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const removeTime = (idx: number) => {
    setTimes((prev) => prev.filter((_, i) => i !== idx));
  };

  const confirmAddTime = () => {
    setTimes((prev) => [...prev, `${pad2(pickHour)}:${pad2(pickMinute)}`]);
    setTimePickerVisible(false);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedDosage = dosage.trim();
    if (!trimmedName || !trimmedDosage) return;

    const dayList = Array.from(days).sort((a, b) => a - b);
    const trimmedInstructions = instructions.trim();

    if (editing) {
      await updateMedication({
        medicationId: editing.id,
        name: trimmedName,
        dosage: trimmedDosage,
        instructions: trimmedInstructions.length > 0 ? trimmedInstructions : undefined,
        scheduleTimes: times.length > 0 ? times : undefined,
        daysOfWeek: dayList.length > 0 ? dayList : undefined,
      });
    } else {
      await addMedication({
        name: trimmedName,
        dosage: trimmedDosage,
        instructions: trimmedInstructions.length > 0 ? trimmedInstructions : undefined,
        scheduleTimes: times.length > 0 ? times : undefined,
        daysOfWeek: dayList.length > 0 ? dayList : undefined,
      });
    }
    setSheetVisible(false);
  };

  const confirmDelete = (item: MedicationItem) => {
    Alert.alert(
      'Delete medication',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMedication(item.id);
          },
        },
      ],
    );
  };

  const handleToggle = (med: MedicationItem) => {
    toggleTaken(med.id);
  };

  const handleTakeNow = (med: MedicationItem) => {
    cancelSnooze(med);
    toggleTaken(med.id);
  };

  const handleSnooze = async (med: MedicationItem) => {
    const ok = await snoozeOneOff(med, 10);
    const target = new Date(Date.now() + 10 * 60 * 1000);
    if (ok) {
      Alert.alert(
        '',
        `Đã hoãn nhắc nhở 10 phút — sẽ nhắc lại lúc ${pad2(target.getHours())}:${pad2(target.getMinutes())}`,
      );
    } else {
      Alert.alert('', 'Không thể đặt lại nhắc nhở trên thiết bị này');
    }
  };

  const takenCount = items.filter((m) => m.taken).length;
  const totalCount = items.length;
  const progress = totalCount === 0 ? 0 : takenCount / totalCount;

  const pending = [...items.filter((m) => !m.taken)].sort((a, b) => {
    const at = a.nextDoseTime ? new Date(a.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.nextDoseTime ? new Date(b.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt;
  });
  const dueNow = pending.length > 0 ? pending[0] : null;
  const dueTimeLabel = dueNow
    ? dueNow.nextDoseTime
      ? `${pad2(new Date(dueNow.nextDoseTime).getHours())}:${pad2(new Date(dueNow.nextDoseTime).getMinutes())} hôm nay`
      : dueNow.scheduleTimes.length > 0
        ? dueNow.scheduleTimes[0]
        : ''
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Thuốc của tôi</Text>
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textHint} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {dueNow && (
            <View style={styles.dueBanner}>
              <View style={styles.dueHeaderRow}>
                <Ionicons name="alarm-outline" size={18} color={Colors.warning} />
                <Text style={styles.dueHeaderText}>Đến giờ uống thuốc</Text>
              </View>
              <View style={{ height: 10 }} />
              <View style={styles.dueRow}>
                <View style={styles.dueIconWrap}>
                  <Ionicons name="medkit" size={24} color={Colors.warning} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.dueMedName}>
                    {dueNow.name} {dueNow.dosage}
                  </Text>
                  {!!dueTimeLabel && <Text style={styles.dueTimeLabel}>{dueTimeLabel}</Text>}
                </View>
              </View>
              <View style={{ height: 14 }} />
              <View style={styles.dueActionsRow}>
                <TouchableOpacity
                  style={styles.dueTakeBtn}
                  onPress={() => handleTakeNow(dueNow)}
                >
                  <Text style={styles.dueTakeBtnText}>ĐÃ UỐNG</Text>
                </TouchableOpacity>
                <View style={{ width: 10 }} />
                <TouchableOpacity
                  style={styles.dueSnoozeBtn}
                  onPress={() => handleSnooze(dueNow)}
                >
                  <Text style={styles.dueSnoozeBtnText}>Hoãn 10 phút</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressHeaderText}>Today</Text>
              <View style={styles.progressPct}>
                <Text style={styles.progressPctText}>{Math.trunc(progress * 100)}%</Text>
              </View>
            </View>
            <View style={{ height: 8 }} />
            <Text style={styles.progressBig}>
              Taken {takenCount} / {totalCount} doses
            </Text>
            <View style={{ height: 14 }} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>
            <View style={{ height: 10 }} />
            <Text style={styles.progressSub}>
              {totalCount === 0
                ? 'Add medication to start tracking'
                : takenCount === totalCount
                  ? 'Great! You have taken all medication today'
                  : `${totalCount - takenCount} doses remaining`}
            </Text>
          </View>

          <View style={{ height: 20 }} />

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Hôm nay</Text>
            <Text style={styles.sectionCount}>
              {takenCount}/{totalCount} taken
            </Text>
          </View>

          <View style={{ height: 14 }} />

          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Image
                source={require('../../../../assets/mascot/mascot_confused.jpg')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
              <View style={{ height: 4 }} />
              <Text style={styles.emptyText}>No medications yet</Text>
              <View style={{ height: 4 }} />
              <Text style={styles.emptyHint}>Press + to add medication</Text>
            </View>
          ) : (
            items.map((m) => (
              <MedCard
                key={m.id}
                item={m}
                onToggle={() => handleToggle(m)}
                onEdit={() => openAddSheet(m)}
                onDelete={() => confirmDelete(m)}
                onHistory={() =>
                  navigation.navigate('ElderlyMedicationHistory', {
                    medicationId: m.id,
                    medicationName: m.name,
                  })
                }
              />
            ))
          )}

          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => openAddSheet()}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeSheet}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHandle} />
              <View style={{ height: 16 }} />
              <Text style={styles.sheetTitle}>
                {editing ? 'Edit medication' : 'Add new medication'}
              </Text>
              <View style={{ height: 20 }} />

              <View style={styles.inputWrap}>
                <Ionicons name="medkit" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Medication name (e.g. Metformin)"
                  placeholderTextColor={Colors.textHint}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={{ height: 14 }} />

              <View style={styles.inputWrap}>
                <Ionicons name="scale-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Dosage (e.g. 500mg)"
                  placeholderTextColor={Colors.textHint}
                  value={dosage}
                  onChangeText={setDosage}
                />
              </View>

              <View style={{ height: 14 }} />

              <View style={styles.rowBetween}>
                <View style={styles.rowStart}>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                  <Text style={styles.label}>Medication time</Text>
                </View>
                <TouchableOpacity
                  style={styles.addTimeBtn}
                  onPress={() => {
                    setPickHour(8);
                    setPickMinute(0);
                    setTimePickerVisible(true);
                  }}
                >
                  <Ionicons name="add" size={18} color={Colors.primary} />
                  <Text style={styles.addTimeBtnText}>Add time</Text>
                </TouchableOpacity>
              </View>

              {times.length > 0 && (
                <>
                  <View style={{ height: 8 }} />
                  <View style={styles.chipsWrap}>
                    {times.map((t, i) => (
                      <View key={`${t}-${i}`} style={styles.timeChip}>
                        <Text style={styles.timeChipText}>{t}</Text>
                        <TouchableOpacity onPress={() => removeTime(i)}>
                          <Ionicons name="close" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <View style={{ height: 14 }} />
              <Text style={styles.label}>Days of week</Text>
              <View style={{ height: 8 }} />
              <View style={styles.daysRow}>
                {DAY_LABELS.map((label, i) => {
                  const selected = days.has(i);
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[styles.dayChip, selected && styles.dayChipSelected]}
                      onPress={() => toggleDay(i)}
                    >
                      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 14 }} />

              <View style={styles.inputWrap}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={Colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Instructions (optional, e.g. Take after meals)"
                  placeholderTextColor={Colors.textHint}
                  value={instructions}
                  onChangeText={setInstructions}
                />
              </View>

              <View style={{ height: 20 }} />

              <TouchableOpacity
                style={[styles.saveBtn, (!name.trim() || !dosage.trim()) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim() || !dosage.trim()}
              >
                <Text style={styles.saveBtnText}>{editing ? 'Update' : 'Add medication'}</Text>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={timePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTimePickerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.timePickerSheet}>
            <Text style={styles.modalTitle}>Select time</Text>
            <View style={{ height: 12 }} />
            <View style={styles.timePickerColumns}>
              <FlatList
                style={styles.timePickerList}
                data={HOURS}
                keyExtractor={(h) => `h-${h}`}
                renderItem={({ item: h }) => (
                  <TouchableOpacity
                    style={[styles.timePickerOption, pickHour === h && styles.timePickerOptionSelected]}
                    onPress={() => setPickHour(h)}
                  >
                    <Text
                      style={[
                        styles.timePickerOptionText,
                        pickHour === h && styles.timePickerOptionTextSelected,
                      ]}
                    >
                      {pad2(h)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <Text style={styles.timePickerColon}>:</Text>
              <FlatList
                style={styles.timePickerList}
                data={MINUTES}
                keyExtractor={(m) => `m-${m}`}
                renderItem={({ item: m }) => (
                  <TouchableOpacity
                    style={[styles.timePickerOption, pickMinute === m && styles.timePickerOptionSelected]}
                    onPress={() => setPickMinute(m)}
                  >
                    <Text
                      style={[
                        styles.timePickerOptionText,
                        pickMinute === m && styles.timePickerOptionTextSelected,
                      ]}
                    >
                      {pad2(m)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={{ height: 16 }} />
            <TouchableOpacity style={styles.timePickerConfirm} onPress={confirmAddTime}>
              <Text style={styles.timePickerConfirmText}>Add</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function MedCard({
  item,
  onToggle,
  onEdit,
  onDelete,
  onHistory,
}: {
  item: MedicationItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
}) {
  const nextTimeLabel = item.nextDoseTime
    ? `${pad2(new Date(item.nextDoseTime).getHours())}:${pad2(new Date(item.nextDoseTime).getMinutes())}`
    : null;

  return (
    <View style={[styles.medCard, item.taken && styles.medCardTaken]}>
      <View style={[styles.medIconWrap, item.taken && styles.medIconWrapTaken]}>
        <Ionicons name="medkit" size={24} color={item.taken ? Colors.success : Colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.medName, item.taken && styles.medNameTaken]}>{item.name}</Text>
        <View style={{ height: 3 }} />
        <View style={styles.medMetaRow}>
          <Text style={styles.medDosage}>{item.dosage}</Text>
          {item.scheduleTimes.length > 0 && (
            <>
              <Ionicons name="time-outline" size={12} color={Colors.textHint} style={{ marginLeft: 6 }} />
              <Text style={styles.medTimes}> {item.scheduleTimes.join(', ')}</Text>
            </>
          )}
          {!!item.instructions && (
            <>
              <View style={styles.dot} />
              <Text style={styles.medInstructions} numberOfLines={1}>
                {item.instructions}
              </Text>
            </>
          )}
        </View>
      </View>

      {nextTimeLabel && (
        <View style={styles.medTimeBadge}>
          <Text style={styles.medTimeBadgeText}>{nextTimeLabel}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.medActionHistory} onPress={onHistory}>
        <Ionicons name="time" size={16} color={Colors.success} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.medActionEdit} onPress={onEdit}>
        <Ionicons name="create-outline" size={16} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.medActionDelete} onPress={onDelete}>
        <Ionicons name="trash-outline" size={16} color={Colors.error} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkCircle, item.taken && styles.checkCircleTaken]}
        onPress={onToggle}
      >
        {item.taken && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  scroll: { padding: 16 },

  dueBanner: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 167, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 38, 0.4)',
  },
  dueHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueHeaderText: { fontSize: 13, fontWeight: '700', color: Colors.warning },
  dueRow: { flexDirection: 'row', alignItems: 'center' },
  dueIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueMedName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  dueTimeLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  dueActionsRow: { flexDirection: 'row' },
  dueTakeBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dueTakeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  dueSnoozeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.5)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dueSnoozeBtnText: { color: Colors.textSecondary, fontSize: 13 },

  progressCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: Colors.primaryDark,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  progressHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressHeaderText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  progressPct: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressPctText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  progressBig: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: { height: 10, borderRadius: 6, backgroundColor: '#81D4FA' },
  progressSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionCount: { color: Colors.textSecondary, fontSize: 13 },

  emptyCard: {
    paddingVertical: 40,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  emptyHint: { color: Colors.textHint, fontSize: 13 },

  medCard: {
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  medCardTaken: { borderColor: 'rgba(67, 160, 71, 0.3)' },
  medIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medIconWrapTaken: { backgroundColor: 'rgba(67, 160, 71, 0.1)' },
  medName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  medNameTaken: { textDecorationLine: 'line-through', textDecorationColor: Colors.textHint },
  medMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  medDosage: { color: Colors.textSecondary, fontSize: 13 },
  medTimes: { color: Colors.textHint, fontSize: 11 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textHint,
    marginHorizontal: 8,
  },
  medInstructions: { color: Colors.textSecondary, fontSize: 12, flexShrink: 1 },
  medTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    marginLeft: 8,
  },
  medTimeBadgeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  medActionHistory: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(67, 160, 71, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  medActionEdit: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 125, 154, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  medActionDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 57, 53, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(173, 181, 189, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkCircleTaken: { backgroundColor: Colors.success, borderColor: Colors.success },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textHint,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, height: '100%' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontWeight: '600', color: Colors.textPrimary, fontSize: 14 },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addTimeBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
  },
  timeChipText: { color: Colors.primary, fontSize: 13 },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.3)',
    backgroundColor: Colors.surface,
  },
  dayChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  dayChipTextSelected: { color: '#FFFFFF' },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  timePickerSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  timePickerColumns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 220 },
  timePickerList: { width: 70, maxHeight: 220 },
  timePickerColon: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginHorizontal: 8 },
  timePickerOption: { paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  timePickerOptionSelected: { backgroundColor: 'rgba(46, 125, 154, 0.1)' },
  timePickerOptionText: { fontSize: 16, color: Colors.textSecondary },
  timePickerOptionTextSelected: { color: Colors.primary, fontWeight: '700' },
  timePickerConfirm: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerConfirmText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});
