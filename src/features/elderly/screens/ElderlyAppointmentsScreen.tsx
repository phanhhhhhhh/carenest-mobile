import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useAppointmentStore } from '../../family/store/appointmentStore';
import type { AppointmentItem } from '../../../shared/types';
import { AppointmentCard } from './elderlyAppointments/AppointmentCard';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function ElderlyAppointmentsScreen() {
  const navigation = useNavigation();
  const isLoading = useAppointmentStore((s) => s.isLoading);
  const error = useAppointmentStore((s) => s.error);
  const appointments = useAppointmentStore((s) => s.appointments);
  const load = useAppointmentStore((s) => s.load);
  const upcoming = useAppointmentStore((s) => s.upcoming);
  const past = useAppointmentStore((s) => s.past);

  const [tab, setTab] = useState<0 | 1>(0);
  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    const controller = new AbortController();
    load(undefined, controller.signal);
    return () => controller.abort();
  });

  const upcomingList = upcoming();
  const pastList = past();

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderList = (items: AppointmentItem[]) => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Image
            source={require('../../../../assets/mascot/mascot_confused.jpg')}
            style={{ width: 140, height: 140, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>
            {tab === 0 ? 'Bác chưa có lịch hẹn khám sắp tới' : 'Chưa có lịch khám đã hoàn thành'}
          </Text>
          <Text style={styles.emptyText}>
            Lịch tái khám định kỳ sẽ được người thân cập nhật tại đây.
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <AppointmentCard item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch hẹn khám của Bác</Text>
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 0 && styles.tabItemActive]}
          onPress={() => setTab(0)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={tab === 0 ? Colors.primary : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, tab === 0 && styles.tabTextActive]}>
            Sắp tới ({upcomingList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 1 && styles.tabItemActive]}
          onPress={() => setTab(1)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={18}
            color={tab === 1 ? Colors.primary : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, tab === 1 && styles.tabTextActive]}>
            Đã khám ({pastList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && appointments.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
        </View>
      ) : error && appointments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" color="#EF4444" size={54} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderList(tab === 0 ? upcomingList : pastList)
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  tabItemActive: {
    backgroundColor: '#E6F7F5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  listContent: { padding: 18 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500' },
  errorText: { color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
});
