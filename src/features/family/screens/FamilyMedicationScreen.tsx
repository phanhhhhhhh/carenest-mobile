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
import { MedicationForm } from './familyMedication/MedicationForm';
import { useAdherence } from './familyMedication/useAdherence';

export default function FamilyMedicationScreen() {
  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const logs = useMedicationStore((s) => s.logs);
  const logsError = useMedicationStore((s) => s.logsError);
  const loadMedications = useMedicationStore((s) => s.load);
  const deleteMedication = useMedicationStore((s) => s.deleteMedication);
  const fetchLogs = useMedicationStore((s) => s.fetchLogs);
  const allLogs = useMedicationStore((s) => s.allLogs);
  const fetchAllLogs = useMedicationStore((s) => s.fetchAllLogs);

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
            style={{ width: 120, height: 120, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>{emptyHint}</Text>
        </View>
      );
    }
    return (
      <View>
        {items.map((item) => (
          <MedCard
            key={item.id}
            item={item}
            onEdit={() => openAddForm(item)}
            onDelete={() => confirmDelete(item)}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.appBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appBarTitle}>Quản lý thuốc uống</Text>
          <Text style={styles.appBarSubtitle}>Đang chăm sóc: {currentElderlyName}</Text>
        </View>
        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => openAddForm()}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addTopBtnText}>Thêm thuốc</Text>
        </TouchableOpacity>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'today' && styles.tabButtonActive]}
          onPress={() => setActiveTab('today')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="today-outline"
            size={16}
            color={activeTab === 'today' ? Colors.primary : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            Hôm nay ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'list' && styles.tabButtonActive]}
          onPress={() => setActiveTab('list')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === 'list' ? Colors.primary : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
            Tất cả ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={activeTab === 'history' ? Colors.primary : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {formExpanded && (
          <View style={{ marginBottom: 16 }}>
            <MedicationForm
              key={editing ? editing.id : 'new-med'}
              currentElderlyId={currentElderlyId}
              currentElderlyName={currentElderlyName}
              editing={editing}
              onClose={() => {
                setFormExpanded(false);
                setEditing(null);
                if (currentElderlyId) loadMedications(currentElderlyId);
              }}
            />
          </View>
        )}

        {isLoading && items.length === 0 ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách thuốc...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'today' && (
              <>
                <ComplianceCard
                  displayAdherence={displayAdherence}
                  rangeDays={rangeDays}
                  onOpenRangePicker={() => setRangePickerVisible(true)}
                />
                <View style={{ height: 18 }} />
                <Text style={styles.sectionHeading}>Danh sách liều dùng trong ngày</Text>
                <View style={{ height: 10 }} />
                {renderMedList('Chưa có lịch uống thuốc nào cho hôm nay')}
              </>
            )}

            {activeTab === 'list' && (
              <>
                <Text style={styles.sectionHeading}>Tất cả các loại thuốc đang dùng</Text>
                <View style={{ height: 10 }} />
                {renderMedList('Chưa thiết lập danh sách thuốc nào')}
              </>
            )}

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

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Range Picker Modal */}
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
          <View style={styles.rangeDialog}>
            <Text style={styles.rangeDialogTitle}>Khoảng thời gian theo dõi</Text>
            <TouchableOpacity
              style={styles.rangeOption}
              onPress={() => {
                setRangeDays(7);
                setRangePickerVisible(false);
              }}
            >
              <Text style={styles.rangeOptionText}>7 ngày gần nhất</Text>
              {rangeDays === 7 && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rangeOption}
              onPress={() => {
                setRangeDays(30);
                setRangePickerVisible(false);
              }}
            >
              <Text style={styles.rangeOptionText}>30 ngày gần nhất</Text>
              {rangeDays === 30 && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appBarTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  appBarSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 2, fontWeight: '500' },
  addTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  addTopBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  tabButtonActive: { backgroundColor: '#E6F7F5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: Colors.primary, fontWeight: '800' },

  scroll: { padding: 18 },
  sectionHeading: { fontSize: 16.5, fontWeight: '800', color: '#0F172A' },
  centerPad: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },

  emptyBox: {
    padding: 32,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  rangeDialog: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  rangeDialogTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  rangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rangeOptionText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
});
