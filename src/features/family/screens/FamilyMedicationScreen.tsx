import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
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
import { TabKey } from './familyMedication/constants';
import { MedCard } from './familyMedication/MedCard';
import { ComplianceCard } from './familyMedication/ComplianceCard';
import { HistoryTab } from './familyMedication/HistoryTab';
import { MedicationForm, AddMedicationTrigger } from './familyMedication/MedicationForm';
import { useAdherence } from './familyMedication/useAdherence';

/**
 * Port of Flutter's family_medication_screen.dart. The Flutter screen used
 * `showModalBottomSheet` + native `showTimePicker`; both are rebuilt here as
 * `Modal`-based sheets (see familyMedication/TimePickerModal). The Flutter
 * compliance card used a `LinearGradient`; there is no gradient dependency
 * installed, so ComplianceCard uses a solid background instead.
 */
export default function FamilyMedicationScreen() {
  // Medication store (elderly-side store, driven remotely by family here)
  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const logs = useMedicationStore((s) => s.logs);
  const logsError = useMedicationStore((s) => s.logsError);
  const loadMedications = useMedicationStore((s) => s.load);
  const deleteMedication = useMedicationStore((s) => s.deleteMedication);
  const fetchLogs = useMedicationStore((s) => s.fetchLogs);
  const allLogs = useMedicationStore((s) => s.allLogs);
  const fetchAllLogs = useMedicationStore((s) => s.fetchAllLogs);

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

  // Add/edit inline form: form mở rộng ngay trong trang (không phải modal
  // bottom-sheet). MedicationForm tự khởi tạo state từ `editing` qua `key`.
  const [formExpanded, setFormExpanded] = useState(false);
  const [editing, setEditing] = useState<MedicationItem | null>(null);

  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [rangePickerVisible, setRangePickerVisible] = useState(false);

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
    await Promise.all([
      dashLoad(),
      currentElderlyId ? loadMedications(currentElderlyId) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [dashLoad, loadMedications, currentElderlyId]);

  // Logs của mọi thuốc — nạp lại mỗi khi danh sách/trạng thái uống đổi.
  useEffect(() => {
    fetchAllLogs();
  }, [items, fetchAllLogs]);

  const displayAdherence = useAdherence(items, allLogs, rangeDays);

  const openAddForm = (existing?: MedicationItem) => {
    if (!currentElderlyId) {
      Alert.alert('Thông báo', 'Vui lòng liên kết người thân trước');
      return;
    }
    setEditing(existing ?? null);
    setFormExpanded(true);
  };

  const confirmDelete = (item: MedicationItem) => {
    Alert.alert('Xóa thuốc', `Bạn có chắc chắn muốn xóa "${item.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          deleteMedication(item.id);
        },
      },
    ]);
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

  const renderAddForm = () =>
    formExpanded ? (
      <MedicationForm
        key={editing?.id ?? 'new'}
        editing={editing}
        currentElderlyId={currentElderlyId}
        currentElderlyName={currentElderlyName}
        onClose={() => setFormExpanded(false)}
      />
    ) : (
      <AddMedicationTrigger onPress={() => openAddForm()} />
    );

  const renderTodayTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      <ComplianceCard
        displayAdherence={displayAdherence}
        rangeDays={rangeDays}
        onOpenRangePicker={() => setRangePickerVisible(true)}
      />
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {renderMedList('Chưa có thuốc nào được thêm')}
      <View style={{ height: 14 }} />
      {renderAddForm()}
    </ScrollView>
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'list', label: 'Danh sách' },
    { key: 'history', label: 'Lịch sử' },
  ];

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
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            <View
              style={[styles.tabIndicator, activeTab === tab.key && styles.tabIndicatorActive]}
            />
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
          {activeTab === 'history' && (
            <HistoryTab
              items={items}
              selectedMedId={selectedHistoryMedId}
              logs={logs}
              logsError={logsError}
              onSelectMed={handleSelectHistoryMed}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          )}
        </>
      )}

      {/* Compliance range picker modal */}
      <Modal
        visible={rangePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRangePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRangePickerVisible(false)}
        >
          <View style={styles.rangeModalSheet}>
            <Text style={styles.modalTitle}>Xem theo</Text>
            {([7, 30] as const).map((option, index) => (
              <TouchableOpacity
                key={option}
                style={[styles.rangeModalOption, index > 0 && styles.rangeModalOptionDivider]}
                onPress={() => {
                  setRangeDays(option);
                  setRangePickerVisible(false);
                }}
              >
                <Text style={styles.rangeModalOptionText}>{option} ngày</Text>
                {rangeDays === option && (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  addBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.primary },
  tabIndicator: {
    height: 2,
    width: '60%',
    marginTop: 8,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  tabIndicatorActive: { backgroundColor: Colors.primary },

  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 20 },
  emptyBox: {
    paddingVertical: 40,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14, marginTop: 12, textAlign: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  rangeModalSheet: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  rangeModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rangeModalOptionDivider: { borderTopWidth: 1, borderTopColor: Colors.divider },
  rangeModalOptionText: { fontSize: 15, color: Colors.textPrimary },
});
