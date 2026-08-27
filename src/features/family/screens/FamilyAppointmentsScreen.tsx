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
  // Bumped on every open so AppointmentFormSheet remounts with fresh state.
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
            onComplete={() => handleStatus(item.id, 'COMPLETED')}
            onCancel={() => handleStatus(item.id, 'CANCELLED')}
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

      <AppointmentFormSheet
        key={sheetNonce}
        visible={sheetVisible}
        editing={editing}
        currentElderlyId={currentElderlyId}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
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
});
