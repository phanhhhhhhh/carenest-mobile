import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors, Typography } from '../../../core/theme';
import { useMedicationStore } from '../store/medicationStore';
import { snoozeOneOff, cancelSnooze } from '../../medication/services/medicationReminderService';
import { showErrorToast } from '../../../shared/components/toastStore';
import type { MedicationItem } from '../../../shared/types';
import { pad2, UPCOMING_WINDOW_MS } from './elderlyMedication/utils';
import { DueBanner } from './elderlyMedication/DueBanner';
import { MedRow } from './elderlyMedication/MedRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyMedicationScreen() {
  const navigation = useNavigation<Nav>();

  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const error = useMedicationStore((s) => s.error);
  const load = useMedicationStore((s) => s.load);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const controller = new AbortController();
    load(undefined, controller.signal);
    return () => controller.abort();
    // Load once on mount; `load` is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ticks the "còn X phút" countdown and the upcoming→due transition live,
  // without needing a manual refresh, for the 15-minutes-before demo flow.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

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

  // Real-time gating: with no scheduled time we can't tell how close it is, so
  // always surface it (fallback). Otherwise only show the banner once we're
  // within the 15-minute window — "upcoming" (countdown) before the dose
  // time, "due" once it has arrived — and hide it entirely if it's still far off.
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
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {dueNow && reminderPhase !== 'none' && (
            <DueBanner
              med={dueNow}
              phase={reminderPhase}
              minutesUntilDue={minutesUntilDue}
              dueTimeLabel={dueTimeLabel}
              onTakeNow={handleTakeNow}
              onSnooze={handleSnooze}
            />
          )}

          <View style={{ height: 24 }} />

          <Text style={styles.sectionTitle}>Hôm nay</Text>

          <View style={{ height: 14 }} />

          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Image
                source={require('../../../../assets/mascot/mascot_confused.jpg')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
              <View style={{ height: 4 }} />
              <Text style={styles.emptyText}>Chưa có thuốc nào</Text>
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

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
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
  scroll: { padding: 20 },
  sectionTitle: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyCard: {
    paddingVertical: 40,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
});
