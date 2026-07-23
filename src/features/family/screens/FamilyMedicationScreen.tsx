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

  RefreshControl,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useMedicationStore } from '../../elderly/store/medicationStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import type { MedicationItem } from '../../../shared/types';

/**
 * Port of Flutter's family_medication_screen.dart.
 *
 * The Flutter screen used `showModalBottomSheet` for the add/edit form and
 * native `showTimePicker`. Neither is available without adding a dependency
 * here, so both are rebuilt as `Modal`-based sheets/pickers (same approach
 * used by ElderlyEditProfileScreen for its blood-type dropdown).
 *
 * The Flutter compliance card used a `LinearGradient` background
 * (AppColors.primary -> #1A5570). There is no gradient dependency installed
 * in this project, so the card falls back to a solid `Colors.primaryDark`
 * background — the only visual deviation from the source.
 */

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
  // Medication store (elderly-side store, driven remotely by family here)
  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const logs = useMedicationStore((s) => s.logs);
  const logsError = useMedicationStore((s) => s.logsError);
  const loadMedications = useMedicationStore((s) => s.load);
  const addMedication = useMedicationStore((s) => s.addMedication);
  const updateMedication = useMedicationStore((s) => s.updateMedication);
  const deleteMedication = useMedicationStore((s) => s.deleteMedication);
  const fetchLogs = useMedicationStore((s) => s.fetchLogs);
  const allLogs = useMedicationStore((s) => s.allLogs);
  const fetchAllLogs = useMedicationStore((s) => s.fetchAllLogs);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  // Family dashboard store — provides the currently-selected linked elderly
  const dashData = useFamilyDashboardStore((s) => s.data);
  const dashLoad = useFamilyDashboardStore((s) => s.load);

  const currentElderly = useMemo(() => {
    if (!dashData || dashData.linkedElderly.length === 0) return null;
    if (dashData.selectedIndex >= dashData.linkedElderly.length) return null;
    return dashData.linkedElderly[dashData.selectedIndex];
  }, [dashData]);
  const currentElderlyId = currentElderly?.elderlyId ?? null;
  const currentElderlyName = currentElderly?.elderlyName ?? 'Người thân';

  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHistoryMedId, setSelectedHistoryMedId] = useState<string | null>(null);

  // Add/edit inline form state (wireframe A2: form mở rộng ngay trong
  // trang, KHÔNG phải modal bottom-sheet như bản trước).
  const [formExpanded, setFormExpanded] = useState(false);
  const [editing, setEditing] = useState<MedicationItem | null>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);
  const [times, setTimes] = useState<TimeValue[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [rangeDays, setRangeDays] = useState<7 | 30>(7);

  // Time picker modal state
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    dashLoad(controller.signal);
    return () => controller.abort();
  }, [dashLoad]);

  useEffect(() => {
    if (!currentElderlyId) return;
    const controller = new AbortController();
    loadMedications(currentElderlyId, controller.signal);
    return () => controller.abort();
  }, [currentElderlyId, loadMedications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dashLoad(), currentElderlyId ? loadMedications(currentElderlyId) : Promise.resolve()]);
    setRefreshing(false);
  }, [dashLoad, loadMedications, currentElderlyId]);

  // Logs của mọi thuốc — nạp lại mỗi khi danh sách/trạng thái uống đổi
  // (toggleTaken thay items -> effect chạy -> cột hôm nay cập nhật ngay)
  useEffect(() => {
    fetchAllLogs();
  }, [items, fetchAllLogs]);

  const taken = items.filter((m) => m.taken).length;
  const total = items.length;

  /**
   * Tỉ lệ tuân thủ theo ngày, tính từ logs thật:
   *   scheduled(ngày) = tổng số cữ của các thuốc active vào thứ đó
   *   taken(ngày)     = số log TAKEN trong ngày đó
   * 7d  -> tuần hiện tại (T2..CN); ngày tương lai = null (không vẽ cột)
   * 30d -> trung bình theo thứ trong 30 ngày gần nhất
   */
  const weeklyAdherence = useMemo<(number | null)[]>(() => {
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = startOfDay(new Date());
    const mondayOffset = (today.getDay() + 6) % 7; // Mon=0..Sun=6

    const scheduledOnWeekday = (weekday: number): number =>
      items.reduce((sum, m) => {
        const active = m.daysOfWeek.length === 0 || m.daysOfWeek.includes(weekday);
        if (!active) return sum;
        return sum + Math.max(1, m.scheduleTimes.length);
      }, 0);

    const takenCountByDate = new Map<string, number>();
    for (const log of allLogs) {
      if (log.status !== 'TAKEN') continue;
      const d = new Date(log.takenAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = startOfDay(d).toISOString();
      takenCountByDate.set(key, (takenCountByDate.get(key) ?? 0) + 1);
    }

    if (rangeDays === 7) {
      return Array.from({ length: 7 }, (_, weekday) => {
        const date = new Date(today);
        date.setDate(today.getDate() - mondayOffset + weekday);
        if (date.getTime() > today.getTime()) return null; // ngày tương lai
        const scheduled = scheduledOnWeekday(weekday);
        if (scheduled === 0) return null;
        const takenCount = takenCountByDate.get(date.toISOString()) ?? 0;
        return Math.min(1, takenCount / scheduled);
      });
    }

    // 30d: gom theo thứ
    const takenByWeekday = Array(7).fill(0);
    const daysByWeekday = Array(7).fill(0);
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const weekday = (date.getDay() + 6) % 7;
      daysByWeekday[weekday] += 1;
      takenByWeekday[weekday] += takenCountByDate.get(date.toISOString()) ?? 0;
    }
    return Array.from({ length: 7 }, (_, weekday) => {
      const scheduledPerDay = scheduledOnWeekday(weekday);
      const totalScheduled = scheduledPerDay * daysByWeekday[weekday];
      if (totalScheduled === 0) return null;
      return Math.min(1, takenByWeekday[weekday] / totalScheduled);
    });
  }, [items, allLogs, rangeDays]);

  const openAddForm = (existing?: MedicationItem) => {
    if (!currentElderlyId) {
      Alert.alert('Thông báo', 'Vui lòng liên kết người thân trước');
      return;
    }
    setEditing(existing ?? null);
    setName(existing?.name ?? '');
    setDosage(existing?.dosage ?? '');
    setInstructions(existing?.instructions ?? '');
    setShowNotesField(!!existing?.instructions);
    setTimes(
      (existing?.scheduleTimes ?? []).map((t) => {
        const [h, m] = t.split(':');
        return { hour: Number(h) || 0, minute: Number(m) || 0 };
      }),
    );
    setSelectedDays([...(existing?.daysOfWeek ?? [])]);
    setFormExpanded(true);
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
    setFormExpanded(false);
  };

  const confirmDelete = (item: MedicationItem) => {
    Alert.alert(
      'Xóa thuốc',
      `Bạn có chắc chắn muốn xóa "${item.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteMedication(item.id);
          },
        },
      ],
    );
  };

  const handleToggle = (item: MedicationItem) => {
    toggleTaken(item.id, (error) => Alert.alert('Lỗi', error));
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
            onEdit={() => openAddForm(m)}
            onDelete={() => confirmDelete(m)}
          />
        ))}
      </View>
    );
  };

  const renderComplianceCard = () => {
    const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0 ... Sun=6
    return (
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeaderRow}>
          <Text style={styles.complianceHeaderTitle}>Tỉ lệ tuân thủ · {rangeDays} ngày</Text>
          <TouchableOpacity
            style={styles.rangeDropdown}
            onPress={() => setRangeDays((prev) => (prev === 7 ? 30 : 7))}
          >
            <Text style={styles.rangeDropdownText}>{rangeDays}d</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 16 }} />
        <View style={styles.weekBarRow}>
          {HISTORY_DAY_LABELS.map((label, i) => {
            const isToday = i === todayIndex;
            const ratio = weeklyAdherence[i];
            // Cột tính từ logs thật; null = ngày tương lai hoặc không có
            // cữ thuốc nào -> chỉ vẽ track rỗng.
            const barHeight = ratio === null ? 0 : 8 + ratio * 76;
            const fillColor = isToday
              ? Colors.primary
              : ratio !== null && ratio < 0.5
                ? Colors.warning
                : '#9CC9C4';
            return (
              <View key={label} style={styles.weekBarCol}>
                <View style={styles.weekBarTrack}>
                  {ratio !== null && (
                    <View
                      style={[styles.weekBarFill, { height: barHeight, backgroundColor: fillColor }]}
                    />
                  )}
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
      <View style={{ height: 14 }} />
      {renderAddForm()}
    </ScrollView>
  );

  const renderListTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {renderMedList('Chưa có thuốc nào được thêm')}
      <View style={{ height: 14 }} />
      {renderAddForm()}
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

  const renderAddForm = () => {
    if (!formExpanded) {
      return (
        <TouchableOpacity style={styles.addTriggerRow} onPress={() => openAddForm()}>
          <Ionicons name="add" size={18} color={Colors.textSecondary} />
          <Text style={styles.addTriggerText}>Thêm thuốc mới</Text>
        </TouchableOpacity>
      );
    }
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
          onChangeText={setName}
        />

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

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() =>
              Alert.alert(
                'Sắp ra mắt',
                'Tính năng tải ảnh đơn thuốc lên đang được phát triển (backend hiện chưa có endpoint upload file).',
              )
            }
          >
            <Ionicons name="camera-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.secondaryActionText}>Ảnh đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => setShowNotesField((v) => !v)}>
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
          <Text style={styles.saveBlackBtnText}>{editing ? 'Cập nhật & Bật nhắc nhở' : 'Lưu & Bật nhắc nhở'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', marginTop: 10 }} onPress={() => setFormExpanded(false)}>
          <Text style={{ color: Colors.textHint, fontSize: 13 }}>Hủy</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý thuốc</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setActiveTab('today');
            openAddForm();
          }}
        >
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

      {/* Time picker modal */}
      <Modal
        visible={timePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTimePickerVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.timePickerSheet}>
            <Text style={styles.modalTitle}>Chọn giờ</Text>
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
              <Text style={styles.timePickerConfirmBtnText}>Thêm</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function dayPatternLabel(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 0 || daysOfWeek.length === 7) return 'Hàng ngày';
  return [...daysOfWeek].sort((a, b) => a - b).map((d) => HISTORY_DAY_LABELS[d]).join(',');
}

function MedCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MedicationItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const now = Date.now();
  const isMissed = !item.taken && !!item.nextDoseTime && new Date(item.nextDoseTime).getTime() < now;
  const statusLabel = item.taken ? 'Đã uống' : isMissed ? 'Bỏ lỡ' : 'Sắp tới';
  const statusColor = item.taken ? Colors.success : isMissed ? Colors.error : Colors.warning;
  const firstTime = item.scheduleTimes[0] ?? (item.nextDoseTime ? formatIsoTime(item.nextDoseTime) : '');
  const subtitleParts = [firstTime, item.instructions, dayPatternLabel(item.daysOfWeek)].filter(Boolean);

  return (
    <View style={styles.medCard}>
      <View style={styles.medIconBoxDashed}>
        <Ionicons name="medkit-outline" size={22} color={Colors.error} />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{item.name} {item.dosage}</Text>
        <Text style={styles.medSubRow}>{subtitleParts.join(' · ')}</Text>
        <View style={styles.medStatusRow}>
          <Text style={[styles.medStatusMark, { color: statusColor }]}>{item.taken ? '✓' : '✗'}</Text>
          <Text style={[styles.medStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.medCardActions}>
        <TouchableOpacity style={styles.iconBtnEdit} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtnDelete} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.2)',
  },
  complianceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complianceHeaderTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  rangeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.4)',
  },
  rangeDropdownText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  weekBarRow: { flexDirection: 'row' },
  weekBarCol: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  weekBarTrack: { height: 84, justifyContent: 'flex-end' },
  weekBarFill: { width: '100%', borderRadius: 6 },
  weekBarLabel: { color: Colors.textHint, fontSize: 11, marginTop: 6 },
  weekBarLabelActive: { color: Colors.primary, fontWeight: '700' },

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
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.2)',
  },
  medIconBoxDashed: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(173,181,189,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medInfo: { flex: 1, marginLeft: 14 },
  medName: { fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  medSubRow: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  medStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  medStatusMark: { fontSize: 13, fontWeight: '700' },
  medStatusText: { fontSize: 12, fontWeight: '600' },
  medCardActions: { justifyContent: 'flex-start', gap: 6 },
  iconBtnEdit: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(46,125,154,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDelete: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(229,57,53,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  // Add/edit inline form (wireframe A2 image 2)
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
  timeFieldBtn: { flex: 1, marginTop: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  daysLabel: { fontWeight: '600', color: Colors.textPrimary, fontSize: 14, marginTop: 14, marginBottom: 8 },
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

  // Blood-type-style modal picker (shared visual language)
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