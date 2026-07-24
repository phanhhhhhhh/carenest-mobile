import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,

  KeyboardAvoidingView,
  Image,
  Platform,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAppointmentStore } from '../store/appointmentStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import type { AppointmentItem } from '../../../shared/types';



const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Sắp tới',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  RESCHEDULED: 'Đã dời lịch',
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: Colors.primary,
  COMPLETED: Colors.success,
  CANCELLED: Colors.error,
  RESCHEDULED: Colors.warning,
};

const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const WEEK_DAYS = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'];

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? Colors.textHint;
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function formatDate(dt: Date): string {
  const weekdayIdx = (dt.getDay() + 6) % 7;
  return `${WEEK_DAYS[weekdayIdx]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function formatTime(dt: Date): string {
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function FamilyAppointmentsScreen() {
  const isLoading = useAppointmentStore((s) => s.isLoading);
  const error = useAppointmentStore((s) => s.error);
  const appointments = useAppointmentStore((s) => s.appointments);
  const isSaving = useAppointmentStore((s) => s.isSaving);
  const load = useAppointmentStore((s) => s.load);
  const upcoming = useAppointmentStore((s) => s.upcoming);
  const past = useAppointmentStore((s) => s.past);
  const create = useAppointmentStore((s) => s.create);
  const update = useAppointmentStore((s) => s.update);
  const remove = useAppointmentStore((s) => s.delete);
  const updateStatus = useAppointmentStore((s) => s.updateStatus);

  // Family dashboard store — provides the currently-selected linked elderly
  const dashData = useFamilyDashboardStore((s) => s.data);
  const dashLoad = useFamilyDashboardStore((s) => s.load);
  const currentElderlyId = useMemo(() => {
    if (!dashData || dashData.linkedElderly.length === 0) return null;
    if (dashData.selectedIndex >= dashData.linkedElderly.length) return null;
    return dashData.linkedElderly[dashData.selectedIndex].elderlyId;
  }, [dashData]);

  const [tab, setTab] = useState<0 | 1>(0);
  const [refreshing, setRefreshing] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<AppointmentItem | null>(null);
  const [doctor, setDoctor] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    dashLoad(controller.signal);
    return () => controller.abort();
  }, [dashLoad]);

  useEffect(() => {
    if (!currentElderlyId) return;
    const controller = new AbortController();
    load(currentElderlyId, controller.signal);
    return () => controller.abort();
  }, [currentElderlyId, load]);

  const upcomingList = upcoming();
  const pastList = past();

  const onRefresh = async () => {
    setRefreshing(true);
    await load(currentElderlyId ?? undefined);
    setRefreshing(false);
  };

  const openAddSheet = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    setEditing(null);
    setDoctor('');
    setSpecialty('');
    setLocation('');
    setNotes('');
    setSelectedDate(defaultDate);
    setSelectedHour(defaultDate.getHours());
    setSelectedMinute(defaultDate.getMinutes());
    setSheetVisible(true);
  };

  const openEditSheet = (item: AppointmentItem) => {
    const dt = new Date(item.appointmentDate);
    setEditing(item);
    setDoctor(item.doctor);
    setSpecialty(item.specialty);
    setLocation(item.location ?? '');
    setNotes(item.notes ?? '');
    setSelectedDate(dt);
    setSelectedHour(dt.getHours());
    setSelectedMinute(dt.getMinutes());
    setSheetVisible(true);
  };

  const closeSheet = () => setSheetVisible(false);

  const submitSheet = async () => {
    if (doctor.trim().length === 0 || specialty.trim().length === 0) {
      return;
    }
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
    if (ok) closeSheet();
  };

  const confirmDelete = (item: AppointmentItem) => {
    Alert.alert(
      'Xóa lịch hẹn',
      `Bạn có chắc chắn muốn xóa lịch hẹn với "${item.doctor}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => remove(item.id),
        },
      ],
    );
  };

  const renderList = (items: AppointmentItem[], showActions: boolean) => {
    if (items.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          <Image
            source={require('../../../../assets/mascot/mascot_confused.jpg')}
            style={{ width: 130, height: 130 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>Chưa có lịch hẹn nào</Text>
          <Text style={styles.emptySubtext}>Nhấn + để thêm lịch hẹn</Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            showActions={showActions}
            onEdit={() => openEditSheet(item)}
            onDelete={() => confirmDelete(item)}
            onComplete={() => updateStatus(item.id, 'COMPLETED')}
            onCancel={() => updateStatus(item.id, 'CANCELLED')}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch hẹn</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab(0)}>
          <Text style={[styles.tabText, tab === 0 && styles.tabTextActive]}>
            Sắp tới ({upcomingList.length})
          </Text>
          {tab === 0 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab(1)}>
          <Text style={[styles.tabText, tab === 1 && styles.tabTextActive]}>
            Đã qua ({pastList.length})
          </Text>
          {tab === 1 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {isLoading && appointments.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error && appointments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" color={Colors.textHint} size={48} />
          <View style={{ height: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderList(tab === 0 ? upcomingList : pastList, tab === 0)
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddSheet} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeSheet} />
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHandle} />
              <View style={{ height: 16 }} />
              <Text style={styles.sheetTitle}>
                {editing ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
              </Text>
              <View style={{ height: 20 }} />

              <FormField icon="person" placeholder="Tên bác sĩ" hint="VD: BS. Smith" value={doctor} onChangeText={setDoctor} />
              <View style={{ height: 14 }} />
              <FormField icon="medical" placeholder="Chuyên khoa" hint="VD: Tim mạch" value={specialty} onChangeText={setSpecialty} />
              <View style={{ height: 14 }} />
              <FormField icon="location" placeholder="Địa điểm (tùy chọn)" hint="VD: Bệnh viện Thành phố" value={location} onChangeText={setLocation} />
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
                style={styles.submitBtn}
                onPress={submitSheet}
                disabled={isSaving}
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
      </Modal>

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
    </SafeAreaView>
  );
}


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


function AppointmentCard({
  item,
  showActions,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
}: {
  item: AppointmentItem;
  showActions: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const color = statusColor(item.status);
  const label = statusLabel(item.status);
  const dt = new Date(item.appointmentDate);

  return (
    <View style={[styles.card, { borderColor: withAlpha(color, 0.2) }]}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.1) }]}>
          <Ionicons name="calendar" color={color} size={22} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.doctorName}>{item.doctor}</Text>
          {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: withAlpha(color, 0.1) }]}>
          <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={{ height: 14 }} />
      <InfoRow icon="calendar-outline" text={formatDate(dt)} />
      <View style={{ height: 6 }} />
      <InfoRow icon="time-outline" text={formatTime(dt)} />
      {!!item.location && (
        <>
          <View style={{ height: 6 }} />
          <InfoRow icon="location-outline" text={item.location} />
        </>
      )}
      {!!item.notes && (
        <>
          <View style={{ height: 10 }} />
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        </>
      )}

      {showActions && (
        <>
          <View style={{ height: 14 }} />
          <View style={styles.divider} />
          <View style={{ height: 10 }} />
          <View style={styles.actionsRow}>
            <View style={styles.actionsGroup}>
              <ActionChip icon="create-outline" label="Sửa" color={Colors.primary} onPress={onEdit} />
              <View style={{ width: 8 }} />
              <ActionChip icon="trash-outline" label="Xóa" color={Colors.error} onPress={onDelete} />
            </View>
            <View style={styles.actionsGroup}>
              <ActionChip icon="checkmark-circle-outline" label="Hoàn thành" color={Colors.success} onPress={onComplete} />
              <View style={{ width: 8 }} />
              <ActionChip icon="close-circle-outline" label="Hủy" color={Colors.warning} onPress={onCancel} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} color={Colors.textHint} size={15} />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionChip, { backgroundColor: withAlpha(color, 0.06), borderColor: withAlpha(color, 0.2) }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.actionChipText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}


function DatePickerModal({
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


function TimePickerModal({
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
  }, [visible]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.pickerModalSheet}>
          <Text style={styles.modalTitle}>Chọn giờ</Text>
          <View style={styles.pickerColumns}>
            <PickerColumn data={hours} selected={h} onSelect={setH} renderLabel={(v) => String(v).padStart(2, '0')} />
            <PickerColumn data={minutes} selected={m} onSelect={setM} renderLabel={(v) => String(v).padStart(2, '0')} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textHint },
  tabTextActive: { color: Colors.primary },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '60%',
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 96 },
  emptyState: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, marginTop: 12 },
  emptySubtext: { color: Colors.textHint, fontSize: 13, marginTop: 4 },
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  doctorName: { fontWeight: '700', fontSize: 16, color: Colors.textPrimary },
  specialty: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoRowText: { color: Colors.textSecondary, fontSize: 13, marginLeft: 8 },
  notesBox: { width: '100%', padding: 10, backgroundColor: Colors.background, borderRadius: 10 },
  notesText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: Colors.divider },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionsGroup: { flexDirection: 'row' },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionChipText: { fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
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
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
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
