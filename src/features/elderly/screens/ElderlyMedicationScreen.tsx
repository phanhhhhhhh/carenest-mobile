import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme';
import { useMedicationStore } from '../store/medicationStore';
import { snoozeOneOff, cancelSnooze } from '../../medication/services/medicationReminderService';
import { showErrorToast } from '../../../shared/components/toastStore';
import type { MedicationItem } from '../../../shared/types';
import { pad2, UPCOMING_WINDOW_MS } from './elderlyMedication/utils';
import { DueBanner } from './elderlyMedication/DueBanner';
import { MedRow } from './elderlyMedication/MedRow';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyMedicationScreen() {
  const navigation = useNavigation<Nav>();

  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const error = useMedicationStore((s) => s.error);
  const load = useMedicationStore((s) => s.load);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    const controller = new AbortController();
    load(undefined, controller.signal);
    return () => controller.abort();
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleTakeNow = (med: MedicationItem) => {
    cancelSnooze(med);
    toggleTaken(med.id, showErrorToast);
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

  const msUntilDue = dueNow?.nextDoseTime ? new Date(dueNow.nextDoseTime).getTime() - now : null;
  const reminderPhase: 'none' | 'upcoming' | 'due' = !dueNow
    ? 'none'
    : msUntilDue === null || msUntilDue <= 0
      ? 'due'
      : msUntilDue <= UPCOMING_WINDOW_MS
        ? 'upcoming'
        : 'none';
  const minutesUntilDue = msUntilDue !== null ? Math.max(1, Math.ceil(msUntilDue / 60_000)) : null;

  const sortedItems = [...items].sort((a, b) => {
    const at = a.nextDoseTime ? new Date(a.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.nextDoseTime ? new Date(b.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt;
  });

  const takenCount = items.filter((m) => m.taken).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.appBar}>
        <View>
          <Text style={styles.appBarTitle}>Lịch uống thuốc</Text>
          <Text style={styles.appBarSub}>
            Hôm nay: {takenCount}/{items.length} liều đã uống
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => load()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải lịch thuốc...</Text>
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={54} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {dueNow && reminderPhase !== 'none' && (
            <>
              <DueBanner
                med={dueNow}
                phase={reminderPhase}
                minutesUntilDue={minutesUntilDue}
                dueTimeLabel={dueTimeLabel}
                onTakeNow={handleTakeNow}
                onSnooze={handleSnooze}
              />
              <View style={{ height: 20 }} />
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh sách thuốc hôm nay</Text>
            <Text style={styles.sectionHint}>Nhấn vào thuốc để xem lịch sử</Text>
          </View>

          <View style={{ height: 12 }} />

          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Image
                source={require('../../../../assets/mascot/mascot_thumbsup_stethoscope.jpg')}
                style={{ width: 140, height: 140, marginBottom: 12 }}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Chưa có thuốc nào trong danh sách</Text>
              <Text style={styles.emptyText}>
                Người thân hoặc bác sĩ có thể thêm lịch uống thuốc cho Bác.
              </Text>
            </View>
          ) : (
            sortedItems.map((m) => (
              <MedRow
                key={m.id}
                item={m}
                onPress={() =>
                  navigation.navigate('ElderlyMedicationHistory', {
                    medicationId: m.id,
                    medicationName: m.name,
                  })
                }
              />
            ))
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appBarTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  appBarSub: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500' },
  errorText: { color: '#64748B', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 20 },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  emptyCard: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
