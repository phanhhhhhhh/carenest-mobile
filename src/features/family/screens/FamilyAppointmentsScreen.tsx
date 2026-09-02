import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { showErrorToast } from '../../../shared/components/toastStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import type { AppointmentItem } from '../../../shared/types';
import { AppointmentCard } from './familyAppointments/AppointmentCard';
import { AppointmentFormSheet } from './familyAppointments/AppointmentFormSheet';

export default function FamilyAppointmentsScreen() {
  const isLoading = useAppointmentStore((s) => s.isLoading);
  const error = useAppointmentStore((s) => s.error);
  const appointments = useAppointmentStore((s) => s.appointments);
  const load = useAppointmentStore((s) => s.load);
  const upcoming = useAppointmentStore((s) => s.upcoming);
  const past = useAppointmentStore((s) => s.past);
  const remove = useAppointmentStore((s) => s.delete);
  const updateStatus = useAppointmentStore((s) => s.updateStatus);

  const dashData = useFamilyDashboardStore((s) => s.data);
  const dashLoad = useFamilyDashboardStore((s) => s.load);
  const currentElderly = useMemo(() => {
    if (!dashData || dashData.linkedElderly.length === 0) return null;
    if (dashData.selectedIndex >= dashData.linkedElderly.length) return null;
    return dashData.linkedElderly[dashData.selectedIndex];
  }, [dashData]);
  const currentElderlyId = currentElderly?.elderlyId ?? null;
  const currentElderlyName = currentElderly?.elderlyName ?? 'Người thân';

  const [tab, setTab] = useState<0 | 1>(0);
  const [refreshing, setRefreshing] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<AppointmentItem | null>(null);
  const [sheetNonce, setSheetNonce] = useState(0);

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
    const state = useAppointmentStore.getState();
    if (state.error && state.appointments.length > 0) {
      showErrorToast(state.error);
    }
  };

  const openAddSheet = () => {
    setEditing(null);
    setSheetNonce((n) => n + 1);
    setSheetVisible(true);
  };

  const openEditSheet = (item: AppointmentItem) => {
    setEditing(item);
    setSheetNonce((n) => n + 1);
    setSheetVisible(true);
  };

  const confirmDelete = (item: AppointmentItem) => {
    Alert.alert('Xóa lịch hẹn', `Bạn có chắc chắn muốn xóa lịch hẹn với "${item.doctor}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const ok = await remove(item.id);
          if (!ok) {
            showErrorToast(useAppointmentStore.getState().error ?? 'Không thể xóa lịch hẹn');
          }
        },
      },
    ]);
  };

  const handleStatus = async (id: string, status: string) => {
    const ok = await updateStatus(id, status);
    if (!ok) {
      showErrorToast(
        useAppointmentStore.getState().error ?? 'Không thể cập nhật trạng thái lịch hẹn',
      );
    }
  };

  const renderList = (items: AppointmentItem[], showActions: boolean) => {
    if (items.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          <Image
            source={require('../../../../assets/mascot/mascot_confused.jpg')}
            style={{ width: 130, height: 130, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>Chưa có lịch hẹn khám nào</Text>
          <Text style={styles.emptySubtext}>
            Bấm nút {'“'}Thêm lịch hẹn{'”'} để tạo lịch khám mới
          </Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            showActions={showActions}
            onEdit={() => openEditSheet(item)}
            onDelete={() => confirmDelete(item)}
            onComplete={() => handleStatus(item.id, 'COMPLETED')}
            onCancel={() => handleStatus(item.id, 'CANCELLED')}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.appBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appBarTitle}>Lịch hẹn khám bệnh</Text>
          <Text style={styles.appBarSubtitle}>Người thân: {currentElderlyName}</Text>
        </View>
        <TouchableOpacity style={styles.addTopBtn} onPress={openAddSheet} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addTopBtnText}>Thêm lịch hẹn</Text>
        </TouchableOpacity>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 0 && styles.tabButtonActive]}
          onPress={() => setTab(0)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={tab === 0 ? Colors.primary : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, tab === 0 && styles.tabTextActive]}>
            Sắp tới ({upcomingList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, tab === 1 && styles.tabButtonActive]}
          onPress={() => setTab(1)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={16}
            color={tab === 1 ? Colors.primary : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, tab === 1 && styles.tabTextActive]}>
            Lịch sử khám ({pastList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && appointments.length === 0 ? (
        <View style={styles.centerPad}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
        </View>
      ) : error && appointments.length === 0 ? (
        <View style={styles.centerPad}>
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => load(currentElderlyId ?? undefined)}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderList(tab === 0 ? upcomingList : pastList, tab === 0)
      )}

      <AppointmentFormSheet
        key={sheetNonce}
        visible={sheetVisible}
        currentElderlyId={currentElderlyId}
        editing={editing}
        onClose={() => {
          setSheetVisible(false);
          setEditing(null);
          load(currentElderlyId ?? undefined);
        }}
      />
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

  listContent: { padding: 18 },
  centerPad: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  errorText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16.5, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySubtext: { fontSize: 13.5, color: '#64748B', marginTop: 4, textAlign: 'center' },
});
