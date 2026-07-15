import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useMedicationStore } from '../../elderly/store/medicationStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import type { MedicationItem } from '../../../shared/types';



const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HISTORY_DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

type TabKey = 'today' | 'list' | 'history';

interface TimeValue {
  hour: number;
  minute: number;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatIsoTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatLogDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function FamilyMedicationScreen() {
  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const logs = useMedicationStore((s) => s.logs);
  const logsError = useMedicationStore((s) => s.logsError);
  const loadMedications = useMedicationStore((s) => s.load);
  const addMedication = useMedicationStore((s) => s.addMedication);
  const updateMedication = useMedicationStore((s) => s.updateMedication);
  const deleteMedication = useMedicationStore((s) => s.deleteMedication);
  const fetchLogs = useMedicationStore((s) => s.fetchLogs);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  const dashData = useFamilyDashboardStore((s) => s.data);
  const dashLoad = useFamilyDashboardStore((s) => s.load);

  const currentElderly = useMemo(() => {
    if (!dashData || dashData.linkedElderly.length === 0) return null;
    if (dashData.selectedIndex >= dashData.linkedElderly.length) return null;
    return dashData.linkedElderly[dashData.selectedIndex];
  }, [dashData]);
  const currentElderlyId = currentElderly?.elderlyId ?? null;
  const currentElderlyName = currentElderly?.elderlyName ?? 'Loved one';

  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHistoryMedId, setSelectedHistoryMedId] = useState<string | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<MedicationItem | null>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState<TimeValue[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);

  useEffect(() => {
    dashLoad();
  }, [dashLoad]);

  useEffect(() => {
    if (currentElderlyId) {
      loadMedications(currentElderlyId);
    }
  }, [currentElderlyId, loadMedications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dashLoad(), currentElderlyId ? loadMedications(currentElderlyId) : Promise.resolve()]);
    setRefreshing(false);
  }, [dashLoad, loadMedications, currentElderlyId]);

  const taken = items.filter((m) => m.taken).length;
  const total = items.length;
  const progress = total === 0 ? 0 : taken / total;

  const openAddSheet = (existing?: MedicationItem) => {
    if (!currentElderlyId) {
      Alert.alert('Notice', 'Please link a family member first');
      return;
    }
    setEditing(existing ?? null);
    setName(existing?.name ?? '');
    setDosage(existing?.dosage ?? '');
    setInstructions(existing?.instructions ?? '');
    setTimes(
      (existing?.scheduleTimes ?? []).map((t) => {
        const [h, m] = t.split(':');
        return { hour: Number(h) || 0, minute: Number(m) || 0 };
      }),
    );
    setSelectedDays([...(existing?.daysOfWeek ?? [])]);
    setSheetVisible(true);
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

  const handleToggle = (item: MedicationItem) => {
    toggleTaken(item.id, (error) => Alert.alert('Error', error));
  };

  const handleSelectHistoryMed = (id: string) => {
    setSelectedHistoryMedId(id);
    fetchLogs(id);
  };

  const renderMedList = (emptyHint: string) => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Image
            source={require('../../../../assets/mascot/mascot_confused.jpg')}
            style={{ width: 110, height: 110 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>{emptyHint}</Text>
        </View>
      );
    }
    return (
      <View>
        {items.map((m) => (
          <MedCard
            key={m.id}
            item={m}
            onToggle={() => handleToggle(m)}
            onEdit={() => openAddSheet(m)}
            onDelete={() => confirmDelete(m)}
          />
        ))}
      </View>
    );
  };

  const renderComplianceCard = () => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    return (
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeaderRow}>
          <Text style={styles.complianceHeaderLabel}>Medication adherence</Text>
          <View style={styles.compliancePctBadge}>
            <Text style={styles.compliancePctText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
        <Text style={styles.complianceCount}>
          Taken {taken} / {total} doses
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(1, progress) * 100}%` }]} />
        </View>
        <Text style={styles.complianceSub}>
          {total === 0
            ? 'Add medication to start tracking'
            : taken === total
              ? '🎉 All medications taken today!'
              : `${total - taken} doses remaining`}
        </Text>
        <Text style={styles.complianceWeekLabel}>Tỉ lệ tuân thủ · 7 ngày</Text>
        <View style={styles.weekBarRow}>
          {HISTORY_DAY_LABELS.map((label, i) => {
            const isToday = i === todayIndex;
            const barHeight = isToday ? 10 + progress * 26 : 18;
            return (
              <View key={label} style={styles.weekBarCol}>
                <View style={styles.weekBarTrack}>
                  <View
                    style={[
                      styles.weekBarFill,
                      { height: barHeight, opacity: isToday ? 1 : 0.35, backgroundColor: '#FFFFFF' },
                    ]}
                  />
                </View>
                <Text style={[styles.weekBarLabel, isToday && styles.weekBarLabelActive]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTodayTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {renderComplianceCard()}
      <Text style={styles.sectionTitle}>Lịch thuốc hôm nay</Text>
      <View style={{ height: 12 }} />
      {renderMedList('Chưa có thuốc nào hôm nay')}
    </ScrollView>
  );

  const renderListTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {renderMedList('Chưa có thuốc nào được thêm')}
    </ScrollView>
  );

  const renderHistoryTab = () => {
    if (items.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Chưa có thuốc nào để xem lịch sử</Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.chipsWrap}>
          {items.map((m) => {
            const isSelected = selectedHistoryMedId === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.historyChip, isSelected && styles.historyChipSelected]}
                onPress={() => handleSelectHistoryMed(m.id)}
              >
                <Text style={[styles.historyChipText, isSelected && styles.historyChipTextSelected]}>{m.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 20 }} />
        {selectedHistoryMedId === null ? (
          <View style={styles.historyHintBox}>
            <Text style={styles.historyHintText}>Chọn 1 loại thuốc phía trên để xem lịch sử 30 ngày</Text>
          </View>
        ) : logsError !== null ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{logsError}</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.historyHintBox}>
            <Text style={styles.historyHintText}>Chưa có lịch sử uống thuốc</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Ionicons
                name={log.status === 'TAKEN' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={log.status === 'TAKEN' ? Colors.success : Colors.error}
              />
              <Text style={styles.logDate}>{formatLogDate(log.takenAt)}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.logStatus, { color: log.status === 'TAKEN' ? Colors.success : Colors.error }]}>
                {log.status === 'TAKEN' ? 'Đã uống' : 'Bỏ lỡ'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'list', label: 'Danh sách' },
    { key: 'history', label: 'Lịch sử' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication Manager</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openAddSheet()}>
          <Ionicons name="add" size={18} color={Colors.primary} />
          <Text style={styles.addBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            <View style={[styles.tabIndicator, activeTab === tab.key && styles.tabIndicatorActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          {activeTab === 'today' && renderTodayTab()}
          {activeTab === 'list' && renderListTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </>
      )}

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setSheetVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheetContainer}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {editing ? `Edit medication for ${currentElderlyName}` : `Add medication for ${currentElderlyName}`}
              </Text>

              <View style={styles.inputWrap}>
                <Ionicons name="medkit" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Medication name"
                  placeholderTextColor={Colors.textHint}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="flask-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Dosage"
                  placeholderTextColor={Colors.textHint}
                  value={dosage}
                  onChangeText={setDosage}
                />
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.timeRowLabel}>Medication time</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.addTimeBtn}
                  onPress={() => {
                    setPickerHour(8);
                    setPickerMinute(0);
                    setTimePickerVisible(true);
                  }}
                >
                  <Ionicons name="add" size={16} color={Colors.primary} />
                  <Text style={styles.addTimeBtnText}>Add time</Text>
                </TouchableOpacity>
              </View>

              {times.length > 0 && (
                <View style={styles.chipsWrap}>
                  {times.map((t, i) => (
                    <View key={`${t.hour}-${t.minute}-${i}`} style={styles.timeChip}>
                      <Text style={styles.timeChipText}>
                        {pad2(t.hour)}:{pad2(t.minute)}
                      </Text>
                      <TouchableOpacity onPress={() => removeTime(i)}>
                        <Ionicons name="close" size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.daysLabel}>Days of the week</Text>
              <View style={styles.daysRow}>
                {DAY_LABELS.map((label, i) => {
                  const selected = selectedDays.includes(i);
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[styles.dayBox, selected && styles.dayBoxSelected]}
                      onPress={() => toggleDay(i)}
                    >
                      <Text style={[styles.dayBoxText, selected && styles.dayBoxTextSelected]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Instructions (optional)"
                  placeholderTextColor={Colors.textHint}
                  value={instructions}
                  onChangeText={setInstructions}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (!name.trim() || !dosage.trim()) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!name.trim() || !dosage.trim()}
              >
                <Text style={styles.submitBtnText}>{editing ? 'Update' : 'Add medication'}</Text>
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
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTimePickerVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.timePickerSheet}>
            <Text style={styles.modalTitle}>Select time</Text>
            <View style={styles.timePickerColumns}>
              <FlatList
                data={HOURS}
                keyExtractor={(h) => `h-${h}`}
                style={styles.timePickerList}
                renderItem={({ item: h }) => (
                  <TouchableOpacity
                    style={[styles.timePickerOption, pickerHour === h && styles.timePickerOptionSelected]}
                    onPress={() => setPickerHour(h)}
                  >
                    <Text style={[styles.timePickerOptionText, pickerHour === h && styles.timePickerOptionTextSelected]}>
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
                    style={[styles.timePickerOption, pickerMinute === m && styles.timePickerOptionSelected]}
                    onPress={() => setPickerMinute(m)}
                  >
                    <Text style={[styles.timePickerOptionText, pickerMinute === m && styles.timePickerOptionTextSelected]}>
                      {pad2(m)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <TouchableOpacity style={styles.timePickerConfirmBtn} onPress={confirmAddTime}>
              <Text style={styles.timePickerConfirmBtnText}>Add</Text>
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
}: {
  item: MedicationItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.medCard, item.taken ? styles.medCardTaken : styles.medCardPending]}>
      <View style={[styles.medIconBox, item.taken ? styles.medIconBoxTaken : styles.medIconBoxPending]}>
        <Ionicons name="medkit" size={24} color={item.taken ? Colors.success : Colors.primary} />
      </View>
      <View style={styles.medInfo}>
        <Text style={[styles.medName, item.taken && styles.medNameTaken]}>{item.name}</Text>
        <View style={styles.medSubRow}>
          <Text style={styles.medDosage}>{item.dosage}</Text>
          {item.scheduleTimes.length > 0 && (
            <>
              <Ionicons name="time-outline" size={12} color={Colors.textHint} style={{ marginLeft: 6 }} />
              <Text style={styles.medTimes}> {item.scheduleTimes.join(', ')}</Text>
            </>
          )}
        </View>
      </View>
      {item.nextDoseTime != null && (
        <View style={styles.nextDoseBadge}>
          <Text style={styles.nextDoseBadgeText}>{formatIsoTime(item.nextDoseTime)}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.iconBtnEdit} onPress={onEdit}>
        <Ionicons name="create-outline" size={16} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtnDelete} onPress={onDelete}>
        <Ionicons name="trash-outline" size={16} color={Colors.error} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleCircle, item.taken && styles.toggleCircleTaken]}
        onPress={onToggle}
      >
        {item.taken && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  addBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.primary },
  tabIndicator: { height: 2, width: '60%', marginTop: 8, backgroundColor: 'transparent', borderRadius: 1 },
  tabIndicatorActive: { backgroundColor: Colors.primary },

  tabContent: { padding: 16 },

  complianceCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  complianceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complianceHeaderLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  compliancePctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  compliancePctText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  complianceCount: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 8 },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: { height: 10, borderRadius: 6, backgroundColor: '#81D4FA' },
  complianceSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 10 },
  complianceWeekLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 16 },
  weekBarRow: { flexDirection: 'row', marginTop: 8 },
  weekBarCol: { flex: 1, alignItems: 'center', paddingHorizontal: 3 },
  weekBarTrack: { height: 32, justifyContent: 'flex-end' },
  weekBarFill: { width: 14, borderRadius: 4 },
  weekBarLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 },
  weekBarLabelActive: { color: '#FFFFFF', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 20 },

  emptyBox: {
    paddingVertical: 40,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14, marginTop: 12, textAlign: 'center' },

  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
  },
  medCardTaken: { borderColor: 'rgba(67,160,71,0.3)' },
  medCardPending: { borderColor: 'rgba(173,181,189,0.15)' },
  medIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  medIconBoxTaken: { backgroundColor: 'rgba(67,160,71,0.1)' },
  medIconBoxPending: { backgroundColor: 'rgba(46,125,154,0.08)' },
  medInfo: { flex: 1, marginLeft: 14 },
  medName: { fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  medNameTaken: { textDecorationLine: 'line-through' },
  medSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'wrap' },
  medDosage: { color: Colors.textSecondary, fontSize: 13 },
  medTimes: { color: Colors.textHint, fontSize: 11 },
  nextDoseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46,125,154,0.08)',
    marginRight: 8,
  },
  nextDoseBadgeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  iconBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(46,125,154,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  iconBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(229,57,53,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  toggleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(173,181,189,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCircleTaken: { backgroundColor: Colors.success, borderColor: Colors.success },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  historyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyChipSelected: { backgroundColor: 'rgba(46,125,154,0.15)', borderColor: Colors.primary },
  historyChipText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  historyChipTextSelected: { color: Colors.primary },

  historyHintBox: { paddingTop: 40, alignItems: 'center' },
  historyHintText: { color: Colors.textHint, fontSize: 13, textAlign: 'center' },
  errorText: { color: Colors.error, fontSize: 13 },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  logDate: { fontSize: 13, color: Colors.textPrimary, marginLeft: 10 },
  logStatus: { fontSize: 12, fontWeight: '600' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  sheetHandle: { width: 40, height: 3, borderRadius: 2, backgroundColor: Colors.textHint, alignSelf: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timeRowLabel: { fontWeight: '600', color: Colors.textPrimary, fontSize: 14, marginLeft: 8 },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addTimeBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
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
  daysLabel: { fontWeight: '600', color: Colors.textPrimary, fontSize: 14, marginTop: 14, marginBottom: 8 },
  daysRow: { flexDirection: 'row' },
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
  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },

  timePickerSheet: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  timePickerColumns: { flexDirection: 'row', height: 200, justifyContent: 'center' },
  timePickerList: { width: 70 },
  timePickerColon: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, alignSelf: 'center', marginHorizontal: 8 },
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
